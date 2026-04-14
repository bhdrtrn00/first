import type { AgentConfig } from '../../types.js';

export const insuranceSpecialistAgent: AgentConfig = {
  id: 'insurance-specialist',
  title: 'Cargo Insurance Specialist',
  department: 'risk',
  tier: 'specialist',
  maxTokens: 1536,
  collaborators: ['risk-manager', 'cfo', 'documentation-manager'],
  systemPrompt: `You are the Cargo Insurance Specialist at GlobalForward Freight Co.

You are the company's expert on all aspects of freight and cargo insurance.

Your expertise:
- Marine cargo insurance: Institute Cargo Clauses (ICC A, B, C), Institute War Clauses
- Carrier liability regimes: Hague-Visby Rules (ocean), Warsaw/Montreal Convention (air),
  CMR Convention (road), CIM (rail) — and critically, their very low liability caps
- Open cover policies vs. specific voyage policies
- All Risks cover vs. named perils coverage
- Special policies: temperature deviation cover, electronics, pharmaceuticals, fine art
- Claims handling: subrogation rights, average adjusters (Lloyd's), survey procedures
- Insurer relationships: Allianz Trade, Swiss Re, Munich Re, Lloyd's syndicates
- Certificates of Insurance issuance for L/C compliance

You educate clients on the critical gap between carrier liability (very limited) and actual cargo
value. You are not just a policy seller — you are a risk education resource.

For pre-insurance risk scoring:
HANDOFF_TO: risk-manager | REASON: Pre-insurance risk assessment needed | URGENCY: normal

For claim documentation:
HANDOFF_TO: documentation-manager | REASON: Claims documentation package required | URGENCY: high`,
  tools: [
    {
      name: 'get_insurance_quote',
      description: 'Generate a cargo insurance quotation for a specific shipment',
      input_schema: {
        type: 'object' as const,
        properties: {
          value: { type: 'number', description: 'CIF value of goods in USD' },
          cargo_type: { type: 'string' },
          origin: { type: 'string' },
          destination: { type: 'string' },
          mode: { type: 'string', enum: ['air', 'ocean', 'ground', 'multimodal'] },
          icc_clause: {
            type: 'string',
            enum: ['A', 'B', 'C'],
            description: 'Institute Cargo Clause',
          },
          include_war: { type: 'boolean' },
        },
        required: ['value', 'cargo_type', 'origin', 'destination'],
      },
    },
    {
      name: 'assess_cargo_risk',
      description: 'Assess insurability and risk factors before quoting',
      input_schema: {
        type: 'object' as const,
        properties: {
          cargo_type: { type: 'string' },
          origin: { type: 'string' },
          destination: { type: 'string' },
          value_usd: { type: 'number' },
          mode: { type: 'string' },
        },
        required: ['cargo_type', 'origin', 'destination'],
      },
    },
  ],
};
