import type { AgentConfig } from '../../types.js';

export const warehouseManagerAgent: AgentConfig = {
  id: 'warehouse-manager',
  title: 'Warehouse Manager',
  department: 'warehouse',
  tier: 'manager',
  maxTokens: 1536,
  collaborators: ['inventory-specialist', 'dispatch-coordinator', 'ground-transport-manager', 'coo'],
  systemPrompt: `You are the Warehouse Manager at GlobalForward Freight Co.

You operate a 12,000 sqm bonded warehouse facility with temperature-controlled zones,
a hazmat bay (ADR/IMDG compliant), and a high-security vault for valuables.
The facility is AEO (Authorized Economic Operator) certified.

Your responsibilities:
- Inbound and outbound cargo management: receipt, inspection, storage, dispatch
- Bonded warehouse operations: customs-supervised storage for deferred duty
- Cross-docking for time-critical freight
- Container stuffing and stripping (devanning)
- Cargo consolidation (LCL groupage) and deconsolidation
- Dangerous goods handling (IMDG/ADR storage compliance)
- WMS (Warehouse Management System) administration
- Labour planning: shift managers, forklift operators, packers

You are accountable for cargo security, inventory accuracy (target: 99.8%), and dock-to-stock time.
Safety is non-negotiable in your facility.

For complex inventory investigations:
HANDOFF_TO: inventory-specialist | REASON: Inventory discrepancy investigation | URGENCY: normal

For transport scheduling:
HANDOFF_TO: dispatch-coordinator | REASON: Transport booking required | URGENCY: normal`,
  tools: [
    {
      name: 'check_warehouse_availability',
      description: 'Check available storage capacity by zone and dates',
      input_schema: {
        type: 'object' as const,
        properties: {
          location: { type: 'string' },
          required_sqm: { type: 'number' },
          from_date: { type: 'string' },
          to_date: { type: 'string' },
          temperature_controlled: { type: 'boolean' },
          hazmat: { type: 'boolean' },
        },
        required: ['location', 'required_sqm'],
      },
    },
    {
      name: 'create_warehouse_booking',
      description: 'Book storage space for incoming cargo',
      input_schema: {
        type: 'object' as const,
        properties: {
          client_id: { type: 'string' },
          location: { type: 'string' },
          from: { type: 'string', description: 'ISO date string' },
          to: { type: 'string', description: 'ISO date string' },
          sqm_required: { type: 'number' },
          cargo_description: { type: 'string' },
        },
        required: ['location', 'from', 'to', 'sqm_required'],
      },
    },
    {
      name: 'check_inventory',
      description: 'Check current inventory levels for a client or SKU',
      input_schema: {
        type: 'object' as const,
        properties: {
          sku: { type: 'string' },
          client_id: { type: 'string' },
          location: { type: 'string' },
        },
        required: [],
      },
    },
  ],
};
