import {
  CorporateConfig,
  Ticket,
  TicketComment,
  UserProfile,
  Equipment,
  EquipmentMovement,
  DeliveryTerm,
  GoogleAppsScriptSyncConfig,
} from '../types';

const STORAGE_KEYS = {
  CONFIG: 'embrag_helpdesk_config_v1',
  TICKETS: 'embrag_helpdesk_tickets_v1',
  COMMENTS: 'embrag_helpdesk_comments_v1',
  ACTIVE_USER: 'embrag_helpdesk_active_user_v1',
  EQUIPMENT: 'embrag_helpdesk_equipment_v1',
  EQUIPMENT_MOVEMENTS: 'embrag_helpdesk_movements_v1',
  DELIVERY_TERMS: 'embrag_helpdesk_delivery_terms_v1',
  GAS_CONFIG: 'embrag_helpdesk_gas_config_v1',
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

// ==========================================
// ESTOQUE TECNOLÓGICO - SEED & STORAGE
// ==========================================

export const SEED_EQUIPMENT: Equipment[] = [
  {
    id: 'eqp-1',
    internalCode: 'EQP-101',
    assetTag: 'PAT-04190',
    name: 'Notebook Dell Latitude 5430',
    category: 'notebook',
    brand: 'Dell',
    model: 'Latitude 5430',
    serialNumber: '8FK9Z23',
    status: 'em_uso',
    condition: 'excelente',
    branch: 'Matriz - São Paulo',
    department: 'Financeiro & Controladoria',
    location: '2º Andar - Estação FIN-04',
    assignedTo: {
      assignedToName: 'Mariana Souza',
      assignedToEmail: 'mariana.souza@embrag.com.br',
      department: 'Financeiro & Controladoria',
      assignedAt: '2026-08-15T09:30:00.000Z',
      assignedByAdminEmail: 'admin@embrag.com.br',
    },
    entryDate: '2026-08-10',
    notes: 'Configuração: Intel Core i7 12ª Gen, 16GB RAM DDR4, SSD 512GB NVMe, Windows 11 Pro.',
    createdAt: '2026-08-10T14:00:00.000Z',
    updatedAt: '2026-08-15T09:30:00.000Z',
    lastMovementAt: '2026-08-15T09:30:00.000Z',
  },
  {
    id: 'eqp-2',
    internalCode: 'EQP-102',
    assetTag: 'PAT-04195',
    name: 'Monitor LG Ultrawide 29" IPS',
    category: 'monitor',
    brand: 'LG',
    model: '29WK600-W',
    serialNumber: '003NTZK4B891',
    status: 'em_uso',
    condition: 'excelente',
    branch: 'Matriz - São Paulo',
    department: 'Financeiro & Controladoria',
    location: '2º Andar - Estação FIN-04',
    assignedTo: {
      assignedToName: 'Mariana Souza',
      assignedToEmail: 'mariana.souza@embrag.com.br',
      department: 'Financeiro & Controladoria',
      assignedAt: '2026-08-15T09:30:00.000Z',
      assignedByAdminEmail: 'admin@embrag.com.br',
    },
    entryDate: '2026-08-10',
    notes: 'Resolução 2560x1080, conexões HDMI e DisplayPort. Acompanha braço articulado.',
    createdAt: '2026-08-10T14:10:00.000Z',
    updatedAt: '2026-08-15T09:30:00.000Z',
    lastMovementAt: '2026-08-15T09:30:00.000Z',
  },
  {
    id: 'eqp-3',
    internalCode: 'EQP-103',
    assetTag: 'PAT-03820',
    name: 'Desktop Lenovo ThinkCentre M70q Tiny',
    category: 'desktop',
    brand: 'Lenovo',
    model: 'ThinkCentre M70q Gen 3',
    serialNumber: 'MJ09X8A1',
    status: 'em_uso',
    condition: 'bom',
    branch: 'Matriz - São Paulo',
    department: 'Tecnologia da Informação',
    location: '1º Andar - Sala de Redes TI (Bancada 02)',
    assignedTo: {
      assignedToName: 'Carlos Eduardo Mendes',
      assignedToEmail: 'carlos.mendes@embrag.com.br',
      department: 'Tecnologia da Informação',
      assignedAt: '2026-07-20T11:00:00.000Z',
      assignedByAdminEmail: 'admin@embrag.com.br',
    },
    entryDate: '2026-07-01',
    notes: 'Mini PC dedicado a testes de rede, monitoramento Zabbix e suporte local.',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-20T11:00:00.000Z',
    lastMovementAt: '2026-07-20T11:00:00.000Z',
  },
  {
    id: 'eqp-4',
    internalCode: 'EQP-104',
    assetTag: 'PAT-04310',
    name: 'Notebook Lenovo ThinkPad E14 Gen 4',
    category: 'notebook',
    brand: 'Lenovo',
    model: 'ThinkPad E14 Gen 4',
    serialNumber: 'PF3R7KQ1',
    status: 'disponivel',
    condition: 'novo',
    branch: 'Matriz - São Paulo',
    department: 'Tecnologia da Informação',
    location: 'Almoxarifado TI - Armário 02, Prateleira B',
    assignedTo: null,
    entryDate: '2026-10-15',
    notes: 'Equipamento reserva para onboarding. Ryzen 7 5825U, 16GB RAM, SSD 512GB, formatado com imagem corporativa padrão.',
    createdAt: '2026-10-15T15:00:00.000Z',
    updatedAt: '2026-10-15T15:00:00.000Z',
    lastMovementAt: '2026-10-15T15:00:00.000Z',
  },
  {
    id: 'eqp-5',
    internalCode: 'EQP-105',
    assetTag: 'PAT-02940',
    name: 'Switch Cisco Catalyst 2960-X 48 Portas PoE',
    category: 'switch',
    brand: 'Cisco',
    model: 'WS-C2960X-48FPS-L',
    serialNumber: 'FCW2041B098',
    status: 'em_uso',
    condition: 'bom',
    branch: 'Matriz - São Paulo',
    department: 'Tecnologia da Informação',
    location: 'Data Center Principal - Rack Core 01 (U12 a U14)',
    assignedTo: {
      assignedToName: 'Equipe de Infraestrutura TI',
      assignedToEmail: 'ti@embrag.com.br',
      department: 'Tecnologia da Informação',
      assignedAt: '2026-06-10T08:00:00.000Z',
      assignedByAdminEmail: 'admin@embrag.com.br',
    },
    entryDate: '2026-06-01',
    notes: 'Switch de distribuição dos pontos de rede do 2º e 3º andares com VLANs corporativas configuradas.',
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-10T08:00:00.000Z',
    lastMovementAt: '2026-06-10T08:00:00.000Z',
  },
  {
    id: 'eqp-6',
    internalCode: 'EQP-106',
    assetTag: 'PAT-03112',
    name: 'Access Point Ubiquiti UniFi U6 Pro Wi-Fi 6',
    category: 'access_point',
    brand: 'Ubiquiti',
    model: 'U6-Pro',
    serialNumber: '68D79A814F22',
    status: 'em_uso',
    condition: 'excelente',
    branch: 'Filial - Curitiba',
    department: 'Operações & Logística',
    location: 'Área de Operações - Teto Central Bloco A',
    assignedTo: {
      assignedToName: 'Supervisão Operacional Curitiba',
      assignedToEmail: 'operacoes.cwb@embrag.com.br',
      department: 'Operações & Logística',
      assignedAt: '2026-09-05T14:20:00.000Z',
      assignedByAdminEmail: 'admin@embrag.com.br',
    },
    entryDate: '2026-09-01',
    notes: 'Conectado à controladora UniFi Cloud Embrag. Cobertura da área de expedição.',
    createdAt: '2026-09-01T11:00:00.000Z',
    updatedAt: '2026-09-05T14:20:00.000Z',
    lastMovementAt: '2026-09-05T14:20:00.000Z',
  },
  {
    id: 'eqp-7',
    internalCode: 'EQP-107',
    assetTag: 'PAT-04018',
    name: 'Impressora Multifuncional HP LaserJet Pro M428fdw',
    category: 'impressora',
    brand: 'HP',
    model: 'LaserJet Pro M428fdw',
    serialNumber: 'VNB3N14890',
    status: 'em_manutencao',
    condition: 'regular',
    branch: 'Matriz - São Paulo',
    department: 'Tecnologia da Informação',
    location: 'Assistência Técnica PrintTech (OS #9412)',
    assignedTo: null,
    entryDate: '2026-05-10',
    notes: 'Enviada em 05/11/2026 para substituição do rolo de fusão e limpeza do alimentador ADF. Previsão de retorno: 14/11/2026.',
    createdAt: '2026-05-10T10:00:00.000Z',
    updatedAt: '2026-11-05T16:00:00.000Z',
    lastMovementAt: '2026-11-05T16:00:00.000Z',
  },
  {
    id: 'eqp-8',
    internalCode: 'EQP-108',
    assetTag: 'PAT-04402',
    name: 'Smartphone Samsung Galaxy A54 5G 128GB',
    category: 'smartphone',
    brand: 'Samsung',
    model: 'Galaxy A54 5G',
    serialNumber: 'R58W10XYZ99',
    status: 'reservado',
    condition: 'novo',
    branch: 'Matriz - São Paulo',
    department: 'Comercial & Vendas',
    location: 'Cofre da TI - Gaveta 03 (Chip Claro corporativo incluso)',
    assignedTo: {
      assignedToName: 'Reservado para Roberto Dias (Novo Gerente Comercial)',
      assignedToEmail: 'comercial@embrag.com.br',
      department: 'Comercial & Vendas',
      assignedAt: '2026-11-08T10:00:00.000Z',
      assignedByAdminEmail: 'admin@embrag.com.br',
    },
    entryDate: '2026-11-01',
    notes: 'Aparelho homologado com MDM corporativo e WhatsApp Business.',
    createdAt: '2026-11-01T09:00:00.000Z',
    updatedAt: '2026-11-08T10:00:00.000Z',
    lastMovementAt: '2026-11-08T10:00:00.000Z',
  },
  {
    id: 'eqp-9',
    internalCode: 'EQP-109',
    assetTag: 'PAT-01850',
    name: 'Roteador MikroTik CCR1009-7G-1C-PC',
    category: 'roteador',
    brand: 'MikroTik',
    model: 'CCR1009-7G-1C-PC',
    serialNumber: '92F00918B21',
    status: 'baixado',
    condition: 'danificado',
    branch: 'Matriz - São Paulo',
    department: 'Tecnologia da Informação',
    location: 'Depósito de Descarte TI - Palete 04 (Aguardando leilão de sucata)',
    assignedTo: null,
    entryDate: '2024-03-12',
    notes: 'Baixa patrimonial aprovada pela Diretoria em 01/10/2026. Portas Ethernet queimadas por surto elétrico e processador instável.',
    createdAt: '2024-03-12T08:00:00.000Z',
    updatedAt: '2026-10-01T15:30:00.000Z',
    lastMovementAt: '2026-10-01T15:30:00.000Z',
  },
];

export const SEED_MOVEMENTS: EquipmentMovement[] = [
  {
    id: 'mov-1',
    equipmentId: 'eqp-1',
    equipmentCode: 'EQP-101 (PAT-04190)',
    equipmentName: 'Notebook Dell Latitude 5430',
    type: 'entrega',
    previousStatus: 'disponivel',
    newStatus: 'em_uso',
    previousAssignedTo: null,
    newAssignedTo: 'Mariana Souza',
    previousLocation: 'Almoxarifado TI - Armário 01',
    newLocation: '2º Andar - Estação FIN-04',
    previousBranch: 'Matriz - São Paulo',
    newBranch: 'Matriz - São Paulo',
    performedByUid: 'usr-admin-01',
    performedByName: 'Administrador TI Embrag',
    performedByEmail: 'admin@embrag.com.br',
    timestamp: '2026-08-15T09:30:00.000Z',
    notes: 'Entrega de notebook corporativo com termo de responsabilidade assinado.',
  },
  {
    id: 'mov-2',
    equipmentId: 'eqp-2',
    equipmentCode: 'EQP-102 (PAT-04195)',
    equipmentName: 'Monitor LG Ultrawide 29" IPS',
    type: 'entrega',
    previousStatus: 'disponivel',
    newStatus: 'em_uso',
    previousAssignedTo: null,
    newAssignedTo: 'Mariana Souza',
    previousLocation: 'Almoxarifado TI - Prateleira Monitores',
    newLocation: '2º Andar - Estação FIN-04',
    previousBranch: 'Matriz - São Paulo',
    newBranch: 'Matriz - São Paulo',
    performedByUid: 'usr-admin-01',
    performedByName: 'Administrador TI Embrag',
    performedByEmail: 'admin@embrag.com.br',
    timestamp: '2026-08-15T09:30:00.000Z',
    notes: 'Instalação de monitor secundário para visualização de planilhas financeiras.',
  },
  {
    id: 'mov-3',
    equipmentId: 'eqp-7',
    equipmentCode: 'EQP-107 (PAT-04018)',
    equipmentName: 'Impressora Multifuncional HP LaserJet Pro M428fdw',
    type: 'envio_manutencao',
    previousStatus: 'em_uso',
    newStatus: 'em_manutencao',
    previousAssignedTo: 'Secretaria Executiva',
    newAssignedTo: null,
    previousLocation: '3º Andar - Sala de Reunião da Diretoria',
    newLocation: 'Assistência Técnica PrintTech (OS #9412)',
    previousBranch: 'Matriz - São Paulo',
    newBranch: 'Matriz - São Paulo',
    performedByUid: 'usr-admin-01',
    performedByName: 'Administrador TI Embrag',
    performedByEmail: 'admin@embrag.com.br',
    timestamp: '2026-11-05T16:00:00.000Z',
    notes: 'Aparelho atolando papel e manchando impressões. Troca de fusor autorizada.',
    maintenanceProvider: 'PrintTech Serviços Técnicos Ltda.',
    expectedReturnDate: '2026-11-14',
  },
  {
    id: 'mov-4',
    equipmentId: 'eqp-9',
    equipmentCode: 'EQP-109 (PAT-01850)',
    equipmentName: 'Roteador MikroTik CCR1009-7G-1C-PC',
    type: 'baixa',
    previousStatus: 'em_manutencao',
    newStatus: 'baixado',
    previousAssignedTo: null,
    newAssignedTo: null,
    previousLocation: 'Bancada de Manutenção TI',
    newLocation: 'Depósito de Descarte TI - Palete 04',
    previousBranch: 'Matriz - São Paulo',
    newBranch: 'Matriz - São Paulo',
    performedByUid: 'usr-admin-01',
    performedByName: 'Administrador TI Embrag',
    performedByEmail: 'admin@embrag.com.br',
    timestamp: '2026-10-01T15:30:00.000Z',
    notes: 'Laudo técnico constatou queima de componentes com custo de reparo superior ao valor residual. Baixa contábil aprovada.',
  },
];

export function getStoredEquipment(): Equipment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Erro ao ler equipamentos:', e);
  }
  localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(SEED_EQUIPMENT));
  return SEED_EQUIPMENT;
}

