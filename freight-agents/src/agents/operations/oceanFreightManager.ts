import type { AgentConfig } from '../../types.js';

export const oceanFreightManagerAgent: AgentConfig = {
  id: 'ocean-freight-manager',
  title: 'Ocean Freight Manager',
  department: 'operations',
  tier: 'manager',
  maxTokens: 2048,
  collaborators: ['dispatch-coordinator', 'customs-manager', 'documentation-manager',
    'bill-of-lading-specialist', 'coo'],
  systemPrompt: `You are the Ocean Freight Manager at GlobalForward Freight Co.

Your deep expertise covers:
- Container types: 20GP, 40GP, 40HC, 45HC, Reefer, Open Top, Flat Rack, Tank
- Incoterms 2020 (EXW, FOB, CIF, DDP, DAP, CPT, CFR) and their implications
- Bill of Lading: Negotiable vs. Straight B/L, Sea Waybill, Telex Release
- Ocean carrier alliances: 2M (Maersk/MSC), THE Alliance (Hapag-Lloyd/Yang Ming/HMM), Ocean Alliance
- Port congestion management, blank sailings, and schedule disruptions
- IMO regulations: SOLAS VGM, IMDG code for dangerous goods

You handle Trans-Pacific, Asia-Europe, Trans-Atlantic, and LATAM lanes.
You manage both FCL (Full Container Load) and LCL (Less than Container Load) bookings.

Key KPIs: TEU throughput, vessel utilization, lane profitability, on-time percentage.

For customs pre-arrival filings (AMS/ENS/AFR):
HANDOFF_TO: customs-manager | REASON: Pre-arrival filing required | URGENCY: high

For B/L issuance and amendments:
HANDOFF_TO: bill-of-lading-specialist | REASON: B/L document work required | URGENCY: normal`,
  tools: [
    {
      name: 'get_ocean_freight_rate',
      description: 'Get ocean freight rates including BAF, PSS, and all applicable surcharges',
      input_schema: {
        type: 'object' as const,
        properties: {
          origin: { type: 'string', description: 'Port or city, e.g. "Shanghai"' },
          destination: { type: 'string', description: 'Port or city, e.g. "Rotterdam"' },
          container_type: {
            type: 'string',
            enum: ['20GP', '40GP', '40HC', '45HC', 'Reefer', 'Open_Top'],
          },
          cargo_type: {
            type: 'string',
            enum: ['general', 'dangerous_goods', 'reefer', 'oog'],
          },
        },
        required: ['origin', 'destination', 'container_type'],
      },
    },
    {
      name: 'track_shipment',
      description: 'Track ocean shipment by container number or booking reference',
      input_schema: {
        type: 'object' as const,
        properties: {
          shipment_id: { type: 'string', description: 'Container number e.g. MSCU1234567 or booking ref' },
          mode: { type: 'string', enum: ['air', 'ocean', 'ground', 'unknown'] },
        },
        required: ['shipment_id'],
      },
    },
    {
      name: 'run_route_optimization',
      description: 'Find optimal ocean routing considering transit time, cost, and congestion',
      input_schema: {
        type: 'object' as const,
        properties: {
          origin: { type: 'string' },
          destination: { type: 'string' },
          optimization_target: {
            type: 'string',
            enum: ['cost', 'speed', 'co2', 'balanced'],
          },
          cargo_ready_date: { type: 'string', description: 'ISO date string' },
        },
        required: ['origin', 'destination', 'optimization_target'],
      },
    },
  ],
};
