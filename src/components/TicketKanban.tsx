import React, { useState } from 'react';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  UserProfile,
} from '../types';
import {
  MessageSquare,
  Paperclip,
  Clock,
  MoreVertical,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ClockAlert,
  ArrowRight,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface TicketKanbanProps {
  tickets: Ticket[];
  currentUser: UserProfile;
  onSelectTicket: (ticket: Ticket) => void;
  onUpdateStatus: (ticketId: string, newStatus: TicketStatus) => void;
}

interface ColumnDef {
  id: TicketStatus;
  label: string;
  badgeBg: string;
  dotColor: string;
}

const KANBAN_COLUMNS: ColumnDef[] = [
  {
    id: 'novo',
    label: 'Novo / Triagem',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 'em_atendimento',
    label: 'Em atendimento',
    badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    dotColor: 'bg-blue-500',
  },
  {
    id: 'aguardando_usuario',
    label: 'Aguardando usuário',
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'resolvido',
    label: 'Resolvido',
    badgeBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    dotColor: 'bg-teal-500',
  },
  {
    id: 'fechado',
    label: 'Fechado',
    badgeBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    dotColor: 'bg-slate-400',
  },
];

export const TicketKanban: React.FC<TicketKanbanProps> = ({
  tickets,
  currentUser,
  onSelectTicket,
  onUpdateStatus,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isStaff = currentUser.role === 'admin' || currentUser.role === 'agent';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [onlyMineFilter, setOnlyMineFilter] = useState(false);

  // Drag and drop state
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<TicketStatus | null>(null);

  // Card menu dropdown state
  const [activeMenuTicketId, setActiveMenuTicketId] = useState<string | null>(null);

  // Filtered tickets
  const filteredTickets = tickets.filter((ticket) => {
    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        ticket.code.toLowerCase().includes(q) ||
        ticket.title.toLowerCase().includes(q) ||
        ticket.requesterName.toLowerCase().includes(q) ||
        ticket.department.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Priority
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) {
      return false;
    }

    // Only mine
    if (onlyMineFilter) {
      const isMine =
        ticket.requesterEmail.toLowerCase() === currentUser.email.toLowerCase() ||
        ticket.assignedToEmail?.toLowerCase() === currentUser.email.toLowerCase();
      if (!isMine) return false;
    }

    return true;
  });

  // Drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ticketId: string) => {
    if (!isStaff) return;
    setDraggedTicketId(ticketId);
    e.dataTransfer.setData('text/plain', ticketId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTicketId(null);
    setActiveDropColumn(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: TicketStatus) => {
    if (!isStaff) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropColumn !== columnId) {
      setActiveDropColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, columnId: TicketStatus) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (activeDropColumn === columnId) {
      setActiveDropColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: TicketStatus) => {
    e.preventDefault();
    setActiveDropColumn(null);
    const ticketId = e.dataTransfer.getData('text/plain') || draggedTicketId;
    if (ticketId) {
      const targetTicket = tickets.find((t) => t.id === ticketId);
      if (targetTicket && targetTicket.status !== targetStatus) {
        onUpdateStatus(ticketId, targetStatus);
      }
    }
    setDraggedTicketId(null);
  };

  // Helper for SLA badge in card
  const renderSlaIndicator = (ticket: Ticket) => {
    const isResolved = ticket.status === 'resolvido' || ticket.status === 'fechado';
    if (isResolved) {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
            isDark ? 'text-teal-400 bg-teal-500/10' : 'text-teal-700 bg-teal-50'
          }`}
          title="Atendimento concluído"
        >
          <CheckCircle2 className="w-3 h-3 text-teal-500" />
          <span>Concluído</span>
        </span>
      );
    }

    const now = new Date();
    const due = new Date(ticket.slaDueDate);
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
            isDark ? 'text-rose-400 bg-rose-500/15' : 'text-rose-700 bg-rose-50'
          }`}
          title="SLA Estourado"
        >
          <ClockAlert className="w-3 h-3 text-rose-500" />
          <span>SLA Estourado</span>
        </span>
      );
    }

    if (diffHours <= 4) {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
            isDark ? 'text-amber-400 bg-amber-500/15' : 'text-amber-700 bg-amber-50'
          }`}
          title={`Expira em ${Math.ceil(diffHours)}h`}
        >
          <Clock className="w-3 h-3 text-amber-500" />
          <span>{Math.ceil(diffHours)}h restantes</span>
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
          isDark ? 'text-slate-400 bg-slate-800' : 'text-slate-600 bg-slate-100'
        }`}
        title={`Prazo: ${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
      >
        <Clock className="w-3 h-3 text-slate-400" />
        <span>{Math.ceil(diffHours)}h</span>
      </span>
    );
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgente':
        return (
          <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 border border-rose-500/20">
            Urgente
          </span>
        );
      case 'alta':
        return (
          <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/20">
            Alta
          </span>
        );
      case 'media':
        return (
          <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500 border border-blue-500/20">
            Média
          </span>
        );
      default:
        return (
          <span className={`text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded ${
            isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
          }`}>
            Baixa
          </span>
        );
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Top Filter and Search Bar (MS Project / Planner style) */}
      <div
        className={`w-full rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Left: Search Bar */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por código, título ou solicitante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border transition-colors outline-none focus:ring-1 focus:ring-emerald-500 ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Right: Quick Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-xl border transition-colors outline-none cursor-pointer ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">Todas as prioridades</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>

          {/* Toggle only mine */}
          <button
            type="button"
            onClick={() => setOnlyMineFilter((prev) => !prev)}
            className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
              onlyMineFilter
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                : isDark
                ? 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {onlyMineFilter ? '✓ Meus chamados' : 'Meus chamados'}
          </button>

          {/* Summary counters */}
          <div
            className={`hidden sm:flex items-center gap-2 pl-3 border-l text-xs font-mono ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}
          >
            <span>{filteredTickets.length} de {tickets.length} chamados</span>
          </div>
        </div>
      </div>

      {/* Kanban Board Container (Full-width responsive grid/flex) */}
      <div className="w-full overflow-x-auto pb-4 scroll-smooth">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 min-w-[1100px] lg:min-w-0">
          {KANBAN_COLUMNS.map((col) => {
            const columnTickets = filteredTickets.filter((t) => t.status === col.id);
            const isDropActive = activeDropColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex flex-col rounded-2xl border transition-all duration-150 min-h-[500px] ${
                  isDropActive
                    ? isDark
                      ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                      : 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/30'
                    : isDark
                    ? 'border-slate-800/80 bg-slate-900/40'
                    : 'border-slate-200/90 bg-slate-100/60'
                }`}
              >
                {/* Discrete Microsoft Planner Header */}
                <div
                  className={`px-3.5 py-2.5 border-b flex items-center justify-between select-none ${
                    isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white/80'
                  } rounded-t-2xl`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${col.dotColor}`} />
                    <h3
                      className={`text-xs font-bold tracking-tight truncate ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {col.label}
                    </h3>
                  </div>

                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${col.badgeBg}`}
                  >
                    {columnTickets.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="flex-1 p-2 space-y-2.5 overflow-y-auto max-h-[calc(100vh-250px)]">
                  {columnTickets.length === 0 ? (
                    <div
                      className={`h-28 flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-center p-3 transition-colors ${
                        isDropActive
                          ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-500'
                          : isDark
                          ? 'border-slate-800/80 text-slate-600'
                          : 'border-slate-300 text-slate-400'
                      }`}
                    >
                      <span className="text-xs">
                        {isDropActive ? 'Solte para mover aqui' : 'Nenhum chamado'}
                      </span>
                    </div>
                  ) : (
                    columnTickets.map((ticket) => {
                      const isDragging = draggedTicketId === ticket.id;
                      const isMenuOpen = activeMenuTicketId === ticket.id;

                      return (
                        <div
                          key={ticket.id}
                          draggable={isStaff}
                          onDragStart={(e) => handleDragStart(e, ticket.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => onSelectTicket(ticket)}
                          className={`relative group rounded-xl border p-3.5 transition-all duration-150 cursor-pointer ${
                            isDragging
                              ? 'opacity-40 scale-95 border-emerald-500 border-dashed'
                              : isDark
                              ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-slate-700 shadow-sm'
                              : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
                          }`}
                        >
                          {/* Top Row: Code + Priority + Menu */}
                          <div className="flex items-center justify-between gap-1.5 mb-2">
                            <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {ticket.code}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {getPriorityBadge(ticket.priority)}

                              {/* 3-Dots Quick Action Menu */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuTicketId(isMenuOpen ? null : ticket.id);
                                  }}
                                  className={`p-1 rounded-md transition-colors cursor-pointer opacity-70 group-hover:opacity-100 ${
                                    isDark
                                      ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                                      : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                                  }`}
                                  title="Ações rápidas"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {/* Dropdown Menu */}
                                {isMenuOpen && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className={`absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-lg py-1 z-30 ${
                                      isDark
                                        ? 'bg-slate-900 border-slate-700 text-slate-200'
                                        : 'bg-white border-slate-200 text-slate-800'
                                    }`}
                                  >
                                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                      Mover para
                                    </div>
                                    {KANBAN_COLUMNS.map((destination) => (
                                      <button
                                        key={destination.id}
                                        type="button"
                                        disabled={destination.id === ticket.status}
                                        onClick={() => {
                                          onUpdateStatus(ticket.id, destination.id);
                                          setActiveMenuTicketId(null);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                          isDark
                                            ? 'hover:bg-slate-800'
                                            : 'hover:bg-slate-100'
                                        }`}
                                      >
                                        <span>{destination.label}</span>
                                        {destination.id === ticket.status && (
                                          <span className="text-[10px] text-emerald-500 font-bold">Atual</span>
                                        )}
                                      </button>
                                    ))}
                                    <div className="border-t my-1 border-slate-700/50" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onSelectTicket(ticket);
                                        setActiveMenuTicketId(null);
                                      }}
                                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
                                        isDark ? 'hover:bg-slate-800 text-emerald-400' : 'hover:bg-slate-100 text-emerald-600'
                                      }`}
                                    >
                                      <span>Ver detalhes</span>
                                      <ArrowRight className="w-3 h-3 ml-auto" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Card Title (MS Project style clean readability) */}
                          <h4
                            className={`text-xs font-semibold leading-snug line-clamp-2 transition-colors ${
                              isDark
                                ? 'text-slate-100 group-hover:text-emerald-300'
                                : 'text-slate-900 group-hover:text-emerald-700'
                            }`}
                          >
                            {ticket.title}
                          </h4>

                          {/* Requester & Department info */}
                          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between gap-2">
                            <span className="truncate" title={ticket.requesterName}>
                              {ticket.requesterName}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded truncate max-w-[90px] ${
                                isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                              }`}
                              title={ticket.department}
                            >
                              {ticket.department}
                            </span>
                          </div>

                          {/* SLA indicator */}
                          <div className="mt-2.5 pt-2 border-t border-slate-800/40 dark:border-slate-800 flex items-center justify-between">
                            {renderSlaIndicator(ticket)}

                            {/* Assignee pill / avatar */}
                            {ticket.assignedToName ? (
                              <div
                                className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                                title={`Atribuído a: ${ticket.assignedToName}`}
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[85px]">
                                  {ticket.assignedToName.split(' ')[0]}
                                </span>
                              </div>
                            ) : (
                              <div
                                className="flex items-center gap-1 text-[11px] text-slate-400 italic"
                                title="Chamado não atribuído"
                              >
                                <UserX className="w-3 h-3 text-slate-400" />
                                <span>Não atribuído</span>
                              </div>
                            )}
                          </div>

                          {/* Card Footer: Comments & Attachments count */}
                          <div
                            className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[11px] ${
                              isDark ? 'border-slate-800/50 text-slate-500' : 'border-slate-100 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-slate-400" />
                                <span>{ticket.commentsCount || 0}</span>
                              </span>

                              {ticket.attachments && ticket.attachments.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Paperclip className="w-3 h-3 text-slate-400" />
                                  <span>{ticket.attachments.length}</span>
                                </span>
                              )}
                            </div>

                            {/* Drag hint on hover */}
                            {isStaff && (
                              <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-80 transition-opacity">
                                Arraste para mover
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