export function saveStoredEquipment(equipments: Equipment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipments));
  } catch (e) {
    console.error('Erro ao salvar equipamentos:', e);
  }
}

export function getStoredMovements(equipmentId?: string): EquipmentMovement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EQUIPMENT_MOVEMENTS);
    if (raw) {
      const parsed: EquipmentMovement[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (equipmentId) {
          return parsed.filter((m) => m.equipmentId === equipmentId);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler movimentações:', e);
  }
  localStorage.setItem(STORAGE_KEYS.EQUIPMENT_MOVEMENTS, JSON.stringify(SEED_MOVEMENTS));
  if (equipmentId) {
    return SEED_MOVEMENTS.filter((m) => m.equipmentId === equipmentId);
  }
  return SEED_MOVEMENTS;
}

export function saveStoredMovements(movements: EquipmentMovement[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT_MOVEMENTS, JSON.stringify(movements));
  } catch (e) {
    console.error('Erro ao salvar histórico de movimentações:', e);
  }
}

export function addStoredMovement(movement: EquipmentMovement): void {
  try {
    const existing = getStoredMovements();
    const updated = [movement, ...existing];
    saveStoredMovements(updated);
  } catch (e) {
    console.error('Erro ao adicionar movimentação:', e);
  }
}

export const DEFAULT_GAS_CONFIG: GoogleAppsScriptSyncConfig = {
  scriptUrl: 'https://script.google.com/a/macros/embrag.com.br/s/AKfycbx4sMrOZdtblAwyp3HJ9Wtz4msDQvnBJy31qZvCpKl102AbvA3U-AVdctmmn-Hnv1Kp-A/exec',
  autoSyncEnabled: true,
  lastSyncStatus: 'idle',
  lastSyncMessage: 'Pronto para sincronização com Google Apps Script da Embrag',
  syncedEquipmentsCount: 9,
};

