import type { AgentConfig } from '../../types.js';

export const airFreightManagerAgent: AgentConfig = {
  id: 'air-freight-manager',
  title: 'Air Freight Manager',
  department: 'operations',
  tier: 'manager',
  maxTokens: 2048,
  collaborators: ['dispatch-coordinator', 'customs-manager', 'documentation-manager', 'coo'],
  systemPrompt: `You are the Air Freight Manager at GlobalForward Freight Co.

Your expertise covers:
- IATA regulations and airline alliances (Star Alliance Cargo, SkyTeam Cargo, oneworld)
- Airway Bill (AWB) preparation and management
- IATA Dangerous Goods Regulations (DGR) — you hold a DGR specialist certification
- ULD (Unit Load Device) planning and weight/balance optimization
- Air cargo security (TAPA, CEIV Pharma for cold chain)
- Key airport hubs: FRA, AMS, HKG, PVG, ORD, JFK, LAX, DXB, SIN

You manage bookings on Lufthansa Cargo, Air France-KLM Cargo, Cathay Pacific Cargo,
Emirates SkyCargo, and Cargolux. You understand general cargo vs. express vs. charter nuances.

Key metrics: kg utilization per flight, revenue per AWB, freight yield (USD/RTK).

Always verify: Is the shipment DG? Does it need cold chain? Is documentation complete?

For customs at destination:
HANDOFF_TO: customs-manager | REASON: Destination customs pre-filing required | URGENCY: normal

For documentation issues:
HANDOFF_TO: documentation-manager | REASON: Air freight documentation required | URGENCY: high`,
  tools: [
    {
      name: 'get_air_freight_rate',
      description: 'Get current air freight spot rates for a lane including all surcharges',
      input_schema: {
        type: 'object' as const,
        properties: {
          origin: { type: 'string', description: 'IATA airport code, e.g. FRA' },
          destination: { type: 'string', description: 'IATA airport code, e.g. JFK' },
          weight_kg: { type: 'number' },
          cargo_type: {
            type: 'string',
            enum: ['general', 'pharma', 'dangerous_goods', 'live_animals', 'perishable', 'valuables'],
          },
        },
        required: ['origin', 'destination', 'weight_kg'],
      },
    },
    {
      name: 'track_shipment',
      description: 'Track an air shipment by AWB number',
      input_schema: {
        type: 'object' as const,
        properties: {
          shipment_id: { type: 'string', description: 'AWB number e.g. 020-12345678' },
          mode: { type: 'string', enum: ['air', 'ocean', 'ground', 'unknown'] },
        },
        required: ['shipment_id'],
      },
    },
    {
      name: 'check_document_completeness',
      description: 'Verify all required air freight documents are present and valid',
      input_schema: {
        type: 'object' as const,
        properties: {
          shipment_id: { type: 'string' },
          doc_types: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['awb', 'commercial_invoice', 'packing_list', 'dg_declaration',
                'certificate_of_origin', 'health_cert', 'shippers_declaration'],
            },
          },
        },
        required: ['shipment_id'],
      },
    },
  ],
};
