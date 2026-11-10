export type TicketStatus = 'novo' | 'em_atendimento' | 'aguardando_usuario' | 'resolvido' | 'fechado';

export type TicketPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export type TicketCategory =
  | 'Hardware & Periféricos'
  | 'Software & Licenças'
  | 'Rede & Conectividade'
  | 'Acessos & Permissões'
  | 'Email & Google Workspace'
  | 'Telefonia & VOIP'
  | 'Impressoras & Scanners'
  | 'Outros Assuntos';

export type Department =
  | 'Tecnologia da Informação'
  | 'Financeiro & Controladoria'
  | 'Recursos Humanos'
  | 'Operações & Logística'
  | 'Comercial & Vendas'
  | 'Diretoria & Jurídico'
  | 'Administrativo';

export type UserRole = 'admin' | 'agent' | 'user';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  department?: Department;
  isCorporateVerified: boolean;
  corporateDomain: string;
}

export interface TicketAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedByName?: string;
  isImage?: boolean;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorUid: string;
  authorName: string;
  authorEmail: string;
  authorPhoto?: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
  isInternalNote: boolean; // Only visible to IT team/admin
  attachments?: TicketAttachment[];
}

export interface TicketStatusChange {
  status: TicketStatus;
  changedAt: string;
  changedByUid: string;
  changedByName: string;
}

export interface Ticket {
  id: string;
  code: string; // e.g. TKT-1042
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  department: Department;
  workstationLocation?: string;
  
  // Requester
  requesterUid: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhoto?: string;

  // Assigned Agent
  assignedToUid?: string;
  assignedToName?: string;
  assignedToEmail?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  firstResponseAt?: string; // Recorded when staff submits first public response
  resolvedAt?: string;
  closedAt?: string;
  
  // SLA
  slaDueDate: string;
  slaBreached?: boolean;

  commentsCount: number;
  tags?: string[];
  attachments?: TicketAttachment[];
  statusHistory?: TicketStatusChange[];
}

export interface AuditLogEntry {
  id: string;
  ticketId?: string;
  ticketCode?: string;
  action:
    | 'ticket_created'
    | 'status_changed'
    | 'priority_changed'
    | 'assigned'
    | 'comment_added'
    | 'config_updated'
    | 'role_assigned'
    | 'equipment_created'
    | 'equipment_updated'
    | 'equipment_moved'
    | 'equipment_deleted';
  performedByUid: string;
  performedByName: string;
  performedByEmail: string;
  performedByRole: UserRole;
  details: string;
  timestamp: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

export interface UserRoleAssignment {
  email: string;
  role: UserRole; // 'admin' (Admin TI) | 'agent' (Técnico TI) | 'user' (Colaborador)
  name?: string;
  department?: Department;
  assignedAt: string;
  assignedByEmail: string;
}

export interface CorporateConfig {
  primaryDomain: string; // 'embrag.com.br'
  allowedDomains: string[]; // ['embrag.com.br']
  allowAdminEmergencyBypass: boolean;
  emailNotificationsEnabled: boolean;
  roleAssignments: UserRoleAssignment[];
  slaHours: {
    baixa: number; // e.g. 48h
    media: number; // e.g. 24h
    alta: number; // e.g. 8h
    urgente: number; // e.g. 2h
  };
}

export type NotificationType = 'created' | 'status_updated' | 'assigned' | 'new_comment';

export interface HelpdeskNotification {
  id: string;
  ticketId: string;
  ticketCode: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientEmail: string;
  recipientName: string;
  createdAt: string;
  read: boolean;
  emailSent: boolean;
  emailSubject?: string;
  emailHtmlPreview?: string;
}

// ==========================================
// ESTOQUE TECNOLÓGICO (TECH INVENTORY)
// ==========================================

export type EquipmentCategory =
  | 'notebook'
  | 'desktop'
  | 'monitor'
  | 'impressora'
  | 'smartphone'
  | 'roteador'
  | 'switch'
  | 'access_point'
  | 'antena'
  | 'servidor'
  | 'periferico'
  | 'outro';

export type EquipmentStatus =
  | 'disponivel'
  | 'em_uso'
  | 'reservado'
  | 'em_manutencao'
  | 'baixado';

export type EquipmentCondition =
  | 'novo'
  | 'excelente'
  | 'bom'
  | 'regular'
  | 'danificado';

export interface EquipmentAssignment {
  assignedToName: string;
  assignedToEmail?: string;
  department?: string;
  assignedAt: string;
  assignedByAdminEmail?: string;
}

export interface Equipment {
  id: string; // Document ID
  internalCode: string; // Código interno único (ex: EQP-101, NB-004)
  assetTag?: string; // Número de patrimônio (opcional, ex: PAT-10492)
  name: string; // Nome ou descrição (ex: Notebook Dell Latitude 5430)
  category: EquipmentCategory;
  brand: string; // Fabricante (Dell, Lenovo, Apple, Cisco, HP, etc.)
  model: string; // Modelo (Latitude 5430, Catalyst 2960, etc.)
  serialNumber?: string; // Número de série
  status: EquipmentStatus; // Situação atual
  condition: EquipmentCondition; // Estado de conservação
  branch: string; // Unidade ou filial (ex: Matriz - São Paulo)
  department: string; // Setor (TI, Financeiro, Logística, etc.)
  location: string; // Local físico: sala, mesa, depósito, rack, armário
  assignedTo?: EquipmentAssignment | null; // Com quem está (se status === 'em_uso' ou 'reservado')
  entryDate: string; // Data de entrada no estoque
  notes?: string; // Observações técnicas
  photos?: string[]; // Array de URLs ou Base64 compactado
  createdAt: string;
  updatedAt: string;
  lastMovementAt?: string;
}

export type MovementType =
  | 'cadastro_inicial'
  | 'entrega'
  | 'devolucao'
  | 'transferencia'
  | 'mudanca_local'
  | 'envio_manutencao'
  | 'retorno_manutencao'
  | 'reserva'
  | 'baixa'
  | 'edicao';

export interface EquipmentMovement {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  type: MovementType;
  previousStatus?: EquipmentStatus;
  newStatus: EquipmentStatus;
  previousAssignedTo?: string | null;
  newAssignedTo?: string | null;
  previousLocation?: string;
  newLocation: string;
  previousBranch?: string;
  newBranch?: string;
  performedByUid: string;
  performedByName: string;
  performedByEmail: string;
  timestamp: string;
  notes?: string;
  maintenanceProvider?: string;
  expectedReturnDate?: string;
}