export const SEED_DELIVERY_TERMS: DeliveryTerm[] = [
  {
    id: 'term-1',
    protocol: 'EMB-TRM-2026-0001',
    equipmentId: 'eqp-1',
    equipmentCode: 'NB-001',
    equipmentName: 'Notebook Dell Latitude 5430',
    brand: 'Dell',
    model: 'Latitude 5430 Core i7 16GB 512GB SSD',
    serialNumber: 'BR5430K9821L',
    assetTag: 'PAT-10842',
    category: 'notebook',
    condition: 'excelente',
    recipientName: 'Mariana Rocha',
    recipientEmail: 'mariana.rocha@embrag.com.br',
    recipientRole: 'Gerente Financeira',
    recipientDepartment: 'Financeiro',
    branch: 'Matriz - São Paulo',
    accessories: [
      'Carregador USB-C Original Dell 65W',
      'Cabo de alimentação padrão NBR',
      'Mouse sem fio Dell Pro',
      'Mochila corporativa antifurto Embrag',
    ],
    conditionNotes: 'Equipamento entregue em perfeito estado, sem avarias ou riscos na tela e carcaça.',
    declarationVersion: '2.4',
    declarationText: 'Declaro ter recebido o equipamento de tecnologia da EMBRAG acima especificado, em perfeitas condições de uso, conservação e funcionamento, bem como os respectivos acessórios. Assumo total responsabilidade pela guarda, zelo e conservação do mesmo, comprometendo-me a utilizá-lo estritamente para os fins profissionais da empresa e a devolvê-lo imediatamente em caso de transferência, desligamento ou solicitação formal do departamento de TI.',
    status: 'assinado',
    signedAt: '2026-02-10T14:30:00.000Z',
    signerName: 'Mariana Rocha',
    signerIpOrLocation: '187.54.120.44 (Rede Corporativa Embrag SP)',
    createdAt: '2026-02-10T14:15:00.000Z',
    createdByUid: 'admin-seed',
    createdByName: 'Administrador TI',
    createdByEmail: 'admin@embrag.com.br',
    externalScriptUrl: 'https://script.google.com/a/macros/embrag.com.br/s/AKfycbx4sMrOZdtblAwyp3HJ9Wtz4msDQvnBJy31qZvCpKl102AbvA3U-AVdctmmn-Hnv1Kp-A/exec#estoque',
  },
];

