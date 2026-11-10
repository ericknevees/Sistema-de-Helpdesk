import { HelpdeskNotification, NotificationType, Ticket, UserProfile } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'embrag_helpdesk_notifications_v1';

/**
 * Play subtle corporate audio chime for real-time alert using Web Audio API
 */
export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    // Ignore audio autoplay restrictions gracefully
  }
}

/**
 * Generates official corporate HTML email template for dispatch
 */
export function generateCorporateEmailHtml(
  type: NotificationType,
  ticket: Ticket,
  recipientName: string,
  extraMessage?: string
): { subject: string; html: string } {
  let subject = '';
  let badgeLabel = '';
  let badgeColor = '#4f46e5';

  switch (type) {
    case 'created':
      subject = `[Novo Chamado ${ticket.code}] ${ticket.title} - Helpdesk`;
      badgeLabel = 'NOVO CHAMADO REGISTRADO';
      badgeColor = '#4f46e5';
      break;
    case 'status_updated':
      subject = `[Atualização ${ticket.code}] Status alterado para ${ticket.status.toUpperCase()} - Helpdesk`;
      badgeLabel = `STATUS: ${ticket.status.replace('_', ' ').toUpperCase()}`;
      badgeColor = ticket.status === 'resolvido' ? '#10b981' : '#2563eb';
      break;
    case 'assigned':
      subject = `[Atribuição ${ticket.code}] Técnico designado para seu atendimento - Helpdesk`;
      badgeLabel = 'TÉCNICO ATRIBUÍDO';
      badgeColor = '#8b5cf6';
      break;
    case 'new_comment':
      subject = `[Nova Mensagem ${ticket.code}] Resposta adicionada ao chamado - Helpdesk`;
      badgeLabel = 'NOVA RESPOSTA';
      badgeColor = '#06b6d4';
      break;
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
      <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #818cf8; font-weight: 700;">
          Helpdesk • Embrag S/A
        </div>
        <h2 style="margin: 8px 0 0 0; color: #ffffff; font-size: 18px; font-weight: 700;">
          Notificação de Chamado Corporativo
        </h2>
      </div>

      <div style="margin-bottom: 20px;">
        <span style="display: inline-block; background-color: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor}44; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
          ${badgeLabel}
        </span>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 16px;">
        Olá, <strong>${recipientName}</strong>,<br/>
        ${extraMessage || `Houve uma movimentação no chamado corporativo <strong>${ticket.code}</strong>.`}
      </p>

      <div style="background-color: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 20px; border: 1px solid #334155;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #94a3b8; padding: 6px 0; width: 35%;">Código do Chamado:</td>
            <td style="color: #ffffff; font-weight: 600; font-family: monospace;">${ticket.code}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; padding: 6px 0;">Assunto:</td>
            <td style="color: #ffffff; font-weight: 600;">${ticket.title}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; padding: 6px 0;">Departamento:</td>
            <td style="color: #cbd5e1;">${ticket.department}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; padding: 6px 0;">Prioridade / SLA:</td>
            <td style="color: #cbd5e1; text-transform: uppercase; font-weight: 600;">${ticket.priority} (${new Date(ticket.slaDueDate).toLocaleString()})</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; padding: 6px 0;">Responsável:</td>
            <td style="color: #cbd5e1;">${ticket.assignedToName || 'Equipe de Triagem TI'}</td>
          </tr>
        </table>
      </div>

      <div style="border-top: 1px solid #334155; padding-top: 16px; font-size: 11px; color: #64748b; line-height: 1.5;">
        Mensagem gerada automaticamente pelo Sistema de Helpdesk da Embrag. Não responda diretamente a este e-mail. Para interagir com a equipe técnica, acesse o portal corporativo com sua conta Google @embrag.com.br.
      </div>
    </div>
  `;

  return { subject, html };
}

/**
 * Creates and stores a notification + simulated email dispatch
 */
export function createNotification(
  type: NotificationType,
  ticket: Ticket,
  recipientEmail: string,
  recipientName: string,
  message: string,
  emailEnabled: boolean = true
): HelpdeskNotification {
  const { subject, html } = generateCorporateEmailHtml(type, ticket, recipientName, message);

  const notification: HelpdeskNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ticketId: ticket.id,
    ticketCode: ticket.code,
    type,
    title:
      type === 'created'
        ? `Novo Chamado ${ticket.code}`
        : type === 'assigned'
        ? `Técnico Atribuído ${ticket.code}`
        : type === 'status_updated'
        ? `Status Atualizado ${ticket.code}`
        : `Nova Resposta ${ticket.code}`,
    message,
    recipientEmail,
    recipientName,
    createdAt: new Date().toISOString(),
    read: false,
    emailSent: emailEnabled,
    emailSubject: subject,
    emailHtmlPreview: html,
  };

  saveStoredNotification(notification);
  playNotificationSound();
  return notification;
}

export function getStoredNotifications(): HelpdeskNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler notificações:', e);
  }

  // Initial welcome seed notification
  const initial: HelpdeskNotification[] = [
    {
      id: 'notif-seed-1',
      ticketId: 'tkt-1',
      ticketCode: 'TKT-1042',
      type: 'status_updated',
      title: 'Status Atualizado TKT-1042',
      message: 'O chamado sobre "Falha no acesso ao ERP Senior" entrou em atendimento pela equipe de TI.',
      recipientEmail: 'mariana.souza@embrag.com.br',
      recipientName: 'Mariana Souza',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      read: false,
      emailSent: true,
      emailSubject: '[Atualização TKT-1042] Status alterado para EM ATENDIMENTO - Helpdesk',
    },
    {
      id: 'notif-seed-2',
      ticketId: 'tkt-1',
      ticketCode: 'TKT-1042',
      type: 'assigned',
      title: 'Técnico Atribuído TKT-1042',
      message: 'Equipe de TI Embrag foi designada como responsável pelo atendimento.',
      recipientEmail: 'mariana.souza@embrag.com.br',
      recipientName: 'Mariana Souza',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      read: true,
      emailSent: true,
      emailSubject: '[Atribuição TKT-1042] Técnico designado para seu atendimento - Helpdesk',
    },
  ];

  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function saveStoredNotification(notification: HelpdeskNotification): void {
  try {
    const existing = getStoredNotifications();
    const updated = [notification, ...existing].slice(0, 50); // Keep last 50
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Erro ao salvar notificação:', e);
  }
}

export function markNotificationAsRead(id: string): HelpdeskNotification[] {
  const existing = getStoredNotifications();
  const updated = existing.map((n) => (n.id === id ? { ...n, read: true } : n));
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function markAllNotificationsAsRead(): HelpdeskNotification[] {
  const existing = getStoredNotifications();
  const updated = existing.map((n) => ({ ...n, read: true }));
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearAllNotifications(): void {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
}
