import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Building,
  User,
  ArrowUpDown,
  Laptop,
  Wifi,
  Key,
  Mail,
  Phone,
  FileQuestion,
  Flame,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { Department, Ticket, TicketCategory, TicketPriority, TicketStatus, UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { sanitizeForCsv } from '../lib/utils';

interface TicketListProps {
  tickets: Ticket[];
  currentUser: UserProfile;
  onSelectTicket: (ticket: Ticket) => void;
  onOpenNewTicket: () => void;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  currentUser,
  onSelectTicket,
  onOpenNewTicket,
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'todos'>('todos');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'todas'>('todas');
  const [departmentFilter, setDepartmentFilter] = useState<Department | 'todos'>('todos');
  const [myTicketsOnly, setMyTicketsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'urgent' | 'sla'>('recent');

  const isStaff = currentUser.role === 'admin' || currentUser.role === 'agent';

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'todos' ||
    priorityFilter !== 'todas' ||
    departmentFilter !== 'todos' ||
    myTicketsOnly;

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('todos');
    setPriorityFilter('todas');
    setDepartmentFilter('todos');
    setMyTicketsOnly(false);
  };

  const filteredTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        // Real-time Search
        if (searchQuery.trim()) {
          const rawQ = searchQuery.toLowerCase().trim();
          const cleanQ = rawQ.replace(/^#/, '');

          const matchCode = t.code.toLowerCase().includes(rawQ) || t.code.toLowerCase().includes(cleanQ);
          const matchTitle = t.title.toLowerCase().includes(rawQ);
          const matchRequester =
            t.requesterName.toLowerCase().includes(rawQ) ||
            t.requesterEmail.toLowerCase().includes(rawQ);
          const matchDescription = t.description.toLowerCase().includes(rawQ);
          const matchLocation = t.workstationLocation?.toLowerCase().includes(rawQ);

          if (!matchCode && !matchTitle && !matchRequester && !matchDescription && !matchLocation) {
            return false;
          }
        }

        // Status
        if (statusFilter !== 'todos' && t.status !== statusFilter) return false;

        // Priority
        if (priorityFilter !== 'todas' && t.priority !== priorityFilter) return false;

        // Department
        if (departmentFilter !== 'todos' && t.department !== departmentFilter) return false;

        // My Tickets
        if (myTicketsOnly) {
          const isMine =
            t.requesterEmail.toLowerCase() === currentUser.email.toLowerCase() ||
            t.assignedToEmail?.toLowerCase() === currentUser.email.toLowerCase();
          if (!isMine) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'urgent') {
          const weights: Record<TicketPriority, number> = { urgente: 4, alta: 3, media: 2, baixa: 1 };
          return weights[b.priority] - weights[a.priority];
        }
        if (sortBy === 'sla') {
          return new Date(a.slaDueDate).getTime() - new Date(b.slaDueDate).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tickets, searchQuery, statusFilter, priorityFilter, departmentFilter, myTicketsOnly, sortBy, currentUser]);

  // Export filtered tickets to CSV format with formula injection sanitization and UTF-8 BOM
  const handleExportCSV = () => {
    if (!filteredTickets.length) {
      alert('Nenhum chamado disponível para exportação com os filtros atuais.');
      return;
    }

    const headers = [
      'Código',
      'Título',
      'Status',
      'Prioridade',
      'Categoria',
      'Departamento',
      'Solicitante Nome',
      'Solicitante E-mail',
      'Técnico Responsável',
      'Técnico E-mail',
      'Estação / Local',
      'Data de Abertura',
      'Prazo SLA',
      'Data de Resolução',
      'Qtd Mensagens',
      'Descrição',
    ];

    const escapeCsv = (val: string | number | undefined | null) => {
      const sanitized = sanitizeForCsv(val);
      const escaped = sanitized.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = filteredTickets.map((t) => [
      escapeCsv(t.code),
      escapeCsv(t.title),
      escapeCsv(t.status.replace('_', ' ').toUpperCase()),
      escapeCsv(t.priority.toUpperCase()),
      escapeCsv(t.category),
      escapeCsv(t.department),
      escapeCsv(t.requesterName),
      escapeCsv(t.requesterEmail),
      escapeCsv(t.assignedToName || 'Não atribuído'),
      escapeCsv(t.assignedToEmail || ''),
      escapeCsv(t.workstationLocation || 'Geral / Remoto'),
      escapeCsv(new Date(t.createdAt).toLocaleString('pt-BR')),
      escapeCsv(new Date(t.slaDueDate).toLocaleString('pt-BR')),
      escapeCsv(t.resolvedAt ? new Date(t.resolvedAt).toLocaleString('pt-BR') : 'Em aberto'),
      escapeCsv(t.commentsCount || 0),
      escapeCsv(t.description.replace(/\n+/g, ' ')),
    ]);

    const csvContent = [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');
    // UTF-8 BOM (\uFEFF) ensures Excel decodes Brazilian Portuguese accents (pt-BR) correctly
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `embrag-chamados-ti-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (category: TicketCategory) => {
    switch (category) {
      case 'Hardware & Periféricos':
      case 'Impressoras & Scanners':
        return <Laptop className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Rede & Conectividade':
        return <Wifi className="w-3.5 h-3.5 text-cyan-500" />;
      case 'Acessos & Permissões':
        return <Key className="w-3.5 h-3.5 text-amber-500" />;
      case 'Email & Google Workspace':
        return <Mail className="w-3.5 h-3.5 text-blue-500" />;
      case 'Telefonia & VOIP':
        return <Phone className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <FileQuestion className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'novo':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Novo
          </span>
        );
      case 'em_atendimento':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Em Atendimento
          </span>
        );
      case 'aguardando_usuario':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Aguardando Usuário
          </span>
        );
      case 'resolvido':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            Resolvido
          </span>
        );
      case 'fechado':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              theme === 'dark'
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            Fechado
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-500 border border-rose-500/40 text-[11px] font-bold uppercase tracking-wider">
            <Flame className="w-3 h-3 text-rose-500 animate-bounce" />
            Urgente
          </span>
        );
      case 'alta':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/40 text-[11px] font-semibold">
            Alta
          </span>
        );
      case 'media':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[11px] font-medium">
            Média
          </span>
        );
      case 'baixa':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${
              theme === 'dark'
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            Baixa
          </span>
        );
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 5) return 'Agora mesmo';
    if (minutes < 60) return `Há ${minutes}m`;
    if (hours < 24) return `Há ${hours}h`;
    return `Há ${days}d`;
  };

  const formatSlaCountdown = (dueDateIso: string, status: TicketStatus) => {
    if (status === 'resolvido' || status === 'fechado') {
      return (
        <span className="text-emerald-500 font-medium text-xs flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" /> SLA cumprido
        </span>
      );
    }
    const diff = new Date(dueDateIso).getTime() - Date.now();
    const hours = Math.round(diff / (1000 * 60 * 60));

    if (diff < 0) {
      return (
        <span className="text-rose-500 font-bold text-xs flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5" /> SLA Vencido ({Math.abs(hours)}h)
        </span>
      );
    }
    if (hours <= 2) {
      return (
        <span className="text-amber-500 font-semibold text-xs flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" /> SLA Crítico: {hours}h
        </span>
      );
    }
    return (
      <span className={theme === 'dark' ? 'text-slate-400 text-xs flex items-center gap-1' : 'text-slate-500 text-xs flex items-center gap-1'}>
        <Clock className="w-3.5 h-3.5 text-slate-400" /> SLA: {hours}h
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters Bar */}
      <div
        className={`rounded-2xl p-4 transition-colors border ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
              <Search className="w-4 h-4" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código (#TKT-xxxx), título, solicitante ou local..."
              className={`w-full pl-10 pr-20 py-2 rounded-xl text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                theme === 'dark'
                  ? 'bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500'
                  : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-500 rounded"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMyTicketsOnly(!myTicketsOnly)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                myTicketsOnly
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : theme === 'dark'
                  ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
            >
              Meus Chamados
            </button>

            {/* Status Selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="todos">Status: Todos</option>
              <option value="novo">Novo</option>
              <option value="em_atendimento">Em Atendimento</option>
              <option value="aguardando_usuario">Aguardando Usuário</option>
              <option value="resolvido">Resolvido</option>
              <option value="fechado">Fechado</option>
            </select>

            {/* Priority Selector */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="todas">Prioridade: Todas</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>

            {/* Sort Selector */}
            <div
              className={`flex items-center gap-1.5 pl-2 border-l ${
                theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`px-2.5 py-2 rounded-lg border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="recent">Mais Recentes</option>
                <option value="urgent">Mais Urgentes</option>
                <option value="sla">Prazo SLA</option>
              </select>
            </div>

            {/* CSV Export for Admins & Agents */}
            {isStaff && (
              <button
                type="button"
                onClick={handleExportCSV}
                title="Exportar lista atual de chamados para arquivo CSV (Excel)"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/50'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-xs'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Exportar CSV</span>
                <span className="text-[10px] opacity-80 font-mono">({filteredTickets.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div
            className={`mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
              theme === 'dark' ? 'border-slate-800/80' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Filtros ativos:</span>
              <span className="text-[11px] font-semibold text-emerald-500">
                {filteredTickets.length} chamado(s) encontrado(s)
              </span>
            </div>

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[11px] text-slate-400 hover:text-rose-500 underline cursor-pointer"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Ticket List Stream */}
      {filteredTickets.length === 0 ? (
        <div
          className={`border rounded-2xl p-12 text-center transition-colors ${
            theme === 'dark'
              ? 'bg-slate-900/60 border-slate-800/80'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div
            className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <Filter className="w-6 h-6" />
          </div>
          <h3
            className={`text-base font-bold ${
              theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
            }`}
          >
            {hasActiveFilters ? 'Nenhum chamado corresponde aos filtros' : 'Nenhum chamado registrado'}
          </h3>
          <p
            className={`text-xs max-w-sm mx-auto mt-1 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {hasActiveFilters
              ? 'Tente ajustar os critérios de pesquisa ou limpar os filtros para exibir os chamados.'
              : 'Clique em "Novo Chamado" para abrir o primeiro chamado da central de atendimento.'}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                Limpar Filtros
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenNewTicket}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                Abrir Novo Chamado
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className={`flex items-center justify-between px-1 text-xs font-medium ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <span>Exibindo {filteredTickets.length} de {tickets.length} chamados</span>
            <span className="font-mono text-[11px]">Helpdesk</span>
          </div>

          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => onSelectTicket(ticket)}
              className={`rounded-2xl p-4 sm:p-5 transition-all duration-150 cursor-pointer group relative overflow-hidden border ${
                theme === 'dark'
                  ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-emerald-500/40 shadow-xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-emerald-500/50 shadow-xs hover:shadow-sm'
              }`}
            >
              {/* Left Accent indicator based on priority */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${
                  ticket.priority === 'urgente'
                    ? 'bg-rose-500'
                    : ticket.priority === 'alta'
                    ? 'bg-amber-500'
                    : ticket.priority === 'media'
                    ? 'bg-blue-500'
                    : 'bg-slate-400'
                }`}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {ticket.code}
                  </span>
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                      theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {getCategoryIcon(ticket.category)}
                    {ticket.category}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {formatSlaCountdown(ticket.slaDueDate, ticket.status)}
                  <span
                    className={`text-[11px] font-medium ${
                      theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {formatRelativeTime(ticket.createdAt)}
                  </span>
                </div>
              </div>

              {/* Title & Preview */}
              <h3
                className={`text-sm sm:text-base font-bold transition-colors line-clamp-1 ${
                  theme === 'dark'
                    ? 'text-white group-hover:text-emerald-400'
                    : 'text-slate-900 group-hover:text-emerald-600'
                }`}
              >
                {ticket.title}
              </h3>
              <p
                className={`text-xs line-clamp-2 mt-1 leading-relaxed ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {ticket.description}
              </p>

              {/* Card Footer */}
              <div
                className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
                  theme === 'dark' ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
                }`}
              >
                <div className="flex flex-wrap items-center gap-4">
                  {/* Requester */}
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span
                      className={`font-medium ${
                        theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {ticket.requesterName}
                    </span>
                    <span className="text-slate-500 text-[11px] font-mono">
                      ({ticket.requesterEmail})
                    </span>
                  </div>

                  {/* Department */}
                  <div className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ticket.department}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Assigned Tech */}
                  {ticket.assignedToName ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Resp: {ticket.assignedToName}</span>
                    </div>
                  ) : (
                    <span className="text-slate-500 text-[11px] italic">Não atribuído</span>
                  )}

                  {/* Comments Count */}
                  <div className="flex items-center gap-1 font-semibold text-xs">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ticket.commentsCount}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