export function getStoredDeliveryTerms(equipmentId?: string): DeliveryTerm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELIVERY_TERMS);
    if (raw) {
      const parsed: DeliveryTerm[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (equipmentId) {
          return parsed.filter((t) => t.equipmentId === equipmentId);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler termos de entrega:', e);
  }
  localStorage.setItem(STORAGE_KEYS.DELIVERY_TERMS, JSON.stringify(SEED_DELIVERY_TERMS));
  if (equipmentId) {
    return SEED_DELIVERY_TERMS.filter((t) => t.equipmentId === equipmentId);
  }
  return SEED_DELIVERY_TERMS;
}

export function saveStoredDeliveryTerms(terms: DeliveryTerm[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DELIVERY_TERMS, JSON.stringify(terms));
  } catch (e) {
    console.error('Erro ao salvar termos de entrega:', e);
  }
}

export function addOrUpdateStoredDeliveryTerm(term: DeliveryTerm): void {
  try {
    const existing = getStoredDeliveryTerms();
    const idx = existing.findIndex((t) => t.id === term.id);
    let updated: DeliveryTerm[];
    if (idx >= 0) {
      updated = [...existing];
      updated[idx] = term;
    } else {
      updated = [term, ...existing];
    }
    saveStoredDeliveryTerms(updated);
  } catch (e) {
    console.error('Erro ao atualizar termo:', e);
  }
}

export function getStoredGasConfig(): GoogleAppsScriptSyncConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GAS_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Erro ao ler config GAS:', e);
  }
  localStorage.setItem(STORAGE_KEYS.GAS_CONFIG, JSON.stringify(DEFAULT_GAS_CONFIG));
  return DEFAULT_GAS_CONFIG;
}

export function saveStoredGasConfig(config: GoogleAppsScriptSyncConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GAS_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Erro ao salvar config GAS:', e);
  }
}

