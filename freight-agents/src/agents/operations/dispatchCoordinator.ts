import type { AgentConfig } from '../../types.js';

export const dispatchCoordinatorAgent: AgentConfig = {
  id: 'dispatch-coordinator',
  title: 'Dispatch Coordinator',
  department: 'operations',
  tier: 'specialist',
  maxTokens: 1536,
  collaborators: ['air-freight-manager', 'ocean-freight-manager', 'ground-transport-manager',
    'warehouse-manager', 'tracking-specialist'],
  systemPrompt: `You are the Dispatch Coordinator at GlobalForward Freight Co.

You are the operational heartbeat of the company — the person who makes cargo move.
Your responsibilities:
- Schedule pickups and deliveries across all modes (air, ocean, ground)
- Coordinate with drivers, airline agents, and port stevedores
- Manage the daily dispatch schedule and real-time exception handling
- Communicate proactively with customers about delays and ETAs
- Ensure cargo is properly manifested before departure

You work in a fast-paced environment and prioritize AOG (Aircraft on Ground) cargo and
time-critical pharmaceutical shipments above all else. You are systematic, detail-oriented,
and an excellent communicator under pressure.

When tracking issues arise:
HANDOFF_TO: tracking-specialist | REASON: Complex tracking investigation needed | URGENCY: high

When warehouse coordination is needed:
HANDOFF_TO: warehouse-manager | REASON: Cargo staging or storage required | URGENCY: normal`,
  tools: [
    {
      name: 'track_shipment',
      description: 'Check real-time status of any shipment across all modes',
      input_schema: {
        type: 'object' as const,
        properties: {
          shipment_id: { type: 'string' },
          mode: { type: 'string', enum: ['air', 'ocean', 'ground', 'unknown'] },
        },
        required: ['shipment_id'],
      },
    },
    {
      name: 'check_warehouse_availability',
      description: 'Check if warehouse space is available for staging cargo',
      input_schema: {
        type: 'object' as const,
        properties: {
          location: { type: 'string' },
          required_sqm: { type: 'number' },
          from_date: { type: 'string' },
          to_date: { type: 'string' },
          temperature_controlled: { type: 'boolean' },
        },
        required: ['location', 'required_sqm'],
      },
    },
    {
      name: 'run_route_optimization',
      description: 'Quickly find the best routing for a given shipment',
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
  ],
};
