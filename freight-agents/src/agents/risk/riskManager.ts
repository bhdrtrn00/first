import type { AgentConfig } from '../../types.js';

export const riskManagerAgent: AgentConfig = {
  id: 'risk-manager',
  title: 'Risk Manager',
  department: 'risk',
  tier: 'manager',
  maxTokens: 2048,
  collaborators: ['insurance-specialist', 'compliance-officer', 'cfo', 'coo'],
  systemPrompt: `You are the Risk Manager at GlobalForward Freight Co.

You identify, assess, and mitigate risks across all aspects of the business.
Your scope spans operational, financial, regulatory, and reputational risk.

Your expertise:
- Cargo risk: theft hotspots, piracy zones (Gulf of Aden, Strait of Malacca, Gulf of Guinea),
  natural disaster exposure, temperature deviation risk for pharma
- Counterparty risk: credit risk on carriers, suppliers, and clients
- Geopolitical risk: sanctions, trade wars, port strikes, conflict zones
- Business continuity planning: carrier bankruptcy, port closures, pandemic response
- Insurance programme management: open cover, project cargo, product recall
- Claims management: cargo claims under CMR, Warsaw Convention, Hague-Visby Rules
- Enterprise Risk Management (ERM) framework per ISO 31000
- Cyber risk: ransomware impact on freight operations (NotPetya cost Maersk $300M)

You quantify risks with probability × impact scores. You propose mitigation, risk transfer
(insurance), or risk acceptance with a documented rationale.

For insurance placement:
HANDOFF_TO: insurance-specialist | REASON: Insurance placement required | URGENCY: normal

For regulatory/sanctions risk:
HANDOFF_TO: compliance-officer | REASON: Regulatory risk requires compliance review | URGENCY: urgent`,
  tools: [
    {
      name: 'assess_cargo_risk',
      description: 'Assess risk profile of a cargo based on type, origin, destination, and route',
      input_schema: {
        type: 'object' as const,
        properties: {
          cargo_type: { type: 'string' },
          origin: { type: 'string' },
          destination: { type: 'string' },
          value_usd: { type: 'number' },
          mode: { type: 'string', enum: ['air', 'ocean', 'ground', 'multimodal'] },
          hazmat: { type: 'boolean' },
        },
        required: ['cargo_type', 'origin', 'destination'],
      },
    },
    {
      name: 'get_insurance_quote',
      description: 'Get indicative cargo insurance premium based on risk assessment',
      input_schema: {
        type: 'object' as const,
        properties: {
          value: { type: 'number', description: 'CIF value of cargo in USD' },
          cargo_type: { type: 'string' },
          origin: { type: 'string' },
          destination: { type: 'string' },
          mode: { type: 'string' },
        },
        required: ['value', 'cargo_type'],
      },
    },
    {
      name: 'get_financial_report',
      description: 'Review claims history and risk reserve levels',
      input_schema: {
        type: 'object' as const,
        properties: {
          period: { type: 'string' },
          report_type: { type: 'string' },
        },
        required: ['period'],
      },
    },
  ],
};
