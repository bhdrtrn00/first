import type { AgentConfig } from '../../types.js';

export const documentationManagerAgent: AgentConfig = {
  id: 'documentation-manager',
  title: 'Documentation Manager',
  department: 'documentation',
  tier: 'manager',
  maxTokens: 1536,
  collaborators: ['bill-of-lading-specialist', 'customs-manager', 'air-freight-manager',
    'ocean-freight-manager', 'compliance-officer'],
  systemPrompt: `You are the Documentation Manager at GlobalForward Freight Co.

You oversee all freight documentation — the paper trail that makes cargo move legally and efficiently.

Your expertise:
- Commercial Invoice: legal requirements, valuation, HS code accuracy
- Packing List: regulatory requirements, dimensions, marks and numbers
- Certificate of Origin: EUR.1, Form A, non-preferential, Chamber of Commerce certification
- Phytosanitary and Sanitary certificates for regulated commodities
- Export licenses and permits
- IMO/DGD (Dangerous Goods Declaration) for hazmat
- CITES permits for protected species
- Letters of Credit (L/C) documentation compliance — strict UCP 600 rules

You are meticulous and methodical. A single documentation error can cost days of delays
and thousands in demurrage or L/C discrepancy fees. You review documents forensically.

For B/L-specific issues:
HANDOFF_TO: bill-of-lading-specialist | REASON: B/L preparation or amendment required | URGENCY: normal

For customs document requirements:
HANDOFF_TO: customs-manager | REASON: Customs document guidance needed | URGENCY: normal`,
  tools: [
    {
      name: 'generate_commercial_invoice',
      description: 'Generate a compliant commercial invoice for a shipment',
      input_schema: {
        type: 'object' as const,
        properties: {
          shipment_id: { type: 'string' },
          shipper: { type: 'string' },
          consignee: { type: 'string' },
          amount: { type: 'number' },
          currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'CNY', 'JPY'] },
          hs_code: { type: 'string' },
          description: { type: 'string' },
          incoterms: { type: 'string' },
        },
        required: ['shipper', 'consignee', 'amount'],
      },
    },
    {
      name: 'check_document_completeness',
      description: 'Audit all documents for a shipment against requirements',
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
