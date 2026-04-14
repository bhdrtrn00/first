import Anthropic from '@anthropic-ai/sdk';
import type {
  AgentConfig,
  AgentMessage,
  AgentResponse,
  ToolCallResult,
  HandoffInstruction,
  AgentId,
} from './types.js';
import { messageBus } from './messageBus.js';
import {
  getFreightEstimate,
  formatEstimate,
  resolveContainerType,
} from './freightosClient.js';

const MODEL = 'claude-sonnet-4-6';

/**
 * The AgentRunner executes a single agent's turn using the Anthropic Messages API.
 *
 * It handles:
 *  - Injecting the agent's system prompt
 *  - Providing the agent's tools
 *  - Running the agentic tool-use loop until stop_reason is 'end_turn'
 *  - Detecting handoff instructions embedded in the agent's text output
 *  - Returning a fully-typed AgentResponse
 */
export class AgentRunner {
  private client: Anthropic;
  private freightosApiKey: string | undefined;
  private freightosSandbox: boolean;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
    this.freightosApiKey = process.env['FREIGHTOS_API_KEY'];
    this.freightosSandbox = process.env['FREIGHTOS_SANDBOX'] === 'true';
  }

  async run(
    config: AgentConfig,
    message: AgentMessage,
  ): Promise<AgentResponse> {
    messageBus.emitReceived(config.id, message.id);

    // Build message history: inject handoff context as a system note if present
    const userContent = message.isHandoff && message.handoffContext
      ? `[HANDOFF FROM ${message.fromAgent.toUpperCase()}]\n${message.handoffContext}\n\n---\n\n${message.content}`
      : message.content;

    const messages: Anthropic.MessageParam[] = [
      ...message.conversationHistory,
      { role: 'user', content: userContent },
    ];

    const toolCallResults: ToolCallResult[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let finalText = '';
    let handoff: HandoffInstruction | undefined;

    // Tool-use agentic loop
    let currentMessages = [...messages];
    while (true) {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: config.maxTokens,
        system: config.systemPrompt,
        tools: config.tools,
        messages: currentMessages,
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      // Collect text content
      const textBlocks = response.content.filter(
        (b): b is Anthropic.TextBlock => b.type === 'text'
      );
      for (const block of textBlocks) {
        finalText += block.text;
      }

      // If no tool calls, we are done
      if (response.stop_reason === 'end_turn') {
        break;
      }

      // Handle tool_use blocks
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      );

      if (toolUseBlocks.length === 0) break;

      // Append assistant message with tool calls
      currentMessages.push({ role: 'assistant', content: response.content });

      // Simulate tool execution and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        const result = await this.executeSimulatedTool(
          config.id,
          toolUse.name,
          toolUse.input as Record<string, unknown>,
        );
        toolCallResults.push({
          toolName: toolUse.name,
          toolUseId: toolUse.id,
          input: toolUse.input as Record<string, unknown>,
          output: result,
        });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result,
        });
      }

      currentMessages.push({ role: 'user', content: toolResults });
    }

    // Detect handoff instruction embedded in final text.
    // Agents signal handoffs with a structured marker:
    // HANDOFF_TO: <agent-id> | REASON: <reason> | URGENCY: <priority>
    const handoffMatch = finalText.match(
      /HANDOFF_TO:\s*([a-z-]+)\s*\|\s*REASON:\s*([^|]+)\s*\|\s*URGENCY:\s*(low|normal|high|urgent)/i
    );
    if (handoffMatch) {
      handoff = {
        targetAgent: handoffMatch[1] as AgentId,
        reason: handoffMatch[2].trim(),
        urgency: handoffMatch[3].toLowerCase() as 'low' | 'normal' | 'high' | 'urgent',
        contextSummary: finalText,
      };
    }

    const updatedHistory: Anthropic.MessageParam[] = [
      ...currentMessages,
      { role: 'assistant', content: finalText },
    ];

    const agentResponse: AgentResponse = {
      agentId: config.id,
      messageId: message.id,
      timestamp: new Date(),
      status: handoff ? 'handoff-required' : 'completed',
      content: finalText,
      toolCallResults,
      handoff,
      updatedHistory,
      usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
    };

    if (handoff) {
      messageBus.emitHandoff(config.id, handoff.targetAgent, message.id);
    } else {
      messageBus.emitCompleted(config.id, message.id, finalText.slice(0, 120));
    }

    return agentResponse;
  }

  /**
   * Executes a tool call. Live integrations (Freightos) are used when API keys
   * are present; all other tools fall back to domain-realistic simulation.
   */
  private async executeSimulatedTool(
    agentId: AgentId,
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<string> {
    console.log(`  [TOOL] ${agentId} -> ${toolName}(${JSON.stringify(input)})`);

    // ── Live: Freightos Rate Estimator API ───────────────────────────────────
    if (toolName === 'get_ocean_freight_rate' && this.freightosApiKey) {
      try {
        const resp = await getFreightEstimate(this.freightosApiKey, {
          originName:      String(input['origin'] ?? ''),
          destinationName: String(input['destination'] ?? ''),
          quantity:        Number(input['quantity'] ?? 1),
          containerType:   String(input['container_type'] ?? '40HC'),
          mode: 'ocean',
          useSandbox: this.freightosSandbox,
        });
        const result = formatEstimate(
          { originName: String(input['origin']), destinationName: String(input['destination']),
            quantity: Number(input['quantity'] ?? 1), containerType: String(input['container_type'] ?? '40HC'), mode: 'ocean' },
          resp, 'OCEAN',
        );
        console.log(`  [LIVE]  Freightos OCEAN: $${result.priceMin}–$${result.priceMax} USD | ${result.transitDaysMin}–${result.transitDaysMax} days`);
        return JSON.stringify(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`  [WARN]  Freightos live call failed (${msg}), using simulation`);
      }
    }

    if (toolName === 'get_air_freight_rate' && this.freightosApiKey) {
      try {
        const weightKg = Number(input['weight_kg'] ?? 100);
        const resp = await getFreightEstimate(this.freightosApiKey, {
          originName:      String(input['origin'] ?? ''),
          destinationName: String(input['destination'] ?? ''),
          quantity:        1,
          weightKg,
          mode: 'air',
          useSandbox: this.freightosSandbox,
        });
        const result = formatEstimate(
          { originName: String(input['origin']), destinationName: String(input['destination']),
            quantity: 1, weightKg, mode: 'air' },
          resp, 'AIR',
        );
        console.log(`  [LIVE]  Freightos AIR: $${result.priceMin}–$${result.priceMax} USD | ${result.transitDaysMin}–${result.transitDaysMax} days`);
        return JSON.stringify(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`  [WARN]  Freightos live call failed (${msg}), using simulation`);
      }
    }

    // ── Simulation fallback ───────────────────────────────────────────────────
    const simulations: Record<string, (i: Record<string, unknown>) => string> = {
      get_air_freight_rate: (i) =>
        JSON.stringify({ rate_usd_per_kg: 4.85, transit_days: 3, airline: 'Lufthansa Cargo', origin: i['origin'], destination: i['destination'], surcharges: { fuel: 0.65, security: 0.10 }, _source: 'simulation' }),
      get_ocean_freight_rate: (i) => {
        const ct = resolveContainerType(String(i['container_type'] ?? '40HC'));
        return JSON.stringify({ rate_usd_per_container: 2400, container_type: ct, transit_days: 28, carrier: 'Maersk', service: 'AE-1', origin: i['origin'], destination: i['destination'], surcharges: { baf: 250, thc_origin: 180, thc_dest: 210 }, _source: 'simulation' });
      },
      get_ground_transport_rate: (i) =>
        JSON.stringify({ rate_usd: 850, transit_days: 2, carrier: 'XPO Logistics', mode: i['mode'] ?? 'FTL', fuel_surcharge_pct: 18 }),
      track_shipment: (i) =>
        JSON.stringify({ shipment_id: i['shipment_id'], status: 'In Transit', last_event: 'Departed Frankfurt hub', eta: '2026-04-16', location: 'FRA Hub', events: [{ ts: '2026-04-13T06:00Z', event: 'Departed FRA' }, { ts: '2026-04-12T22:00Z', event: 'Customs cleared' }] }),
      check_hs_code: (i) =>
        JSON.stringify({ hs_code: '8471.30', description: 'Portable ADP machine', duty_rate_mfn: '0%', vat_rate: '20%', restrictions: 'None', product: i['product'], dual_use: false }),
      get_customs_tariff: (i) =>
        JSON.stringify({ tariff_mfn: '0%', tariff_fta: '0%', anti_dumping: 'N/A', countervailing: 'N/A', country: i['country'], hs_code: i['hs_code'], notes: 'EU-China MFN rate applies' }),
      submit_customs_declaration: (i) =>
        JSON.stringify({ declaration_id: `CUS-2026-${Math.floor(Math.random() * 100000)}`, status: 'Submitted', expected_clearance: '2026-04-14', shipment_id: i['shipment_id'] }),
      generate_bill_of_lading: (i) =>
        JSON.stringify({ bl_number: `MSCUG${Date.now().toString().slice(-8)}`, shipper: i['shipper'], consignee: i['consignee'], status: 'Draft generated', bl_type: i['bl_type'] ?? 'negotiable' }),
      generate_commercial_invoice: (i) =>
        JSON.stringify({ invoice_id: `INV-${Date.now()}`, amount: i['amount'], currency: i['currency'] ?? 'USD', status: 'Draft generated', incoterms: i['incoterms'] }),
      check_document_completeness: (i) =>
        JSON.stringify({ complete: true, missing_docs: [], warnings: [], shipment_id: i['shipment_id'], checked_at: new Date().toISOString() }),
      check_warehouse_availability: (i) =>
        JSON.stringify({ available_sqm: 450, temperature_controlled: true, hazmat_certified: false, bonded: true, location: i['location'] ?? 'Frankfurt-Nord', available_from: '2026-04-14' }),
      create_warehouse_booking: (i) =>
        JSON.stringify({ booking_id: `WH-${Date.now()}`, confirmed: true, location: i['location'], from: i['from'], to: i['to'], rate_per_sqm_per_day: 2.50 }),
      check_inventory: (i) =>
        JSON.stringify({ sku: i['sku'] ?? 'N/A', quantity: 142, location: 'Bay-C12', last_updated: new Date().toISOString(), client_id: i['client_id'] }),
      get_financial_report: (_i) =>
        JSON.stringify({ revenue_ytd_usd: 12_500_000, gross_margin_pct: 18.4, ebitda_pct: 9.2, outstanding_ar_usd: 1_340_000, dso_days: 38, period: 'Q1-2026' }),
      calculate_profitability: (i) =>
        JSON.stringify({ shipment_id: i['shipment_id'], revenue_usd: i['revenue'], cost_usd: Number(i['revenue']) * 0.78, contribution_margin_pct: 22, lane: i['lane'] }),
      get_client_profile: (i) =>
        JSON.stringify({ client_id: i['client_id'], name: 'Acme Imports GmbH', segment: 'Mid-market', volume_ytd_kg: 45_000, revenue_ytd_usd: 320_000, credit_limit_usd: 250_000, preferred_mode: 'Ocean', nps_score: 68 }),
      generate_quote: (i) =>
        JSON.stringify({ quote_id: `QTE-${Date.now()}`, valid_until: '2026-04-20', total_usd: 3_450, breakdown: { freight: 2_800, customs: 350, handling: 300 }, origin: i['origin'], destination: i['destination'], mode: i['mode'] }),
      assess_cargo_risk: (i) =>
        JSON.stringify({ risk_score: 42, risk_level: 'Medium', factors: ['High-value cargo', 'Multi-country transit'], recommendations: ['ICC-A coverage recommended', 'GPS tracking advised'], cargo: i['cargo_type'] }),
      get_insurance_quote: (i) =>
        JSON.stringify({ premium_usd: Number(i['value']) * 0.0035, coverage_usd: i['value'], deductible_usd: 500, provider: 'Allianz Trade', icc_clause: 'A', valid_days: 30, includes_war: false }),
      generate_performance_report: (_i) =>
        JSON.stringify({ on_time_delivery_pct: 94.2, avg_transit_days: 4.1, customer_satisfaction_nps: 65, shipments_this_month: 342, revenue_per_shipment_usd: 1_820, co2_tonnes: 48.3 }),
      run_route_optimization: (i) =>
        JSON.stringify({ optimal_route: `${i['origin']} -> HUB-FRA -> ${i['destination']}`, savings_pct: 12, co2_kg: 340, transit_days: 3, recommendation: 'Use consolidated ocean via Rotterdam for cost, direct air for speed' }),
      check_system_status: (_i) =>
        JSON.stringify({ tms_cargowise: 'Operational', customs_portal_eu: 'Operational', customs_portal_us: 'Operational', tracking_api: 'Degraded (200ms latency spike)', wms: 'Operational', last_checked: new Date().toISOString() }),
      create_support_ticket: (i) =>
        JSON.stringify({ ticket_id: `IT-${Date.now()}`, priority: i['priority'] ?? 'Normal', assigned_to: 'IT Team', sla_hours: 4, description: i['description'] }),
    };

    const handler = simulations[toolName];
    if (handler) return handler(input);

    return JSON.stringify({ status: 'ok', tool: toolName, note: 'Simulated response — no specific handler registered' });
  }
}
