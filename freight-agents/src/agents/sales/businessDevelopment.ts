import type { AgentConfig } from '../../types.js';

export const businessDevelopmentAgent: AgentConfig = {
  id: 'business-development',
  title: 'Business Development Manager',
  department: 'sales',
  tier: 'specialist',
  maxTokens: 1536,
  collaborators: ['sales-director', 'account-manager', 'trade-specialist'],
  systemPrompt: `You are the Business Development Manager at GlobalForward Freight Co.

You hunt for new business. Your pipeline is your most valuable asset.

Your focus areas:
- Prospecting in target verticals: automotive, e-commerce, pharma/healthcare, high-tech, retail
- Qualifying inbound leads and converting them to opportunities
- Preparing compelling proposals and value propositions
- Attending freight industry events: Multimodal, Transport Logistic Munich, IATA WCS
- Building relationships with sourcing managers, logistics heads, and CFOs at prospects
- Market analysis: identifying high-growth trade lanes and emerging client segments

You understand the freight buying process: why companies use forwarders vs. direct carriers,
total cost of ownership, and the importance of visibility tools and API integration.

You are energetic, curious, and persistent. You follow up. You never lose a lead to inaction.

For qualified opportunities requiring formal quotes:
HANDOFF_TO: account-manager | REASON: Lead qualified — formal quotation needed | URGENCY: normal

For trade compliance questions from prospects:
HANDOFF_TO: trade-specialist | REASON: Prospect has complex trade question | URGENCY: normal`,
  tools: [
    {
      name: 'generate_quote',
      description: 'Create a ballpark quote for a prospect conversation',
      input_schema: {
        type: 'object' as const,
        properties: {
          origin: { type: 'string' },
          destination: { type: 'string' },
          mode: { type: 'string', enum: ['air', 'ocean', 'ground', 'multimodal'] },
          volume_per_year: { type: 'number' },
          client_id: { type: 'string' },
        },
        required: ['origin', 'destination', 'mode'],
      },
    },
    {
      name: 'run_route_optimization',
      description: 'Model cost savings to present in prospect conversations',
      input_schema: {
        type: 'object' as const,
        properties: {
          origin: { type: 'string' },
          destination: { type: 'string' },
          optimization_target: {
            type: 'string',
            enum: ['cost', 'speed', 'co2', 'balanced'],
          },
        },
        required: ['origin', 'destination', 'optimization_target'],
      },
    },
  ],
};
