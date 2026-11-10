import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Lock,
  Send,
  User,
  Building,
  Clock,
  Shield,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Paperclip,
  FileText,
  Download,
} from 'lucide-react';
import {
  Ticket,
  TicketComment,
  TicketPriority,
  TicketStatus,
  UserProfile,
} from '../types';
import { useTheme } from '../context/ThemeContext';
import { formatBytes } from '../lib/utils';

interface TicketDetailModalProps {
  ticket: Ticket;
  comments: TicketComment[];
  currentUser: UserProfile;
  onClose: () => void;
  onAddComment: (content: string, isInternal: boolean) => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus) => void;
  onUpdatePriority: (ticketId: string, priority: TicketPriority) => void;
  onAssignToMe: (ticketId: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  comments,
  currentUser,
  onClose,
  onAddComment,
  onUpdateStatus,
  onUpdatePriority,
  onAssignToMe,
}) => {
  const { theme } = useTheme();
  const [commentText, setCommentText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const isStaff = currentUser.role === 'admin' || currentUser.role === 'agent';

  // Visible comments: if collaborator, filter out internal notes
  const visibleComments = comments.filter((c) => {
    if (!c.isInternalNote) return true;
    return isStaff;
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(commentText.trim(), isStaff ? isInternalNote : false);
    setCommentText('');
  };

  const handleAssignClick = async () => {
    setAssigning(true);
    try {
      await onAssignToMe(ticket.id);
    } finally {
      setAssigning(false);
    }
  };

  const insertQuickReply = (text: string) => {
    setCommentText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div
        className={`border rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150 transition-colors ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-start justify-between gap-4 transition-colors ${
            theme === 'dark'
              ? 'border-slate-800 bg-slate-950/50'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                {ticket.code}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  theme === 'dark' ? 'text-slate-400 bg-slate-800' : 'text-slate-600 bg-slate-200'
                }`}
              >
                {ticket.category}
              </span>
              <span
                className={`text-xs flex items-center gap-1 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-slate-500" />
                {ticket.department}
              </span>
            </div>
            <h2
              className={`text-lg sm:text-xl font-bold leading-snug ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              {ticket.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
              theme === 'dark'
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div
          className={`flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x ${
            theme === 'dark' ? 'divide-slate-800' : 'divide-slate-200'
          }`}
        >
          {/* Main Column */}
          <div className="lg:col-span-2 p-5 sm:p-6 space-y-6">
            {/* Description Card */}
            <div
              className={`border rounded-xl p-4 ${
                theme === 'dark'
                  ? 'bg-slate-950/60 border-slate-800/80 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <h4
                className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Descrição da Solicitação
              </h4>
              <p className="text-sm leading-relaxed whitespace-pre-line font-normal">
                {ticket.description}
              </p>

              {ticket.workstationLocation && (
                <div
                  className={`mt-4 pt-3 border-t flex items-center gap-2 text-xs ${
                    theme === 'dark'
                      ? 'border-slate-800/80 text-slate-400'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    Estação / Local:{' '}
                    <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>
                      {ticket.workstationLocation}
                    </strong>
                  </span>
                </div>
              )}

              {/* Attachments if any */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Arquivos Anexados ({ticket.attachments.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {ticket.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-slate-900 border-slate-700 hover:border-emerald-500 text-slate-200'
                            : 'bg-white border-slate-300 hover:border-emerald-500 text-slate-800'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="truncate max-w-[140px]">{att.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatBytes(att.size)}
                        </span>
                        <Download className="w-3 h-3 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Conversation Timeline */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4
                  className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  Histórico de Atendimento ({visibleComments.length})
                </h4>
                {isStaff && (
                  <span className="text-[11px] text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
                    <Lock className="w-3 h-3" />
                    Modo Técnico TI
                  </span>
                )}
              </div>

              {visibleComments.length === 0 ? (
                <div
                  className={`p-6 text-center border border-dashed rounded-xl text-xs ${
                    theme === 'dark'
                      ? 'border-slate-800 text-slate-400'
                      : 'border-slate-300 text-slate-500 bg-slate-50'
                  }`}
                >
                  Nenhuma mensagem registrada até o momento. Utilize a caixa abaixo para responder.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {visibleComments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-4 rounded-xl border transition-all ${
                        comment.isInternalNote
                          ? theme === 'dark'
                            ? 'bg-amber-950/20 border-amber-500/30'
                            : 'bg-amber-50/80 border-amber-200'
                          : theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-1 ${
                              theme === 'dark'
                                ? 'bg-slate-800 text-slate-200 ring-slate-700'
                                : 'bg-slate-200 text-slate-800 ring-slate-300'
                            }`}
                          >
                            {comment.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold ${
                                  theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
                                }`}
                              >
                                {comment.authorName}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                  comment.authorRole === 'admin'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : comment.authorRole === 'agent'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : theme === 'dark'
                                    ? 'bg-slate-800 text-slate-400'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {comment.authorRole === 'admin'
                                  ? 'Admin TI'
                                  : comment.authorRole === 'agent'
                                  ? 'Técnico'
                                  : 'Solicitante'}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-mono ${
                                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            >
                              {comment.authorEmail}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {comment.isInternalNote && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-500 border border-amber-500/30">
                              <Lock className="w-2.5 h-2.5" />
                              Nota Interna Confidencial
                            </span>
                          )}
                          <span
                            className={`text-[11px] ${
                              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {new Date(comment.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <p
                        className={`text-xs sm:text-sm whitespace-pre-line leading-relaxed pl-9 ${
                          theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                        }`}
                      >
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Box */}
              <form onSubmit={handleSubmitComment} className="mt-5 space-y-3">
                {isStaff && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      className={`flex items-center gap-2 text-xs cursor-pointer px-2.5 py-1.5 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-slate-950 border-slate-800 text-slate-300'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="flex items-center gap-1 font-medium text-amber-500">
                        <Lock className="w-3 h-3" />
                        Nota Interna (visível somente para a equipe de TI)
                      </span>
                    </label>

                    <div
                      className={`flex items-center gap-1 text-[11px] ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      <span>Respostas rápidas:</span>
                      <button
                        type="button"
                        onClick={() =>
                          insertQuickReply(
                            'Recebemos sua solicitação e já estamos analisando o acesso no servidor principal.'
                          )
                        }
                        className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                      >
                        Em análise
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertQuickReply(
                            'Configuração realizada com sucesso. Por favor, reinicie a aplicação e confirme se o comportamento normalizou.'
                          )
                        }
                        className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                      >
                        Concluído
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={
                      isInternalNote
                        ? 'Escreva uma anotação técnica confidencial da equipe de TI...'
                        : 'Escreva uma resposta para o solicitante...'
                    }
                    className={`w-full p-3 rounded-xl border text-sm transition-all focus:outline-none ${
                      theme === 'dark'
                        ? 'bg-slate-950 text-slate-100 placeholder-slate-500 ' +
                          (isInternalNote
                            ? 'border-amber-500/40 focus:ring-2 focus:ring-amber-500/30'
                            : 'border-slate-800 focus:ring-2 focus:ring-emerald-500/30')
                        : 'bg-white text-slate-900 placeholder-slate-400 ' +
                          (isInternalNote
                            ? 'border-amber-400 focus:ring-2 focus:ring-amber-400/30'
                            : 'border-slate-300 focus:ring-2 focus:ring-emerald-500/30')
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className={`absolute bottom-3 right-3 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                      isInternalNote
                        ? 'bg-amber-600 hover:bg-amber-500'
                        : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar Column */}
          <div
            className={`p-5 sm:p-6 space-y-6 ${
              theme === 'dark' ? 'bg-slate-950/30' : 'bg-slate-50/70'
            }`}
          >
            {/* Status Control */}
            <div className="space-y-2">
              <label
                className={`text-xs font-bold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Status do Chamado
              </label>
              {isStaff ? (
                <select
                  value={ticket.status}
                  onChange={(e) => onUpdateStatus(ticket.id, e.target.value as TicketStatus)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-700 text-slate-200'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="novo">Novo / Não Iniciado</option>
                  <option value="em_atendimento">Em Atendimento</option>
                  <option value="aguardando_usuario">Aguardando Usuário</option>
                  <option value="resolvido">Resolvido</option>
                  <option value="fechado">Fechado</option>
                </select>
              ) : (
                <div
                  className={`p-2.5 rounded-xl border text-sm font-semibold uppercase ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  {ticket.status.replace('_', ' ').toUpperCase()}
                </div>
              )}
            </div>

            {/* Priority Control */}
            <div className="space-y-2">
              <label
                className={`text-xs font-bold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Prioridade
              </label>
              {isStaff ? (
                <select
                  value={ticket.priority}
                  onChange={(e) => onUpdatePriority(ticket.id, e.target.value as TicketPriority)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-700 text-slate-200'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente (Crítico)</option>
                </select>
              ) : (
                <div
                  className={`p-2.5 rounded-xl border text-sm font-semibold uppercase ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  {ticket.priority}
                </div>
              )}
            </div>

            {/* Assigned Tech Card */}
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                theme === 'dark'
                  ? 'bg-slate-900/80 border-slate-800'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <span
                className={`text-xs font-bold uppercase tracking-wider block ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Técnico Responsável
              </span>
              {ticket.assignedToName ? (
                <div>
                  <div className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                    {ticket.assignedToName}
                  </div>
                  <div className={`text-xs font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {ticket.assignedToEmail}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-500 italic">Nenhum responsável atribuído</div>
              )}

              {isStaff && ticket.assignedToEmail !== currentUser.email && (
                <button
                  type="button"
                  disabled={assigning}
                  onClick={handleAssignClick}
                  className={`w-full mt-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                  }`}
                >
                  {assigning ? 'Atribuindo...' : 'Assumir Atendimento (Atômico)'}
                </button>
              )}
            </div>

            {/* Requester Info */}
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                theme === 'dark'
                  ? 'bg-slate-900/80 border-slate-800'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <span
                className={`text-xs font-bold uppercase tracking-wider block ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Solicitante Corporativo
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    theme === 'dark'
                      ? 'bg-slate-800 text-slate-200'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {ticket.requesterName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                    {ticket.requesterName}
                  </div>
                  <div className={`text-xs font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {ticket.requesterEmail}
                  </div>
                </div>
              </div>
              <div
                className={`text-xs pt-2 border-t ${
                  theme === 'dark' ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-600'
                }`}
              >
                Departamento:{' '}
                <strong className={theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}>
                  {ticket.department}
                </strong>
              </div>
            </div>

            {/* SLA Metrics */}
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                theme === 'dark'
                  ? 'bg-slate-900/80 border-slate-800'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <span
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                Compromisso de SLA
              </span>
              <div className={`text-xs space-y-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Aberto em:</span>
                  <span>{new Date(ticket.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                {ticket.firstResponseAt && (
                  <div className="flex justify-between text-blue-400">
                    <span>1º Atendimento:</span>
                    <span>{new Date(ticket.firstResponseAt).toLocaleTimeString('pt-BR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Prazo limite:</span>
                  <span className="font-semibold text-emerald-500">
                    {new Date(ticket.slaDueDate).toLocaleString('pt-BR')}
                  </span>
                </div>
                {ticket.resolvedAt && (
                  <div className="flex justify-between text-emerald-500 font-semibold">
                    <span>Resolvido em:</span>
                    <span>{new Date(ticket.resolvedAt).toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
