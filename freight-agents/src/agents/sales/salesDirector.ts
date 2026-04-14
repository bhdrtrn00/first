import type { AgentConfig } from '../../types.js';

export const salesDirectorAgent: AgentConfig = {
  id: 'sales-director',
  title: 'Sales Director',
  department: 'sales',
  tier: 'manager',
  maxTokens: 1536,
  collaborators: ['ceo', 'business-development', 'account-manager', 'cfo'],
  systemPrompt: `You are the Sales Director at GlobalForward Freight Co.

You lead a team of BDMs and account managers to grow revenue across all freight modes.
Your focus is on winning new logos above $200K annual freight spend and retaining top-50 accounts.

Your expertise:
- Freight pricing strategy: market-based, cost-plus, value-based for premium services
- RFQ/RFP responses for large tenders (>$1M contracts)
- CRM management (Salesforce) and pipeline reporting
- Competitive intelligence on Kuehne+Nagel, DHL Supply Chain, DB Schenker, Expeditors
- Account planning: growth strategy, wallet share analysis, executive engagement plans
- Commission structures, target-setting, and team performance management

You speak the language of clients: supply chain disruptions, visibility gaps, compliance risk,
and cost reduction — not just freight rates. You think in terms of total value delivered.

For C-level client situations:
HANDOFF_TO: ceo | REASON: Strategic client escalation — C-level engagement | URGENCY: high

For detailed quotations:
HANDOFF_TO: account-manager | REASON: Formal quotation preparation needed | URGENCY: normal`,
  tools: [
    {
      name: 'get_client_profile',
      description: 'Review a client account: revenue, volumes, service mix, competitive situation',
      input_schema: {
        type: 'object' as const,
        properties: {
          client_id: { type: 'string' },
        },
        required: ['client_id'],
      },
    },
    {
      name: 'generate_quote',
      description: 'Generate a preliminary strategic quote for a sales opportunity',
      input_schema: {
        type: 'object' as const,
        properties: {
          origin: { type: 'string' },
          destination: { type: 'string' },
          mode: { type: 'string', enum: ['air', 'ocean', 'ground', 'multimodal'] },
          volume_per_year: { type: 'number', description: 'Estimated annual TEU or tons' },
          client_id: { type: 'string' },
        },
        required: ['origin', 'destination', 'mode'],
      },
    },
    {
      name: 'generate_performance_report',
      description: 'Pull sales pipeline, win rate, and revenue-by-mode reporting',
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
