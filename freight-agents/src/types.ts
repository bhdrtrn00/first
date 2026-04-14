import type Anthropic from '@anthropic-ai/sdk';

// ─── Core Agent Identity ────────────────────────────────────────────────────

export type AgentId =
  // Executive
  | 'ceo'
  | 'cfo'
  | 'coo'
  // Operations
  | 'air-freight-manager'
  | 'ocean-freight-manager'
  | 'ground-transport-manager'
  | 'dispatch-coordinator'
  // Customs & Compliance
  | 'customs-manager'
  | 'compliance-officer'
  | 'trade-specialist'
  // Sales & Business Dev
  | 'sales-director'
  | 'business-development'
  | 'account-manager'
  // Customer Service
  | 'customer-service-manager'
  | 'tracking-specialist'
  // Documentation
  | 'documentation-manager'
  | 'bill-of-lading-specialist'
  // Warehouse & Logistics
  | 'warehouse-manager'
  | 'inventory-specialist'
  // Technology & Data
  | 'it-manager'
  | 'data-analyst'
  // Risk & Insurance
  | 'risk-manager'
  | 'insurance-specialist'
  // Meta
  | 'orchestrator';

export type Department =
  | 'executive'
  | 'operations'
  | 'customs'
  | 'sales'
  | 'customer-service'
  | 'documentation'
  | 'warehouse'
  | 'technology'
  | 'risk';

export type AgentTier = 'executive' | 'manager' | 'specialist';

// ─── Tool Definitions ────────────────────────────────────────────────────────

export type ToolDefinition = Anthropic.Tool;

// ─── Agent Config ────────────────────────────────────────────────────────────

export interface AgentConfig {
  id: AgentId;
  title: string;
  department: Department;
  tier: AgentTier;
  systemPrompt: string;
  tools: ToolDefinition[];
  /** Which other agents this agent can escalate or hand off to */
  collaborators: AgentId[];
  /** Max tokens this agent should use per response */
  maxTokens: number;
}

// ─── Messaging ───────────────────────────────────────────────────────────────

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export type TaskCategory =
  | 'quote-request'
  | 'booking'
  | 'customs-clearance'
  | 'tracking-inquiry'
  | 'document-request'
  | 'compliance-check'
  | 'rate-negotiation'
  | 'claims-handling'
  | 'route-planning'
  | 'warehouse-request'
  | 'risk-assessment'
  | 'financial-query'
  | 'strategic-planning'
  | 'technical-support'
  | 'general-inquiry';

export interface AgentMessage {
  id: string;
  timestamp: Date;
  fromAgent: AgentId | 'user';
  toAgent: AgentId;
  content: string;
  taskCategory: TaskCategory;
  priority: MessagePriority;
  /** Conversation history to preserve context across handoffs */
  conversationHistory: Anthropic.MessageParam[];
  /** Contextual metadata about the freight task */
  metadata: FreightTaskMetadata;
  /** Whether this is a handoff from another agent */
  isHandoff: boolean;
  /** If handoff, the originating agent's summary */
  handoffContext?: string;
}

export interface FreightTaskMetadata {
  shipmentId?: string;
  clientId?: string;
  origin?: string;
  destination?: string;
  cargoType?: string;
  weight?: number;
  volume?: number;
  value?: number;
  currency?: string;
  incoterms?: string;
  requiredDeliveryDate?: string;
  hazmat?: boolean;
  customsRequired?: boolean;
  insuranceRequired?: boolean;
  tags?: string[];
}

// ─── Agent Response ───────────────────────────────────────────────────────────

export type AgentResponseStatus =
  | 'completed'
  | 'handoff-required'
  | 'awaiting-input'
  | 'error';

export interface HandoffInstruction {
  targetAgent: AgentId;
  reason: string;
  urgency: MessagePriority;
  contextSummary: string;
}

export interface ToolCallResult {
  toolName: string;
  toolUseId: string;
  input: Record<string, unknown>;
  output: string;
}

export interface AgentResponse {
  agentId: AgentId;
  messageId: string;
  timestamp: Date;
  status: AgentResponseStatus;
  content: string;
  /** Tool calls made during this response cycle */
  toolCallResults: ToolCallResult[];
  /** If status is 'handoff-required' */
  handoff?: HandoffInstruction;
  /** Updated conversation history for downstream use */
  updatedHistory: Anthropic.MessageParam[];
  /** Token usage for cost tracking */
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface RoutingDecision {
  targetAgent: AgentId;
  reasoning: string;
  confidence: number; // 0-1
  alternativeAgents: AgentId[];
}

export interface OrchestratorConfig {
  maxHandoffDepth: number;
  handoffTimeoutMs: number;
  enableParallelRouting: boolean;
}

// ─── Message Bus ──────────────────────────────────────────────────────────────

export interface MessageBusEvent {
  type: 'message-sent' | 'message-received' | 'handoff' | 'error' | 'completed';
  agentId: AgentId;
  messageId: string;
  timestamp: Date;
  payload?: unknown;
}

export type MessageBusListener = (event: MessageBusEvent) => void;

// ─── Registry ─────────────────────────────────────────────────────────────────

export type AgentRegistry = Map<AgentId, AgentConfig>;
