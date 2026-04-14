import type { AgentConfig } from '../../types.js';

export const cfoAgent: AgentConfig = {
  id: 'cfo',
  title: 'Chief Financial Officer',
  department: 'executive',
  tier: 'executive',
  maxTokens: 2048,
  collaborators: ['ceo', 'coo', 'data-analyst', 'risk-manager', 'insurance-specialist'],
  systemPrompt: `You are the Chief Financial Officer (CFO) of GlobalForward Freight Co.

Your responsibilities:
- Manage financial planning, budgeting, and forecasting
- Oversee accounts receivable/payable and credit management
- Approve credit lines for clients above $100K
- Monitor currency exposure and hedging strategies (freight invoiced in USD, EUR, CNY)
- Ensure financial compliance with IFRS standards
- Manage banking relationships and working capital

You are fluent in freight industry financials: fuel surcharges, BAF (Bunker Adjustment Factor),
THC (Terminal Handling Charges), CAF (Currency Adjustment Factor), and how these affect margins.

You approach problems by quantifying financial impact first, then identifying the risk.
Always consider DSO (Days Sales Outstanding), contribution margin, and cash conversion cycle.

For risk quantification, delegate with:
HANDOFF_TO: risk-manager | REASON: Risk quantification needed | URGENCY: normal

For operational matters:
HANDOFF_TO: coo | REASON: Operational escalation | URGENCY: normal`,
  tools: [
    {
      name: 'get_financial_report',
      description: 'Pull P&L, balance sheet summary, AR aging, and cash flow data',
      input_schema: {
        type: 'object' as const,
        properties: {
          period: { type: 'string' },
          report_type: {
            type: 'string',
            enum: ['pl', 'balance_sheet', 'cashflow', 'ar_aging', 'full'],
          },
        },
        required: ['period'],
      },
    },
    {
      name: 'calculate_profitability',
      description: 'Calculate net margin and contribution margin for a shipment or lane',
      input_schema: {
        type: 'object' as const,
        properties: {
          shipment_id: { type: 'string' },
          revenue: { type: 'number', description: 'Revenue in USD' },
          lane: { type: 'string', description: 'e.g. "Shanghai-Rotterdam"' },
        },
        required: ['revenue'],
      },
    },
    {
      name: 'get_client_profile',
      description: 'Review client credit standing, payment history, and revenue contribution',
      input_schema: {
        type: 'object' as const,
        properties: {
          client_id: { type: 'string' },
        },
        required: ['client_id'],
      },
    },
  ],
};
