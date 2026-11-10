import { CorporateConfig, Ticket, TicketComment, UserProfile } from '../types';

const STORAGE_KEYS = {
  CONFIG: 'embrag_helpdesk_config_v1',
  TICKETS: 'embrag_helpdesk_tickets_v1',
  COMMENTS: 'embrag_helpdesk_comments_v1',
  ACTIVE_USER: 'embrag_helpdesk_active_user_v1',
};

export const DEFAULT_CONFIG: CorporateConfig = {
  primaryDomain: 'embrag.com.br',
  allowedDomains: ['embrag.com.br'],
  allowAdminEmergencyBypass: false,
  emailNotificationsEnabled: true,
  roleAssignments: [
    {
      email: 'admin@embrag.com.br',
      role: 'admin',
      name: 'Administrador Geral TI',
      department: 'Tecnologia da Informação',
      assignedAt: '2026-11-09T00:00:00.000Z',
      assignedByEmail: 'sistema@embrag.com.br',
    },
    {
      email: 'ti@embrag.com.br',
      role: 'admin',
      name: 'Coordenação de TI',
      department: 'Tecnologia da Informação',
      assignedAt: '2026-11-09T00:00:00.000Z',
      assignedByEmail: 'sistema@embrag.com.br',
    },
    {
      email: 'suporte@embrag.com.br',
      role: 'agent',
      name: 'Equipe de Suporte Técnico',
      department: 'Tecnologia da Informação',
      assignedAt: '2026-11-09T00:00:00.000Z',
      assignedByEmail: 'admin@embrag.com.br',
    },
    {
      email: 'carlos.mendes@embrag.com.br',
      role: 'agent',
      name: 'Carlos Mendes (Técnico de Redes)',
      department: 'Tecnologia da Informação',
      assignedAt: '2026-11-09T00:00:00.000Z',
      assignedByEmail: 'admin@embrag.com.br',
    },
  ],
  slaHours: {
    baixa: 48,
    media: 24,
    alta: 8,
    urgente: 2,
  },
};

const SEED_TICKETS: Ticket[] = [
  {
    id: 'tkt-1',
    code: 'TKT-1042',
    title: 'Falha no acesso ao ERP Senior após atualização de segurança',
    description: 'Após a reinicialização do servidor de autenticação nesta manhã, todos os operadores do setor financeiro recebem o erro "Conexão recusada pelo host 192.168.10.15". Precisamos emitir faturas urgentes.',
    category: 'Software & Licenças',
    priority: 'urgente',
    status: 'em_atendimento',
    department: 'Financeiro & Controladoria',
    workstationLocation: 'Sede Principal - 2º Andar (Estação FIN-04)',
    requesterUid: 'req-01',
    requesterName: 'Mariana Souza',
    requesterEmail: 'mariana.souza@embrag.com.br',
    assignedToUid: 'admin-01',
    assignedToName: 'Equipe de TI Embrag',
    assignedToEmail: 'admin@embrag.com.br',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 90 min ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    slaDueDate: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    commentsCount: 2,
    tags: ['ERP', 'Financeiro', 'Bloqueio'],
  },
  {
    id: 'tkt-2',
    code: 'TKT-1043',
    title: 'Configuração de VPN Corporativa e novo notebook para consultor',
    description: 'Solicito a liberação de chave de acesso VPN Fortinet e criação de credenciais temporárias para o consultor externo da auditoria Contábil que iniciará os trabalhos na próxima segunda-feira.',
    category: 'Rede & Conectividade',
    priority: 'media',
    status: 'novo',
    department: 'Tecnologia da Informação',
    workstationLocation: 'Remoto / Home Office',
    requesterUid: 'req-02',
    requesterName: 'Carlos Eduardo Mendes',
    requesterEmail: 'carlos.mendes@embrag.com.br',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    slaDueDate: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    commentsCount: 0,
    tags: ['VPN', 'Segurança', 'Acessos'],
  },
  {
    id: 'tkt-3',
    code: 'TKT-1044',
    title: 'Monitor adicional com piscamento intermitente na bancada de expedição',
    description: 'O monitor Dell da estação EXP-02 começou a piscar e apagar quando conectamos via DisplayPort. Foi testado outro cabo HDMI mas a resolução fica distorcida para a leitura de código de barras.',
    category: 'Hardware & Periféricos',
    priority: 'alta',
    status: 'aguardando_usuario',
    department: 'Operações & Logística',
    workstationLocation: 'Galpão Logístico - Portaria 3 (EXP-02)',
    requesterUid: 'req-03',
    requesterName: 'Rodrigo Antunes',
    requesterEmail: 'rodrigo.antunes@embrag.com.br',
    assignedToUid: 'admin-01',
    assignedToName: 'Equipe de TI Embrag',
    assignedToEmail: 'admin@embrag.com.br',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    slaDueDate: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
    commentsCount: 3,
    tags: ['Hardware', 'Monitor', 'Logística'],
  },
  {
    id: 'tkt-4',
    code: 'TKT-1045',
    title: 'Migração de grupo de distribuição comercial no Google Workspace',
    description: 'Necessitamos incluir os novos representantes regionais no grupo comercial@embrag.com.br e configurar o alias orcamentos@embrag.com.br para recebimento automático.',
    category: 'Email & Google Workspace',
    priority: 'media',
    status: 'resolvido',
    department: 'Comercial & Vendas',
    workstationLocation: 'Filial Sul',
    requesterUid: 'req-04',
    requesterName: 'Fernanda Lima',
    requesterEmail: 'fernanda.lima@embrag.com.br',
    assignedToUid: 'admin-01',
    assignedToName: 'Equipe de TI Embrag',
    assignedToEmail: 'admin@embrag.com.br',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    slaDueDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    commentsCount: 2,
    tags: ['Workspace', 'Email', 'Google'],
  },
];

