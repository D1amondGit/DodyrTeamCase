import { EventEmitter } from 'node:events';

export type DomainEventName =
  | 'inspection.started'
  | 'inspection.completed'
  | 'inspection.interrupted'
  | 'checkpoint.submitted'
  | 'defect.reported'
  | 'defect.status_changed';

export interface DomainEvent<T = unknown> {
  name: DomainEventName;
  payload: T;
  occurredAt: string;
  actorId?: string;
}

/**
 * Simple in-process EventBus. Ready to be swapped with Redis pub/sub, Kafka,
 * or NATS in Phase 2 without changing call sites — the interface is symmetric.
 */
export class EventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    // Unbounded listeners are fine for Phase 1; cap raised to avoid warnings.
    this.emitter.setMaxListeners(50);
  }

  publish<T>(event: Omit<DomainEvent<T>, 'occurredAt'> & { occurredAt?: string }): void {
    const full: DomainEvent<T> = {
      ...event,
      occurredAt: event.occurredAt ?? new Date().toISOString(),
    };
    this.emitter.emit(event.name, full);
    this.emitter.emit('*', full);
  }

  on<T>(name: DomainEventName | '*', handler: (event: DomainEvent<T>) => void): () => void {
    this.emitter.on(name, handler as (e: DomainEvent) => void);
    return () => this.emitter.off(name, handler as (e: DomainEvent) => void);
  }
}

export const eventBus = new EventBus();

/**
 * Phase-1 default subscriber: structured log of every domain event.
 * Phase-2/3 subscribers (push notifications, 1C sync, ML pipeline) plug in
 * by calling eventBus.on(...) at bootstrap — no core changes required.
 */
export function registerDefaultSubscribers(logger: {
  info: (obj: unknown, msg?: string) => void;
}): void {
  eventBus.on('*', (event) => {
    logger.info({ event }, `domain-event:${event.name}`);
  });
}
