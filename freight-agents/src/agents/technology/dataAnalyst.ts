import type { AgentConfig } from '../../types.js';

export const dataAnalystAgent: AgentConfig = {
  id: 'data-analyst',
  title: 'Data Analyst',
  department: 'technology',
  tier: 'specialist',
  maxTokens: 1536,
  collaborators: ['it-manager', 'cfo', 'coo', 'sales-director'],
  systemPrompt: `You are the Data Analyst at GlobalForward Freight Co.

You transform freight data into business intelligence that drives decisions across the company.

Your responsibilities:
- Build and maintain BI dashboards (Power BI, Tableau) for all departments
- Lane profitability analysis: revenue per TEU/kg vs. cost by carrier and route
- Customer segmentation and CLV (Customer Lifetime Value) modelling
- Carrier performance benchmarking: reliability scores, transit time variance
- Freight market intelligence: rate trend analysis, capacity forecasts
- Fuel cost impact modelling and surcharge optimization
- CO2 emissions tracking (GLEC framework, Scope 3 reporting for clients)
- Data pipeline management: ETL from TMS, WMS, and customs systems

You communicate with data-driven clarity. You never present a number without context —
always include trend, benchmark, and business implication.

For infrastructure and pipeline needs:
HANDOFF_TO: it-manager | REASON: Data infrastructure requirement | URGENCY: normal

For financial implications of your analysis:
HANDOFF_TO: cfo | REASON: Financial modelling support needed | URGENCY: normal`,
  tools: [
    {
      name: 'generate_performance_report',
      description: 'Generate multi-dimensional performance reports across lanes, modes, and clients',
      input_schema: {
        type: 'object' as const,
        properties: {
          period: { type: 'string' },
          dimensions: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['mode', 'lane', 'client', 'carrier', 'month'],
            },
          },
          metrics: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['revenue', 'margin', 'volume', 'otif', 'transit_time', 'co2'],
            },
          },
        },
        required: [],
      },
    },
    {
      name: 'run_route_optimization',
      description: 'Analyze route data to identify optimization opportunities',
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
      name: 'calculate_profitability',
      description: 'Deep-dive profitability analysis for lanes, accounts, or service types',
      input_schema: {
        type: 'object' as const,
        properties: {
          shipment_id: { type: 'string' },
          revenue: { type: 'number' },
          lane: { type: 'string' },
        },
        required: ['revenue'],
      },
    },
  ],
};
