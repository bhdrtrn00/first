/**
 * demo.ts — Main entry point for the GlobalForward Freight Agent System
 *
 * Demonstrates 5 representative freight scenarios spanning different departments.
 * Each scenario shows a different routing path through the 24-agent network.
 *
 * Prerequisites:
 *   cp .env.example .env   # then set ANTHROPIC_API_KEY in .env
 *
 * Run (dev):   node --env-file=.env --import tsx/esm src/demo.ts
 * Run (built): npm run build && node --env-file=.env dist/demo.js
 */

import { Orchestrator } from './orchestrator.js';
import { buildAgentRegistry } from './agents/index.js';
import { messageBus } from './messageBus.js';

// ── Observability: log all handoff events to console ─────────────────────────
messageBus.subscribe((event) => {
  const ts = event.timestamp.toISOString().slice(11, 19);
  if (event.type === 'handoff') {
    const to = (event.payload as { toAgent: string }).toAgent;
    console.log(`  [${ts}] HANDOFF  ${event.agentId} → ${to}`);
  }
  if (event.type === 'error') {
    console.error(`  [${ts}] ERROR    ${event.agentId}:`, event.payload);
  }
});

async function main() {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY environment variable is not set.');
    console.error('  Copy .env.example to .env and add your key, then re-run.');
    process.exit(1);
  }

  const registry = buildAgentRegistry();

  console.log('\n' + '█'.repeat(62));
  console.log('  GlobalForward Freight Co. — Multi-Agent System');
  console.log('  24 Agents | Orchestrator | claude-sonnet-4-6');
  console.log(`  Agents registered: ${registry.size}`);
  console.log('█'.repeat(62));

  const orchestrator = new Orchestrator(apiKey, registry, {
    maxHandoffDepth: 4,
    handoffTimeoutMs: 60_000,
    enableParallelRouting: false,
  });

  // ── Scenario 1: Ocean freight quotation ───────────────────────────────────
  console.log('\n\n━━━ SCENARIO 1: Ocean Freight Quotation ━━━');
  await orchestrator.handle(
    'We need a quote for shipping 2x 40HC containers of automotive parts from Shanghai ' +
    'to Rotterdam on FOB terms. Cargo value is approximately $800,000. What are the ' +
    'current market rates, expected transit time, and what surcharges apply?',
    {
      origin: 'Shanghai',
      destination: 'Rotterdam',
      cargoType: 'Automotive parts',
      value: 800_000,
      currency: 'USD',
      incoterms: 'FOB',
    },
    'normal',
  );

  // ── Scenario 2: Customs classification ────────────────────────────────────
  console.log('\n\n━━━ SCENARIO 2: Customs HS Code Classification ━━━');
  await orchestrator.handle(
    'We need help classifying our new product for import into Germany. It is a portable ' +
    'IoT device that combines GPS tracking with cellular communication for asset monitoring. ' +
    'It is manufactured in China. What HS code applies, what are the EU duty rates, ' +
    'and are there any dual-use restrictions we should know about?',
    {
      origin: 'China',
      destination: 'Germany',
      cargoType: 'IoT tracking device',
      customsRequired: true,
    },
    'normal',
  );

  // ── Scenario 3: Urgent shipment tracking ─────────────────────────────────
  console.log('\n\n━━━ SCENARIO 3: Urgent Pharmaceutical Tracking ━━━');
  await orchestrator.handle(
    'URGENT: Our pharmaceutical shipment AWB 020-87654321 departed Frankfurt 3 days ago ' +
    'and was supposed to arrive in Chicago yesterday. We have received no update. ' +
    'This is temperature-sensitive clinical trial material worth $450,000. ' +
    'What is the current status and what are the next steps?',
    {
      shipmentId: 'AWB-020-87654321',
      cargoType: 'Pharmaceuticals — temperature sensitive',
      origin: 'Frankfurt',
      destination: 'Chicago',
      value: 450_000,
    },
    'urgent',
  );

  // ── Scenario 4: Risk and insurance assessment ─────────────────────────────
  console.log('\n\n━━━ SCENARIO 4: Risk Assessment & Insurance ━━━');
  await orchestrator.handle(
    'We are planning to ship $2.5 million worth of consumer electronics from Hong Kong ' +
    'to São Paulo by sea. The cargo will transit through the Panama Canal. ' +
    'Please assess the risks involved and provide an insurance quotation. ' +
    'The client wants ICC-A coverage.',
    {
      origin: 'Hong Kong',
      destination: 'São Paulo',
      cargoType: 'Consumer electronics',
      value: 2_500_000,
      currency: 'USD',
      insuranceRequired: true,
    },
    'high',
  );

  // ── Scenario 5: Strategic executive query ────────────────────────────────
  console.log('\n\n━━━ SCENARIO 5: Strategic Expansion Analysis ━━━');
  await orchestrator.handle(
    'We are considering expanding our ocean freight operations to add direct services ' +
    'on the Asia-West Africa trade lane (Shanghai to Lagos). What is our current ' +
    'financial performance, what are the key strategic and risk considerations, ' +
    'and how does this compare to our existing lane performance?',
    {},
    'normal',
  );

  // ── Session summary ───────────────────────────────────────────────────────
  const log = messageBus.getLog();
  const handoffs = log.filter(e => e.type === 'handoff');
  const completions = log.filter(e => e.type === 'completed');
  const errors = log.filter(e => e.type === 'error');

  console.log('\n\n' + '─'.repeat(62));
  console.log('SESSION SUMMARY');
  console.log('─'.repeat(62));
  console.log(`Scenarios run:       5`);
  console.log(`Total bus events:    ${log.length}`);
  console.log(`Agent completions:   ${completions.length}`);
  console.log(`Handoffs executed:   ${handoffs.length}`);
  console.log(`Errors:              ${errors.length}`);
  console.log('─'.repeat(62));
  console.log('\nTo run with your own requests, import Orchestrator from');
  console.log('"./orchestrator.js" and call orchestrator.handle(yourRequest).\n');
}

main().catch((err: unknown) => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
