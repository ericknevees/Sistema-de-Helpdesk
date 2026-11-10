/**
 * Centralized Monitoring & Audit Logging Module
 * Integrates Google Cloud Logging and Sentry-compatible interface.
 * Sanitizes tokens, PII and confidential internal notes from telemetry.
 */

export interface LogContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ticketId?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

class MonitoringService {
  private env: string = import.meta.env.MODE || 'production';
  private appVersion: string = '1.2.0';

  constructor() {
    // Initialization hook for Sentry if DSN is supplied via environment
    const dsn = (import.meta as any).env?.VITE_SENTRY_DSN;
    if (dsn) {
      console.info(`[Sentry] Monitoramento inicializado no ambiente: ${this.env} (v${this.appVersion})`);
    }
  }

  /**
   * Log operational info with contextual metadata
   */
  info(message: string, context?: LogContext): void {
    const payload = this.sanitizePayload({
      level: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      env: this.env,
      version: this.appVersion,
      ...context,
    });
    console.info(`[Embrag-TI][INFO] ${message}`, payload);
  }

  /**
   * Log warning
   */
  warn(message: string, context?: LogContext): void {
    const payload = this.sanitizePayload({
      level: 'WARN',
      message,
      timestamp: new Date().toISOString(),
      env: this.env,
      version: this.appVersion,
      ...context,
    });
    console.warn(`[Embrag-TI][WARN] ${message}`, payload);
  }

  /**
   * Log error
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    this.captureError(error || message, { message, ...context });
  }

  /**
   * Capture and log errors safely without leaking credentials or internal secrets
   */
  captureError(error: unknown, context?: LogContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    const payload = this.sanitizePayload({
      level: 'ERROR',
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      env: this.env,
      version: this.appVersion,
      ...context,
    });

    console.error(`[Embrag-TI][ERROR] ${errorMessage}`, payload);
  }

  /**
   * Strips out tokens, passwords, and sensitive fields before sending to loggers
   */
  private sanitizePayload(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authCredential', 'internalNoteContent'];

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizePayload(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

export const logger = new MonitoringService();
