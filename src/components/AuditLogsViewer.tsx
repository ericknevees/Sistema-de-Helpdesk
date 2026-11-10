import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
} from 'lucide-react';
import { AuditLogEntry, UserProfile } from '../types';
import { subscribeToAuditLogs } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';

interface AuditLogsViewerProps {
  currentUser: UserProfile;
}

export const AuditLogsViewer: React.FC<AuditLogsViewerProps> = ({ currentUser: _currentUser }) => {
  const { theme } = useTheme();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuditLogs((entries: AuditLogEntry[]) => {
      setLogs(entries);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'ticket_created':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Abertura de Chamado
          </span>
        );
      case 'status_changed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Transição de Status
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            Atribuição de Técnico
          </span>
        );
      case 'priority_changed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Alteração de Prioridade
          </span>
        );
      case 'comment_added':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            Mensagem / Nota
          </span>
        );
      case 'role_assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            Perfil de TI Atribuído
          </span>
        );
      case 'config_updated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            Configuração Atualizada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-400">
            {action}
          </span>
        );
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCode = log.ticketCode?.toLowerCase().includes(q);
      const matchActor =
        log.performedByEmail.toLowerCase().includes(q) ||
        log.performedByName.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      if (!matchCode && !matchActor && !matchDetails) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div
        className={`p-4 rounded-2xl border transition-colors ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Trilha de Auditoria & Governança (LGPD / ISO)
              </h3>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Registro imutável em nuvem de transições de status, acessos e ações da equipe
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por código ou usuário..."
                className={`pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">Todas as Ações</option>
              <option value="ticket_created">Abertura de Chamado</option>
              <option value="status_changed">Transição de Status</option>
              <option value="assigned">Atribuição de Técnico</option>
              <option value="priority_changed">Alteração de Prioridade</option>
              <option value="comment_added">Mensagens / Notas</option>
              <option value="role_assigned">Perfis de TI</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div
        className={`rounded-2xl border overflow-hidden transition-colors ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Carregando trilha de auditoria em nuvem...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Nenhum evento registrado com os filtros informados.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`uppercase tracking-wider font-bold text-[10px] ${
                  theme === 'dark' ? 'bg-slate-950/70 text-slate-400' : 'bg-slate-50 text-slate-500'
                }`}
              >
                <tr>
                  <th className="px-4 py-3">Data / Hora</th>
                  <th className="px-4 py-3">Chamado</th>
                  <th className="px-4 py-3">Ação</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Detalhes da Transição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`transition-colors ${
                      theme === 'dark' ? 'hover:bg-slate-850/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-500 whitespace-nowrap">
                      {log.ticketCode || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{getActionBadge(log.action)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{log.performedByName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{log.performedByEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <div>{log.details}</div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {JSON.stringify(log.metadata)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
