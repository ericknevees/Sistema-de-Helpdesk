/**
 * Cross-Tab and Real-time Event Synchronization
 * Uses BroadcastChannel to instantly synchronize state across browser tabs/windows
 * alongside Cloud Firestore onSnapshot listeners.
 */

import {
  Ticket,
  TicketComment,
  HelpdeskNotification,
  Equipment,
  EquipmentMovement,
  DeliveryTerm,
} from '../types';

export type RealtimeEvent =
  | { type: 'TICKET_CREATED'; ticket: Ticket }
  | { type: 'TICKET_UPDATED'; ticket: Ticket }
  | { type: 'TICKETS_SYNC'; tickets: Ticket[] }
  | { type: 'COMMENT_ADDED'; comment: TicketComment; ticketId: string }
  | { type: 'NOTIFICATION_DISPATCHED'; notification: HelpdeskNotification }
  | { type: 'EQUIPMENT_CREATED'; equipment: Equipment }
  | { type: 'EQUIPMENT_UPDATED'; equipment: Equipment }
  | { type: 'EQUIPMENT_DELETED'; equipmentId: string }
  | { type: 'EQUIPMENT_MOVEMENT_RECORDED'; movement: EquipmentMovement }
  | { type: 'DELIVERY_TERM_SAVED'; term: DeliveryTerm };

type EventHandler = (event: RealtimeEvent) => void;

class RealtimeSyncManager {
  private channel: BroadcastChannel | null = null;
  private handlers: Set<EventHandler> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('embrag_helpdesk_realtime');
        this.channel.onmessage = (messageEvent) => {
          const event = messageEvent.data as RealtimeEvent;
          if (event && event.type) {
            this.handlers.forEach((handler) => {
              try {
                handler(event);
              } catch (e) {
                console.warn('[RealtimeSync] Error in event handler:', e);
              }
            });
          }
        };
      } catch (err) {
        console.warn('[RealtimeSync] BroadcastChannel not supported or blocked:', err);
      }
    }
  }

  public subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  public broadcast(event: RealtimeEvent): void {
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (err) {
        console.warn('[RealtimeSync] Failed to broadcast event:', err);
      }
    }
  }
}

export const realtimeSync = new RealtimeSyncManager();
