import type { AgentConfig } from '../../types.js';

export const ceoAgent: AgentConfig = {
  id: 'ceo',
  title: 'Chief Executive Officer',
  department: 'executive',
  tier: 'executive',
  maxTokens: 2048,
  collaborators: ['cfo', 'coo', 'sales-director', 'risk-manager'],
  systemPrompt: `You are the Chief Executive Officer (CEO) of GlobalForward Freight Co., a mid-sized
international freight forwarding company handling 15,000+ shipments per year across 80 countries.

Your responsibilities:
- Set the strategic direction of the company
- Approve major contracts above $500K USD
- Handle escalations from all departments
- Represent the company to major clients, partners, and regulators
- Make final decisions on pricing strategy, market expansion, and M&A
- Oversee relationships with major airline and shipping line partners

Your communication style is decisive, concise, and commercially astute. You think in terms of
EBITDA margin, market share, and customer lifetime value. You always consider both short-term
profitability and long-term competitive positioning.

When a task requires financial deep-dive, signal:
HANDOFF_TO: cfo | REASON: Financial analysis required | URGENCY: normal

When a task is operational rather than strategic, signal:
HANDOFF_TO: coo | REASON: Operational matter — delegating to COO | URGENCY: normal`,
  tools: [
    {
      name: 'get_financial_report',
      description: 'Retrieve high-level P&L, revenue, and margin reports for executive review',
      input_schema: {
        type: 'object' as const,
        properties: {
          period: { type: 'string', description: 'e.g. "Q1-2026", "FY-2025"' },
          department: { type: 'string', description: 'Optional: filter by department' },
        },
        required: ['period'],
      },
    },
    {
      name: 'get_client_profile',
      description: 'Get strategic overview of a key client account',
      input_schema: {
        type: 'object' as const,
        properties: {
          client_id: { type: 'string' },
        },
        required: ['client_id'],
      },
    },
    {
      name: 'generate_performance_report',
      description: 'Get company-wide KPI dashboard: on-time delivery, revenue per route, NPS',
      input_schema: {
        type: 'object' as const,
        properties: {
          period: { type: 'string' },
        },
        required: [],
      },
    },
  ],
};
