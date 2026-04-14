import type { MessageBusEvent, MessageBusListener, AgentId } from './types.js';

/**
 * Simple in-process event bus for inter-agent communication.
 * Emits typed events for observability: every send, receive, handoff, and completion
 * can be monitored. In a production system this would be replaced with a proper
 * message queue (e.g., Redis Streams, RabbitMQ).
 */
export class MessageBus {
  private listeners: MessageBusListener[] = [];
  private eventLog: MessageBusEvent[] = [];

  subscribe(listener: MessageBusListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(event: MessageBusEvent): void {
    this.eventLog.push(event);
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[MessageBus] Listener error:', err);
      }
    }
  }

  emitSent(agentId: AgentId, messageId: string): void {
    this.emit({ type: 'message-sent', agentId, messageId, timestamp: new Date() });
  }

  emitReceived(agentId: AgentId, messageId: string): void {
    this.emit({ type: 'message-received', agentId, messageId, timestamp: new Date() });
  }

  emitHandoff(fromAgent: AgentId, toAgent: AgentId, messageId: string): void {
    this.emit({
      type: 'handoff',
      agentId: fromAgent,
      messageId,
      timestamp: new Date(),
      payload: { toAgent },
    });
  }

  emitCompleted(agentId: AgentId, messageId: string, summary: string): void {
    this.emit({
      type: 'completed',
      agentId,
      messageId,
      timestamp: new Date(),
      payload: { summary },
    });
  }

  emitError(agentId: AgentId, messageId: string, error: unknown): void {
    this.emit({
      type: 'error',
      agentId,
      messageId,
      timestamp: new Date(),
      payload: { error: String(error) },
    });
  }

  getLog(): Readonly<MessageBusEvent[]> {
    return this.eventLog;
  }

  clearLog(): void {
    this.eventLog = [];
  }
}

export const messageBus = new MessageBus();
