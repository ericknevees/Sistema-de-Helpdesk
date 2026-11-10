import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  AuditLogEntry,
  CorporateConfig,
  Department,
  HelpdeskNotification,
  Ticket,
  TicketComment,
  UserProfile,
  UserRole,
  UserRoleAssignment,
} from '../types';
import { logger } from './monitoring';

// Initialize Firebase App instance safely
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
// Critical: must pass firestoreDatabaseId
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    logger.info('Cloud Firestore conectado com sucesso.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      logger.warn('Firestore offline ou em modo inicialização.');
    }
    return false;
  }
}

// Error handling as specified in skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  logger.captureError(error, { operationType, path: path || undefined });
  throw new Error(JSON.stringify(errInfo));
}

// Google Auth Provider setup with Workspace Scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.setCustomParameters({
  hd: 'embrag.com.br',
  prompt: 'select_account',
});

export class UnauthorizedCorporateDomainError extends Error {
  email: string;
  domain: string;
  allowedDomains: string[];

  constructor(email: string, domain: string, allowedDomains: string[]) {
    super(`O endereço ${email} não pertence a um domínio corporativo autorizado (${allowedDomains.join(', ')}).`);
    this.name = 'UnauthorizedCorporateDomainError';
    this.email = email;
    this.domain = domain;
    this.allowedDomains = allowedDomains;
  }
}

export function validateCorporateDomain(email: string | null | undefined, allowedDomains: string[]): boolean {
  if (!email) return false;
  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return allowedDomains.some((d) => d.toLowerCase().trim() === domain);
}

export function buildUserProfile(
  user: User,
  allowedDomains: string[],
  roleAssignments?: UserRoleAssignment[]
): UserProfile {
  const email = (user.email || '').toLowerCase().trim();
  const domain = email.split('@')[1] || '';
  const isCorporate = validateCorporateDomain(email, allowedDomains);

  let role: UserRole = 'user';
  let assignedDept: Department | undefined = undefined;

  // 1. Check custom configured corporate roles table first
  if (roleAssignments && roleAssignments.length > 0) {
    const customAssignment = roleAssignments.find(
      (a) => a.email.toLowerCase().trim() === email
    );
    if (customAssignment) {
      role = customAssignment.role;
      assignedDept = customAssignment.department;
    }
  }

  // 2. Fallback for primary admin accounts if not explicitly set
  if (role === 'user') {
    if (
      email === 'admin@embrag.com.br' ||
      email.startsWith('ti@') ||
      email.startsWith('admin@')
    ) {
      role = 'admin';
    } else if (email.includes('suporte') || email.includes('helpdesk')) {
      role = 'agent';
    }
  }

  return {
    uid: user.uid,
    name: user.displayName || email.split('@')[0],
    email: email,
    photoURL: user.photoURL || undefined,
    role,
    department: assignedDept || (role === 'admin' || role === 'agent' ? 'Tecnologia da Informação' : undefined),
    isCorporateVerified: isCorporate,
    corporateDomain: domain,
  };
}

export async function signInWithGoogleCorporate(
  allowedDomains: string[],
  roleAssignments?: UserRoleAssignment[]
): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const email = user.email || '';

    const isValid = validateCorporateDomain(email, allowedDomains);
    if (!isValid) {
      const userDomain = email.split('@')[1] || 'desconhecido';
      await signOut(auth);
      throw new UnauthorizedCorporateDomainError(email, userDomain, allowedDomains);
    }

    return buildUserProfile(user, allowedDomains, roleAssignments);
  } catch (error: any) {
    if (error instanceof UnauthorizedCorporateDomainError) {
      throw error;
    }
    logger.captureError(error, { action: 'signInWithGoogleCorporate' });
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// ========================
// FIRESTORE CLOUD SERVICES
// ========================

/**
 * Real-time listener for tickets with RBAC:
 * - Colaboradores (user) ONLY receive their own tickets.
 * - Staff (admin / agent) receive all tickets.
 */
export function subscribeToCloudTickets(
  userRole: UserRole,
  userEmail: string,
  onUpdate: (tickets: Ticket[]) => void,
  onError?: (error: any) => void
) {
  // Use simple single-field order to avoid requiring custom composite indexes
  const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const allTickets: Ticket[] = [];
      snapshot.forEach((doc) => {
        allTickets.push(doc.data() as Ticket);
      });

      // Stable descending order
      allTickets.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      if (userRole === 'user') {
        const normalized = userEmail.toLowerCase().trim();
        const myTickets = allTickets.filter(
          (t) => (t.requesterEmail || '').toLowerCase().trim() === normalized
        );
        onUpdate(myTickets);
      } else {
        onUpdate(allTickets);
      }
    },
    (err) => {
      logger.warn('Erro ou fallback de conexão Cloud Firestore ao listar chamados:', { error: String(err) });
      if (onError) onError(err);
    }
  );
}

/**
 * Save / Update ticket in Cloud Firestore
 */
export async function saveCloudTicket(ticket: Ticket): Promise<void> {
  try {
    await setDoc(doc(db, 'tickets', ticket.id), ticket);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `tickets/${ticket.id}`);
  }
}