const SEED_COMMENTS: Record<string, TicketComment[]> = {
  'tkt-1': [
    {
      id: 'com-1',
      ticketId: 'tkt-1',
      authorUid: 'admin-01',
      authorName: 'Equipe de TI Embrag',
      authorEmail: 'admin@embrag.com.br',
      authorRole: 'admin',
      content: 'Verificamos a tabela de rotas do firewall após o patch do Linux. A porta 5432 do banco foi temporariamente isolada pelo IDS. Estamos reativando a regra segura.',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      isInternalNote: false,
    },
    {
      id: 'com-2',
      ticketId: 'tkt-1',
      authorUid: 'admin-01',
      authorName: 'Equipe de TI Embrag',
      authorEmail: 'admin@embrag.com.br',
      authorRole: 'admin',
      content: 'Nota interna da equipe: serviço postgresql reiniciado sem impacto nos bancos secundários. Monitorar tráfego na VLAN 20.',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      isInternalNote: true,
    },
  ],
  'tkt-3': [
    {
      id: 'com-3',
      ticketId: 'tkt-3',
      authorUid: 'admin-01',
      authorName: 'Equipe de TI Embrag',
      authorEmail: 'admin@embrag.com.br',
      authorRole: 'agent',
      content: 'Rodrigo, deixamos um adaptador HDMI-DisplayPort ativo com o encarregado da expedição. Por favor conecte e nos informe se estabilizou a imagem.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      isInternalNote: false,
    },
  ],
};

export function getStoredConfig(): CorporateConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      const parsed: CorporateConfig = JSON.parse(raw);
      if (!parsed.roleAssignments || parsed.roleAssignments.length === 0) {
        parsed.roleAssignments = DEFAULT_CONFIG.roleAssignments;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Erro ao ler config:', e);
  }
  return DEFAULT_CONFIG;
}

export function saveStoredConfig(config: CorporateConfig): void {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
}

export function getStoredTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (raw) {
      const tickets: Ticket[] = JSON.parse(raw);
      if (tickets.length > 0) return tickets;
    }
  } catch (e) {
    console.error('Erro ao ler tickets:', e);
  }
  // Initialize with seed data
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(SEED_TICKETS));
  return SEED_TICKETS;
}

export function saveStoredTickets(tickets: Ticket[]): void {
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
}

export function getStoredComments(ticketId: string): TicketComment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    const allComments = raw ? JSON.parse(raw) : SEED_COMMENTS;
    return allComments[ticketId] || [];
  } catch (e) {
    console.error('Erro ao ler comentários:', e);
    return SEED_COMMENTS[ticketId] || [];
  }
}

export function addStoredComment(comment: TicketComment): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    const allComments = raw ? JSON.parse(raw) : { ...SEED_COMMENTS };
    if (!allComments[comment.ticketId]) {
      allComments[comment.ticketId] = [];
    }
    allComments[comment.ticketId].push(comment);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(allComments));

    // Update commentsCount on ticket
    const tickets = getStoredTickets();
    const updated = tickets.map((t) => {
      if (t.id === comment.ticketId) {
        return {
          ...t,
          commentsCount: allComments[comment.ticketId].length,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    saveStoredTickets(updated);
  } catch (e) {
    console.error('Erro ao salvar comentário:', e);
  }
}

export function getCachedUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler usuário salvo:', e);
  }
  return null;
}

export function saveCachedUser(user: UserProfile | null): void {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
  } else {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
  }
}
