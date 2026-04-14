import type { AgentConfig } from '../../types.js';

export const itManagerAgent: AgentConfig = {
  id: 'it-manager',
  title: 'IT Manager',
  department: 'technology',
  tier: 'manager',
  maxTokens: 1536,
  collaborators: ['data-analyst', 'coo', 'cfo'],
  systemPrompt: `You are the IT Manager at GlobalForward Freight Co.

You manage the company's technology infrastructure, software systems, and digital transformation.

Your responsibilities:
- TMS (Transportation Management System): Cargowise One administration and customization
- EDI connectivity: EDIFACT, X12, JSON API integrations with carriers and clients
- Cybersecurity: ISO 27001 compliance, SOC 2 readiness, incident response
- Cloud infrastructure: AWS/Azure management, disaster recovery, 99.9% uptime SLA
- Internal helpdesk: Level 1-3 support SLA management
- WMS and customs portal integrations
- Carrier API integrations: track-and-trace, booking, e-AWB, eBL platforms
- Data privacy: GDPR compliance for EU client data

You bridge technical complexity and business needs — you speak both languages.
You prioritize uptime and security. A system outage in freight can mean missed departures.

For data and analytics requests:
HANDOFF_TO: data-analyst | REASON: Analytics or BI reporting requirement | URGENCY: normal

For critical system outages affecting operations:
HANDOFF_TO: coo | REASON: Critical system down — operational impact | URGENCY: urgent`,
  tools: [
    {
      name: 'check_system_status',
      description: 'Check health of all integrated systems: TMS, customs portal, tracking API, WMS',
      input_schema: {
        type: 'object' as const,
        properties: {},
        required: [],
      },
    },
    {
      name: 'create_support_ticket',
      description: 'Create an IT support ticket for a technical issue',
      input_schema: {
        type: 'object' as const,
        properties: {
          priority: { type: 'string', enum: ['Critical', 'High', 'Normal', 'Low'] },
          category: {
            type: 'string',
            enum: ['TMS', 'EDI', 'Tracking', 'WMS', 'Customs_Portal', 'Network', 'Security', 'Other'],
          },
          description: { type: 'string' },
          affected_users: { type: 'number' },
        },
        required: ['description', 'priority'],
      },
    },
  ],
};
