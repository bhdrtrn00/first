import type { AgentConfig } from '../../types.js';

export const groundTransportManagerAgent: AgentConfig = {
  id: 'ground-transport-manager',
  title: 'Ground Transport Manager',
  department: 'operations',
  tier: 'manager',
  maxTokens: 1536,
  collaborators: ['dispatch-coordinator', 'warehouse-manager', 'customs-manager', 'coo'],
  systemPrompt: `You are the Ground Transport Manager at GlobalForward Freight Co.

Your expertise covers:
- FTL (Full Truck Load), LTL (Less than Truck Load), and intermodal rail
- European CMR convention and US domestic trucking regulations (FMCSA, Hours of Service)
- Cross-border trucking: T1/T2 customs transit documents, TIR Carnet
- ADR (European Agreement for Dangerous Goods by Road) and HAZMAT compliance
- Driver management, carrier vetting, and spot rate negotiation
- Last-mile delivery, white glove services, temperature-controlled transport

You manage a carrier network including DB Schenker, DHL Freight, DSV, and regional carriers.
You understand cab weight limits, vehicle categories (Class 8, HGV), and load optimization.

For warehouse coordination:
HANDOFF_TO: warehouse-manager | REASON: Pickup/delivery coordination | URGENCY: normal

For cross-border customs transit:
HANDOFF_TO: customs-manager | REASON: Transit document required | URGENCY: high`,
  tools: [
    {
      name: 'get_ground_transport_rate',
      description: 'Get truck freight rates for FTL, LTL, or intermodal',
      input_schema: {
        type: 'object' as const,
        properties: {
          origin: { type: 'string' },
          destination: { type: 'string' },
          mode: { type: 'string', enum: ['FTL', 'LTL', 'Intermodal', 'Express'] },
          weight_kg: { type: 'number' },
          volume_cbm: { type: 'number' },
          adr: { type: 'boolean', description: 'Dangerous goods (ADR required)' },
        },
        required: ['origin', 'destination', 'mode'],
      },
    },
    {
      name: 'run_route_optimization',
      description: 'Optimize truck route for multi-stop delivery or cost efficiency',
      input_schema: {
        type: 'object' as const,
        properties: {
          origin: { type: 'string' },
          destination: { type: 'string' },
          optimization_target: {
            type: 'string',
            enum: ['cost', 'speed', 'co2', 'balanced'],
          },
        },
        required: ['origin', 'destination', 'optimization_target'],
      },
    },
    {
      name: 'track_shipment',
      description: 'Track a truck shipment by CMR number or tracking ID',
      input_schema: {
        type: 'object' as const,
        properties: {
          shipment_id: { type: 'string' },
          mode: { type: 'string', enum: ['air', 'ocean', 'ground', 'unknown'] },
        },
        required: ['shipment_id'],
      },
    },
  ],
};
