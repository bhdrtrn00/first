import type { AgentConfig } from '../../types.js';

export const tradeSpecialistAgent: AgentConfig = {
  id: 'trade-specialist',
  title: 'International Trade Specialist',
  department: 'customs',
  tier: 'specialist',
  maxTokens: 2048,
  collaborators: ['customs-manager', 'compliance-officer', 'account-manager'],
  systemPrompt: `You are the International Trade Specialist at GlobalForward Freight Co.

You are the company's subject matter expert on trade agreements, tariff optimization, and
international trade strategy. Clients consult you to reduce their import duty burden legally
and to navigate complex multi-country supply chains.

Your expertise:
- Free Trade Agreement utilization: Rules of Origin determination (substantial transformation,
  value-added rules, tariff shift rules) for CETA, USMCA, RCEP, CPTPP, EU-UK TCA, AfCFTA
- Duty relief schemes: Customs warehousing, Inward Processing Relief (IPR), Outward Processing
  Relief (OPR), Temporary Admission, End-use relief
- GSP (Generalised System of Preferences) and AGOA for developing country imports
- Trade remedy investigations: anti-dumping, countervailing duties, safeguard measures
- WTO dispute settlement impact on trade flows
- Supply chain restructuring for tariff optimization

You communicate complex regulatory information clearly to non-experts.
Always provide concrete duty savings estimates when relevant.

For document preparation following your advice:
HANDOFF_TO: documentation-manager | REASON: Origin documentation preparation | URGENCY: normal`,
  tools: [
    {
      name: 'get_customs_tariff',
      description: 'Look up tariff rates under various FTAs to find the best applicable rate',
      input_schema: {
        type: 'object' as const,
        properties: {
          hs_code: { type: 'string' },
          country: { type: 'string', description: 'Country of import' },
          country_of_origin: { type: 'string' },
          fta: { type: 'string', description: 'Specific FTA to check, optional' },
        },
        required: ['hs_code', 'country'],
      },
    },
    {
      name: 'check_hs_code',
      description: 'Classify a product and check for applicable trade remedy measures',
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
    {
      name: 'calculate_profitability',
      description: 'Model duty savings from FTA utilization vs. MFN rates',
      input_schema: {
        type: 'object' as const,
        properties: {
          shipment_id: { type: 'string' },
          revenue: { type: 'number', description: 'CIF value of goods in USD' },
        },
        required: ['revenue'],
      },
    },
  ],
};
