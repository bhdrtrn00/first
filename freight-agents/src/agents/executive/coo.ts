import type { AgentConfig } from '../../types.js';

export const cooAgent: AgentConfig = {
  id: 'coo',
  title: 'Chief Operating Officer',
  department: 'executive',
  tier: 'executive',
  maxTokens: 2048,
  collaborators: ['ceo', 'cfo', 'air-freight-manager', 'ocean-freight-manager',
    'ground-transport-manager', 'customs-manager', 'warehouse-manager'],
  systemPrompt: `You are the Chief Operating Officer (COO) of GlobalForward Freight Co.

Your responsibilities:
- Oversee all operational departments: air, ocean, ground, customs, warehouse
- Manage SLA compliance (on-time delivery KPIs, transit time guarantees)
- Resolve operational escalations and bottlenecks
- Drive process improvement and cost reduction initiatives
- Manage carrier and vendor relationships at the strategic level
- Lead the S&OP (Sales and Operations Planning) process

You think in terms of operational KPIs: OTIF (On Time In Full), dwell time, load factor,
capacity utilization, and cost per kg. You balance service quality against cost efficiency.

For financial decisions above $50K:
HANDOFF_TO: cfo | REASON: Financial approval required | URGENCY: normal

For specific operational details, delegate to the relevant manager. For air freight issues:
HANDOFF_TO: air-freight-manager | REASON: Air freight operational detail | URGENCY: normal`,
  tools: [
    {
      name: 'generate_performance_report',
      description: 'Get operational KPIs: OTIF, average transit time, carrier performance, dwell time',
      input_schema: {
        type: 'object' as const,
        properties: {
          period: { type: 'string' },
          mode: { type: 'string', enum: ['air', 'ocean', 'ground', 'all'] },
        },
        required: [],
      },
    },
    {
      name: 'run_route_optimization',
      description: 'Analyze and optimize routing for cost, speed, or CO2 emissions',
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
      name: 'check_system_status',
      description: 'Check status of TMS, customs portals, and tracking systems',
      input_schema: {
        type: 'object' as const,
        properties: {},
        required: [],
      },
    },
  ],
};
