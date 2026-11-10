import React from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  Layers,
  Award,
  Users,
  Timer,
} from 'lucide-react';
import { Ticket } from '../types';
import { useTheme } from '../context/ThemeContext';

interface DashboardStatsProps {
  tickets: Ticket[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ tickets }) => {
  const { theme } = useTheme();
  const total = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'novo' || t.status === 'em_atendimento').length;
  const waitingUserCount = tickets.filter((t) => t.status === 'aguardando_usuario').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolvido' || t.status === 'fechado').length;
  const urgentCount = tickets.filter((t) => t.priority === 'urgente' && t.status !== 'fechado').length;

  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  // Real first response SLA calculation
  const ticketsWithFirstResponse = tickets.filter((t) => t.firstResponseAt);
  let averageFirstResponseDisplay = '—';
  if (ticketsWithFirstResponse.length > 0) {
    const totalMinutes = ticketsWithFirstResponse.reduce((sum, t) => {
      const diffMs = new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime();
      return sum + Math.max(0, diffMs / (1000 * 60));
    }, 0);
    const avgMinutes = Math.round(totalMinutes / ticketsWithFirstResponse.length);
    if (avgMinutes < 60) {
      averageFirstResponseDisplay = `${avgMinutes}m`;
    } else {
      averageFirstResponseDisplay = `${(avgMinutes / 60).toFixed(1)}h`;
    }
  } else if (total > 0) {
    averageFirstResponseDisplay = 'Em triagem';
  }

  // Real On-Time SLA Compliance Calculation
  const onTimeCount = tickets.filter((t) => {
    if (!t.slaDueDate) return true;
    const dueTime = new Date(t.slaDueDate).getTime();
    if (t.resolvedAt) {
      return new Date(t.resolvedAt).getTime() <= dueTime;
    }
    return Date.now() <= dueTime;
  }).length;

  const onTimeSlaRate = total > 0 ? Math.round((onTimeCount / total) * 100) : 100;

  // Breakdown by department
  const byDepartment = tickets.reduce((acc, t) => {
    acc[t.department] = (acc[t.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Breakdown by category
  const byCategory = tickets.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cardBg =
    theme === 'dark'
      ? 'bg-slate-900 border-slate-800 text-white'
      : 'bg-white border-slate-200 shadow-xs text-slate-900';
  const labelMuted = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const trackBg = theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100';

  return (
    <div className="space-y-6">
      {/* Top Headline Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden transition-colors ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${labelMuted}`}>
              Total de Chamados
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">{total}</span>
            <span className={`text-xs ${labelMuted}`}>registrados</span>
          </div>
          <div className={`mt-2 text-xs ${labelMuted}`}>
            {openCount} em atendimento ativo {waitingUserCount > 0 ? `• ${waitingUserCount} aguardando usuário` : ''}
          </div>
        </div>

        {/* Resolution Rate */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden transition-colors ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${labelMuted}`}>
              Taxa de Resolução
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-500 tracking-tight">
              {resolutionRate}%
            </span>
            <span className={`text-xs ${labelMuted}`}>{resolvedCount} concluídos</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Meta corporativa: {'>'}90%
          </div>
        </div>

        {/* Average SLA / First Response */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden transition-colors ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${labelMuted}`}>
              1ª Resposta / SLA
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">{averageFirstResponseDisplay}</span>
            <span className={`text-xs ${labelMuted}`}>média real</span>
          </div>
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
            {onTimeSlaRate}% dentro do prazo de SLA
          </div>
        </div>

        {/* Critical / Urgent */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden transition-colors ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${labelMuted}`}>
              Críticos / Urgentes
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-500 tracking-tight">
              {urgentCount}
            </span>
            <span className={`text-xs ${labelMuted}`}>em aberto</span>
          </div>
          <div className={`mt-2 text-xs ${labelMuted}`}>
            Fila prioritária para despacho
          </div>
        </div>
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Department */}
        <div className={`p-6 rounded-2xl border transition-colors ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
              <Building className="w-4 h-4 text-emerald-500" />
              Demandas por Departamento
            </h3>
            <span className={`text-xs ${labelMuted}`}>Distribuição interna</span>
          </div>

          <div className="space-y-3">
            {Object.entries(byDepartment).length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">Sem dados registrados</div>
            ) : (
              Object.entries(byDepartment).map(([dept, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{dept}</span>
                      <span className={`font-mono ${labelMuted}`}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${trackBg}`}>
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* By Category */}
        <div className={`p-6 rounded-2xl border transition-colors ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
              <Layers className="w-4 h-4 text-emerald-500" />
              Demandas por Categoria Técnica
            </h3>
            <span className={`text-xs ${labelMuted}`}>Tipos de incidente</span>
          </div>

          <div className="space-y-3">
            {Object.entries(byCategory).length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">Sem dados registrados</div>
            ) : (
              Object.entries(byCategory).map(([cat, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{cat}</span>
                      <span className={`font-mono ${labelMuted}`}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${trackBg}`}>
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
