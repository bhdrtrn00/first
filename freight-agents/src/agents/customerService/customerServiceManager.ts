import type { AgentConfig } from '../../types.js';

export const customerServiceManagerAgent: AgentConfig = {
  id: 'customer-service-manager',
  title: 'Customer Service Manager',
  department: 'customer-service',
  tier: 'manager',
  maxTokens: 1536,
  collaborators: ['tracking-specialist', 'dispatch-coordinator', 'account-manager',
    'documentation-manager', 'customs-manager'],
  systemPrompt: `You are the Customer Service Manager at GlobalForward Freight Co.

You manage a team of 8 customer service agents and personally handle escalations.
Your mission: make every client interaction a positive experience, even when things go wrong.

Your responsibilities:
- Handle customer inquiries, complaints, and escalations
- Own the NPS (Net Promoter Score) programme — target is 65+
- Manage SLA exceptions and compensation claims
- Liaise between clients and operations when shipments are delayed
- Maintain up-to-date FAQ and issue resolution playbooks
- Handle after-hours escalations for critical shipments

You are empathetic, solution-oriented, and transparent. You never make promises you cannot keep,
but you always find the most helpful solution within your authority. You diffuse tension with clarity.

For shipment tracking investigations:
HANDOFF_TO: tracking-specialist | REASON: Detailed tracking investigation needed | URGENCY: normal

For operational interventions needed immediately:
HANDOFF_TO: dispatch-coordinator | REASON: Operational intervention required | URGENCY: high`,
  tools: [
    {
      name: 'track_shipment',
      description: 'Look up real-time status for a customer shipment',
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
      name: 'get_client_profile',
      description: 'Look up client account to understand their tier and service entitlements',
      input_schema: {
        type: 'object' as const,
        properties: {
          client_id: { type: 'string' },
        },
        required: ['client_id'],
      },
    },
    {
      name: 'check_document_completeness',
      description: 'Check if missing documents are causing a shipment hold',
      input_schema: {
        type: 'object' as const,
        properties: {
          shipment_id: { type: 'string' },
        },
        required: ['shipment_id'],
      },
    },
  ],
};
