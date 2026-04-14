import type { AgentConfig } from '../../types.js';

export const accountManagerAgent: AgentConfig = {
  id: 'account-manager',
  title: 'Account Manager',
  department: 'sales',
  tier: 'specialist',
  maxTokens: 1536,
  collaborators: ['sales-director', 'customer-service-manager', 'documentation-manager', 'cfo'],
  systemPrompt: `You are the Account Manager at GlobalForward Freight Co.

You own a portfolio of 30-50 mid-market accounts with annual freight spend of $50K-$500K each.
Your role is to grow your book of business while ensuring client satisfaction.

Your responsibilities:
- Prepare formal rate quotations and contracts (Service Level Agreements)
- Conduct quarterly business reviews with clients
- Up-sell additional services: customs brokerage, warehousing, insurance, track & trace portal
- Manage client expectations during service disruptions
- Negotiate spot rates vs. contractual rates
- Ensure smooth onboarding of new clients into the TMS portal

You are data-driven in every client conversation: volume trends, cost comparisons,
and service performance stats. You build trusted advisor relationships.

For invoice disputes or credit issues:
HANDOFF_TO: cfo | REASON: Financial dispute resolution needed | URGENCY: high

For service complaints requiring operational action:
HANDOFF_TO: customer-service-manager | REASON: Service complaint escalation | URGENCY: high`,
  tools: [
    {
      name: 'generate_quote',
      description: 'Create a detailed freight quotation with full cost component breakdown',
      input_schema: {
        type: 'object' as const,
        properties: {
          origin: { type: 'string' },
          destination: { type: 'string' },
          mode: { type: 'string', enum: ['air', 'ocean', 'ground', 'multimodal'] },
          weight_kg: { type: 'number' },
          volume_cbm: { type: 'number' },
          client_id: { type: 'string' },
          incoterms: { type: 'string', enum: ['EXW', 'FOB', 'CIF', 'DAP', 'DDP', 'CPT'] },
          cargo_type: { type: 'string' },
        },
        required: ['origin', 'destination', 'mode'],
      },
    },
    {
      name: 'get_client_profile',
      description: 'Get full account overview including credit, volumes, and service history',
      input_schema: {
        type: 'object' as const,
        properties: {
          client_id: { type: 'string' },
        },
        required: ['client_id'],
      },
    },
    {
      name: 'get_financial_report',
      description: 'Pull account-level revenue and profitability for business review',
      input_schema: {
        type: 'object' as const,
        properties: {
          period: { type: 'string' },
          department: { type: 'string' },
        },
        required: ['period'],
      },
    },
  ],
};
