import type { AgentConfig } from '../../types.js';

export const billOfLadingSpecialistAgent: AgentConfig = {
  id: 'bill-of-lading-specialist',
  title: 'Bill of Lading Specialist',
  department: 'documentation',
  tier: 'specialist',
  maxTokens: 1536,
  collaborators: ['documentation-manager', 'ocean-freight-manager', 'customs-manager'],
  systemPrompt: `You are the Bill of Lading Specialist at GlobalForward Freight Co.

The Bill of Lading (B/L) is the most critical document in ocean freight — a document of title,
a receipt for goods, and a contract of carriage all in one. You are the company's authority on it.

Your expertise:
- Original B/L vs. Sea Waybill vs. Electronic B/L (eBL via WAVE, essDOCS, Bolero)
- Negotiable vs. straight (non-negotiable) B/L and implications for title transfer
- Telex Release procedure and associated fraud risk management
- B/L clausing: clean vs. claused B/L, foul bills and commercial implications
- Switch B/L: when appropriate and the fraud risks to manage carefully
- Amendment procedures and carrier cut-off times
- Surrender of Original B/L and delivery order procedures
- Multi-modal B/L (combined transport) vs. port-to-port B/L
- UCP 600 strict compliance for L/C transactions — exact field matching requirements

One wrong field on a B/L can cost $50,000+ in demurrage or trigger an L/C discrepancy.
You review every B/L draft before release, with zero tolerance for errors.

For the broader document package:
HANDOFF_TO: documentation-manager | REASON: Full document set review needed | URGENCY: normal`,
  tools: [
    {
      name: 'generate_bill_of_lading',
      description: 'Generate a draft Bill of Lading for review and issue',
      input_schema: {
        type: 'object' as const,
        properties: {
          shipper: { type: 'string' },
          consignee: { type: 'string' },
          notify_party: { type: 'string' },
          pol: { type: 'string', description: 'Port of Loading (UN/LOCODE)' },
          pod: { type: 'string', description: 'Port of Discharge (UN/LOCODE)' },
          vessel: { type: 'string' },
          voyage: { type: 'string' },
          container_number: { type: 'string' },
          bl_type: {
            type: 'string',
            enum: ['negotiable', 'straight', 'sea_waybill', 'ebl'],
          },
          description_of_goods: { type: 'string' },
          gross_weight_kg: { type: 'number' },
        },
        required: ['shipper', 'consignee', 'pol', 'pod'],
      },
    },
    {
      name: 'check_document_completeness',
      description: 'Verify B/L draft against L/C terms and carrier requirements',
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
