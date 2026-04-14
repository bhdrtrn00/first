import type { AgentConfig } from '../../types.js';

export const customsManagerAgent: AgentConfig = {
  id: 'customs-manager',
  title: 'Customs Manager',
  department: 'customs',
  tier: 'manager',
  maxTokens: 2048,
  collaborators: ['compliance-officer', 'trade-specialist', 'documentation-manager',
    'air-freight-manager', 'ocean-freight-manager'],
  systemPrompt: `You are the Customs Manager at GlobalForward Freight Co.

You are a licensed customs broker with 15+ years of experience across EU, US, and Asian markets.

Your expertise:
- EU customs procedures: ICS2, AES, NCTS transit, AEO (Authorized Economic Operator) status
- US Customs: ACE filing, ISF (Importer Security Filing / 10+2), CBP regulations
- China Customs (GACC), Japan Customs, and Singapore customs requirements
- HS code classification across all 21 HS sections
- Valuation methods: Transaction Value, Deductive Value, Computed Value
- Anti-dumping and countervailing duties, trade sanctions (OFAC, EU sanctions)
- Free Trade Agreement preferential tariff: CETA, RCEP, USMCA, CPTPP, EU-UK TCA
- ATA Carnet for temporary exports/imports

Key principle: Customs compliance is non-negotiable. Errors cost more than delays.

For complex trade law or FTA questions:
HANDOFF_TO: trade-specialist | REASON: Complex FTA or tariff classification needed | URGENCY: normal

For documentation preparation:
HANDOFF_TO: documentation-manager | REASON: Customs document preparation required | URGENCY: high`,
  tools: [
    {
      name: 'check_hs_code',
      description: 'Look up or verify HS tariff code for a product, including duty rates',
      input_schema: {
        type: 'object' as const,
        properties: {
          product: { type: 'string', description: 'Product description' },
          country_of_origin: { type: 'string' },
          import_country: { type: 'string' },
        },
        required: ['product', 'import_country'],
      },
    },
    {
      name: 'get_customs_tariff',
      description: 'Get import duty rates, VAT, and any trade restrictions for a tariff heading',
      input_schema: {
        type: 'object' as const,
        properties: {
          hs_code: { type: 'string' },
          country: { type: 'string', description: 'Country of import' },
          country_of_origin: { type: 'string' },
        },
        required: ['hs_code', 'country'],
      },
    },
    {
      name: 'submit_customs_declaration',
      description: 'Submit an import or export customs declaration to the relevant authority',
      input_schema: {
        type: 'object' as const,
        properties: {
          shipment_id: { type: 'string' },
          declaration_type: {
            type: 'string',
            enum: ['import', 'export', 'transit', 'temporary_import'],
          },
          country: { type: 'string' },
          value_usd: { type: 'number' },
          hs_code: { type: 'string' },
        },
        required: ['shipment_id', 'declaration_type', 'country'],
      },
    },
    {
      name: 'check_document_completeness',
      description: 'Verify all customs documents are complete and accurate before submission',
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
