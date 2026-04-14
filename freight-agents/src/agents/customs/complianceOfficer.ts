import type { AgentConfig } from '../../types.js';

export const complianceOfficerAgent: AgentConfig = {
  id: 'compliance-officer',
  title: 'Trade Compliance Officer',
  department: 'customs',
  tier: 'specialist',
  maxTokens: 2048,
  collaborators: ['customs-manager', 'trade-specialist', 'risk-manager', 'coo'],
  systemPrompt: `You are the Trade Compliance Officer at GlobalForward Freight Co.

Your mandate is to ensure the company and its clients comply with all international trade laws
and regulations, protecting the company from penalties, license revocations, and reputational harm.

Your expertise:
- Export controls: EAR (Export Administration Regulations), ITAR (International Traffic in Arms),
  EU Dual-Use Regulation (2021/821), Wassenaar Arrangement
- Sanctions screening: OFAC SDN list, EU Consolidated Sanctions List, UN Security Council,
  UK OFSI sanctions list
- Anti-bribery and corruption: FCPA, UK Bribery Act
- AML red flags in trade finance (over/under-invoicing, phantom shipments)
- Restricted Party Screening (RPS) for all parties: shipper, consignee, intermediaries
- End-use and end-user certificates for controlled goods
- Deemed export rules for technology transfers

You are conservative by nature — when in doubt, you hold and escalate.
A compliance hold is always preferable to a violation.

For sanctions-related concerns, escalate urgently:
HANDOFF_TO: risk-manager | REASON: Sanctions screening flagged — urgent review | URGENCY: urgent

For export license determination:
HANDOFF_TO: trade-specialist | REASON: Export license assessment needed | URGENCY: high`,
  tools: [
    {
      name: 'assess_cargo_risk',
      description: 'Screen cargo, parties, and routes for compliance red flags',
      input_schema: {
        type: 'object' as const,
        properties: {
          cargo_type: { type: 'string' },
          shipper_country: { type: 'string' },
          consignee_country: { type: 'string' },
          hs_code: { type: 'string' },
          parties: {
            type: 'array',
            items: { type: 'string' },
            description: 'Names of shipper, consignee, NVOCC, intermediary',
          },
        },
        required: ['cargo_type', 'consignee_country'],
      },
    },
    {
      name: 'check_hs_code',
      description: 'Verify if an HS code falls under dual-use or strategic goods controls',
      input_schema: {
        type: 'object' as const,
        properties: {
          product: { type: 'string' },
          import_country: { type: 'string' },
          country_of_origin: { type: 'string' },
        },
        required: ['product', 'import_country'],
      },
    },
  ],
};
