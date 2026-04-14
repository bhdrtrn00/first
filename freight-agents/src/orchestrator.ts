import Anthropic from '@anthropic-ai/sdk';
import type {
  AgentMessage,
  AgentResponse,
  AgentRegistry,
  OrchestratorConfig,
  RoutingDecision,
  FreightTaskMetadata,
  TaskCategory,
  MessagePriority,
} from './types.js';
import { AgentRunner } from './agentRunner.js';
import { messageBus } from './messageBus.js';

const MODEL = 'claude-sonnet-4-6';

const DEFAULT_CONFIG: OrchestratorConfig = {
  maxHandoffDepth: 5,
  handoffTimeoutMs: 30_000,
  enableParallelRouting: false,
};

/**
 * The Orchestrator is the entry point for all tasks.
 *
 * It uses Claude to classify the incoming request and route to the best
 * specialist agent. It also handles the handoff chain: if an agent signals
 * it needs another agent, the orchestrator coordinates the transfer and
 * threads conversation history through the chain.
 */
export class Orchestrator {
  private client: Anthropic;
  private runner: AgentRunner;
  private config: OrchestratorConfig;
  private registry: AgentRegistry;

  constructor(
    apiKey: string,
    registry: AgentRegistry,
    config: Partial<OrchestratorConfig> = {},
  ) {
    this.client = new Anthropic({ apiKey });
    this.runner = new AgentRunner(apiKey);
    this.registry = registry;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main entry point. Takes a plain-text user request plus optional metadata,
   * classifies it, routes to the best agent, and follows the handoff chain.
   */
  async handle(
    userRequest: string,
    metadata: Partial<FreightTaskMetadata> = {},
    priority: MessagePriority = 'normal',
  ): Promise<AgentResponse[]> {
    console.log('\n' + '═'.repeat(60));
    console.log('ORCHESTRATOR: New request received');
    console.log('═'.repeat(60));
    console.log(`Request: ${userRequest.slice(0, 120)}...`);

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const routing = await this.classifyAndRoute(userRequest, metadata);

    console.log(`\nRouting -> ${routing.targetAgent} (confidence: ${(routing.confidence * 100).toFixed(0)}%)`);
    console.log(`Reason:    ${routing.reasoning}`);

    const responses: AgentResponse[] = [];
    let currentAgentId = routing.targetAgent;
    let currentContent = userRequest;
    let conversationHistory: Anthropic.MessageParam[] = [];
    let handoffDepth = 0;
    let handoffContext: string | undefined;
    let isHandoff = false;

    while (handoffDepth <= this.config.maxHandoffDepth) {
      const agentConfig = this.registry.get(currentAgentId);
      if (!agentConfig) {
        console.error(`[Orchestrator] Unknown agent: ${currentAgentId}`);
        break;
      }

      const msg: AgentMessage = {
        id: `${messageId}-d${handoffDepth}`,
        timestamp: new Date(),
        fromAgent: handoffDepth === 0
          ? 'user'
          : (responses[responses.length - 1]?.agentId ?? 'user'),
        toAgent: currentAgentId,
        content: currentContent,
        taskCategory: this.inferTaskCategory(userRequest),
        priority,
        conversationHistory,
        metadata: { ...metadata } as FreightTaskMetadata,
        isHandoff,
        handoffContext,
      };

      console.log(`\n${'─'.repeat(40)}`);
      console.log(`AGENT [${agentConfig.title.toUpperCase()}] processing...`);

      messageBus.emitSent(currentAgentId, msg.id);
      const response = await this.runner.run(agentConfig, msg);
      responses.push(response);

      const preview = response.content.slice(0, 500);
      console.log(`\nResponse from ${agentConfig.title}:`);
      console.log(preview + (response.content.length > 500 ? '\n...(truncated)' : ''));

      if (response.toolCallResults.length > 0) {
        console.log(`\nTools used: ${response.toolCallResults.map(t => t.toolName).join(', ')}`);
      }

      if (response.status !== 'handoff-required' || !response.handoff) {
        break;
      }

      // Follow the handoff chain
      handoffDepth++;
      if (handoffDepth > this.config.maxHandoffDepth) {
        console.log(`\n[Orchestrator] Max handoff depth (${this.config.maxHandoffDepth}) reached. Stopping.`);
        break;
      }

      handoffContext = response.handoff.contextSummary;
      currentAgentId = response.handoff.targetAgent;
      currentContent = userRequest; // preserve the original request
      conversationHistory = response.updatedHistory;
      isHandoff = true;

      console.log(`\n↗  HANDOFF -> ${currentAgentId}: ${response.handoff.reason}`);
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`ORCHESTRATOR: Complete. ${responses.length} agent(s) involved.`);
    const totalIn = responses.reduce((s, r) => s + r.usage.inputTokens, 0);
    const totalOut = responses.reduce((s, r) => s + r.usage.outputTokens, 0);
    console.log(`Token usage: ${totalIn} in / ${totalOut} out`);
    console.log('═'.repeat(60) + '\n');

    return responses;
  }

  /**
   * Uses Claude to classify the incoming request and select the best starting agent.
   */
  private async classifyAndRoute(
    request: string,
    metadata: Partial<FreightTaskMetadata>,
  ): Promise<RoutingDecision> {
    const agentList = Array.from(this.registry.entries())
      .filter(([id]) => id !== 'orchestrator')
      .map(([id, cfg]) => `${id}: ${cfg.title} (${cfg.department}, ${cfg.tier})`)
      .join('\n');

    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: `You are the routing orchestrator for GlobalForward Freight Co.
Classify incoming freight requests and select the most appropriate specialist agent.
Respond with valid JSON only — no prose, no markdown fences.`,
      messages: [
        {
          role: 'user',
          content: `Available agents:\n${agentList}\n\nRequest: "${request}"\nMetadata: ${JSON.stringify(metadata)}\n\nRespond with JSON:\n{"targetAgent":"<agent-id>","reasoning":"<1-2 sentences>","confidence":<0.0-1.0>,"alternativeAgents":["<id>"]}`,
        },
      ],
    });

    const text = response.content.find(b => b.type === 'text')?.text ?? '{}';
    try {
      return JSON.parse(text) as RoutingDecision;
    } catch {
      return {
        targetAgent: 'customer-service-manager',
        reasoning: 'Defaulting to customer service — classification could not be parsed.',
        confidence: 0.3,
        alternativeAgents: [],
      };
    }
  }

  private inferTaskCategory(request: string): TaskCategory {
    const lower = request.toLowerCase();
    if (lower.includes('quote') || lower.includes('rate')) return 'quote-request';
    if (lower.includes('book')) return 'booking';
    if (lower.includes('customs') || lower.includes('clearance')) return 'customs-clearance';
    if (lower.includes('track') || lower.includes('where is') || lower.includes('status')) return 'tracking-inquiry';
    if (lower.includes('document') || lower.includes('invoice') || lower.includes(' bl ')) return 'document-request';
    if (lower.includes('compli') || lower.includes('regulation') || lower.includes('sanction')) return 'compliance-check';
    if (lower.includes('risk') || lower.includes('insurance')) return 'risk-assessment';
    if (lower.includes('warehouse') || lower.includes('storage')) return 'warehouse-request';
    if (lower.includes('financial') || lower.includes('payment') || lower.includes('margin')) return 'financial-query';
    if (lower.includes('strateg') || lower.includes('expand') || lower.includes('growth')) return 'strategic-planning';
    return 'general-inquiry';
  }
}