/**
 * Concurrency-safe ticket assignment using Firestore atomic transactions
 */
export async function assignTicketSafely(
  ticketId: string,
  agent: UserProfile
): Promise<{ success: boolean; message: string; ticket?: Ticket }> {
  const ticketRef = doc(db, 'tickets', ticketId);
  try {
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ticketRef);
      if (!snap.exists()) {
        throw new Error('Chamado não encontrado.');
      }
      const data = snap.data() as Ticket;

      // If already assigned to someone else
      if (data.assignedToEmail && data.assignedToEmail.toLowerCase() !== agent.email.toLowerCase()) {
        return {
          success: false,
          message: `Este chamado já foi assumido anteriormente por ${data.assignedToName || data.assignedToEmail}.`,
          ticket: data,
        };
      }

      const updated: Ticket = {
        ...data,
        assignedToUid: agent.uid,
        assignedToName: agent.name,
        assignedToEmail: agent.email,
        status: data.status === 'novo' ? 'em_atendimento' : data.status,
        updatedAt: new Date().toISOString(),
      };

      transaction.update(ticketRef, {
        assignedToUid: updated.assignedToUid,
        assignedToName: updated.assignedToName,
        assignedToEmail: updated.assignedToEmail,
        status: updated.status,
        updatedAt: updated.updatedAt,
      });

      return {
        success: true,
        message: 'Chamado atribuído com sucesso!',
        ticket: updated,
      };
    });

    return result;
  } catch (error) {
    logger.captureError(error, { action: 'assignTicketSafely', ticketId });
    throw error;
  }
}

/**
 * Record immutable audit log entry in Cloud Firestore
 */
export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await setDoc(doc(db, 'audit_logs', entry.id), entry);
    logger.info(`Audit log registrado: ${entry.action}`, {
      ticketCode: entry.ticketCode,
      user: entry.performedByEmail,
    });
  } catch (error) {
    logger.warn('Aviso ao registrar auditoria no Firestore:', { error: String(error) });
  }
}

/**
 * Subscribe to audit logs (Admin only)
 */
export function subscribeToAuditLogs(onUpdate: (logs: AuditLogEntry[]) => void) {
  const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: AuditLogEntry[] = [];
      snapshot.forEach((doc) => {
        logs.push(doc.data() as AuditLogEntry);
      });
      onUpdate(logs);
    },
    (err) => {
      logger.warn('Aviso ao escutar logs de auditoria:', { error: String(err) });
    }
  );
}

/**
 * Real-time listener for comments on a ticket
 */
export function subscribeToCloudComments(
  ticketId: string,
  onUpdate: (comments: TicketComment[]) => void
) {
  const q = query(
    collection(db, 'tickets', ticketId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const comments: TicketComment[] = [];
      snapshot.forEach((doc) => {
        comments.push(doc.data() as TicketComment);
      });
      onUpdate(comments);
    },
    (err) => {
      console.warn('Erro ao escutar comentários do Cloud Firestore:', err);
    }
  );
}

/**
 * Add comment to Cloud Firestore and update ticket comment counter
 */
export async function addCloudComment(
  comment: TicketComment,
  newCount: number,
  ticket?: Ticket
): Promise<void> {
  try {
    await setDoc(doc(db, 'tickets', comment.ticketId, 'comments', comment.id), comment);
    const updatePayload: Record<string, any> = {
      commentsCount: newCount,
      updatedAt: new Date().toISOString(),
    };

    // First Response SLA: Only registered on public responses by IT staff
    if (!comment.isInternalNote && (comment.authorRole === 'admin' || comment.authorRole === 'agent')) {
      if (ticket && !ticket.firstResponseAt) {
        updatePayload.firstResponseAt = new Date().toISOString();
      }
    }

    await updateDoc(doc(db, 'tickets', comment.ticketId), updatePayload);
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `tickets/${comment.ticketId}/comments/${comment.id}`
    );
  }
}

/**
 * Save notification to Cloud Firestore
 */
export async function saveCloudNotification(notification: HelpdeskNotification): Promise<void> {
  try {
    await setDoc(doc(db, 'notifications', notification.id), notification);
  } catch (error) {
    console.warn('Aviso ao sincronizar notificação na nuvem:', error);
  }
}

/**
 * Real-time listener for corporate configuration and role assignments
 */
export function subscribeToCloudConfig(onUpdate: (config: CorporateConfig) => void) {
  return onSnapshot(
    doc(db, 'config', 'corporate'),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as CorporateConfig);
      }
    },
    (err) => {
      console.warn('Configuração corporativa na nuvem em modo fallback:', err);
    }
  );
}

/**
 * Save corporate configuration and role assignments to Cloud Firestore
 */
export async function saveCloudConfig(config: CorporateConfig): Promise<void> {
  try {
    await setDoc(doc(db, 'config', 'corporate'), config);
  } catch (error) {
    console.warn('Erro ao salvar configuração no Cloud Firestore:', error);
  }
}

