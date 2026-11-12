import React from 'react';
import {
  List,
  Kanban,
  LayoutDashboard,
  ShieldAlert,
  Sliders,
  ChevronLeft,
  ChevronRight,
  X,
  PlusCircle,
  Building2,
  Boxes,
  BookOpen,
} from 'lucide-react';
import { EmbragLogo } from './EmbragLogo';
import { UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';

export type AppViewMode = 'list' | 'kanban' | 'stats' | 'audit' | 'inventory';

interface SidebarProps {
  currentView: AppViewMode;
  onViewChange: (view: AppViewMode) => void;
  currentUser: UserProfile | null;
  onOpenNewTicket: () => void;
  onOpenSettings: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  openTicketsCount: number;
  onOpenManual?: (mode?: 'user' | 'admin') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  currentUser,
  onOpenNewTicket,
  onOpenSettings,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  openTicketsCount,
  onOpenManual,
}) => {
  const { theme } = useTheme();
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'agent';
  const isAdmin = currentUser?.role === 'admin';

  const navItems: {
    id: AppViewMode;
    label: string;
    icon: React.ElementType;
    badge?: number;
    requiredStaff?: boolean;
    requiredAdmin?: boolean;
  }[] = [
    {
      id: 'list',
      label: 'Chamados',
      icon: List,
      badge: openTicketsCount > 0 ? openTicketsCount : undefined,
    },
    {
      id: 'kanban',
      label: 'Quadro Kanban',
      icon: Kanban,
    },
    {
      id: 'stats',
      label: 'Métricas & SLA',
      icon: LayoutDashboard,
    },
    {
      id: 'audit',
      label: 'Auditoria & Logs',
      icon: ShieldAlert,
      requiredStaff: true,
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (item.requiredAdmin && !isAdmin) return false;
    if (item.requiredStaff && !isStaff) return false;
    return true;
  });

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header with Enlarged Logo directly on sidebar background */}
      <div
        className={`px-4 py-4 flex items-center justify-between border-b transition-colors ${
          theme === 'dark' ? 'border-slate-800/80' : 'border-slate-200'
        } ${collapsed ? 'h-20 justify-center' : 'min-h-[5.5rem]'}`}
      >
        <div className="flex flex-col items-start overflow-hidden">
          <EmbragLogo
            theme={theme}
            size={collapsed ? 'icon' : 'sidebar'}
            showProductBadge={!collapsed}
          />
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          title="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Action Button (Single, prominent in sidebar) */}
      {currentUser && (
        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              onOpenNewTicket();
              if (mobileOpen) onCloseMobile();
            }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs text-white transition-all shadow-sm cursor-pointer ${
              collapsed
                ? 'px-2 bg-emerald-600 hover:bg-emerald-500'
                : 'px-4 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20 active:scale-[0.98]'
            }`}
            title="Abrir novo chamado"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Novo Chamado</span>}
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onViewChange(item.id);
                  if (mobileOpen) onCloseMobile();
                }}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-emerald-500'
                      : theme === 'dark'
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                />
                {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-emerald-500 text-white'
                        : theme === 'dark'
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Admin Section Divider */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-slate-800/60 dark:border-slate-800">
            {!collapsed && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Administração
              </span>
            )}

            {/* Estoque Tecnológico */}
            <button
              type="button"
              onClick={() => {
                onViewChange('inventory');
                if (mobileOpen) onCloseMobile();
              }}
              title={collapsed ? 'Estoque Tecnológico' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer mb-1 ${
                currentView === 'inventory'
                  ? theme === 'dark'
                    ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Boxes
                className={`w-4 h-4 shrink-0 ${
                  currentView === 'inventory'
                    ? 'text-emerald-500'
                    : theme === 'dark'
                    ? 'text-slate-400'
                    : 'text-slate-500'
                }`}
              />
              {!collapsed && (
                <span className="truncate flex-1 text-left">Estoque Tecnológico</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenSettings();
                if (mobileOpen) onCloseMobile();
              }}
              title={collapsed ? 'Configurações' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0 text-slate-400" />
              {!collapsed && (
                <span className="truncate flex-1 text-left">Configurações TI</span>
              )}
            </button>
          </div>
        )}

        {/* Manual de Instruções (Acesso Exclusivo no Menu Lateral) */}
        <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800/60">
          <button
            type="button"
            onClick={() => {
              if (onOpenManual) onOpenManual(isAdmin ? 'admin' : 'user');
              if (mobileOpen) onCloseMobile();
            }}
            title={collapsed ? (isAdmin ? 'Manual TI & Usuário' : 'Manual do Usuário') : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              theme === 'dark'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 shadow-xs'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {!collapsed && (
              <span className="truncate flex-1 text-left font-semibold">
                {isAdmin ? 'Manual do Sistema' : 'Manual do Usuário'}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Sidebar Footer with Collapse Toggle */}
      <div
        className={`p-3 border-t flex items-center transition-colors ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
        } ${collapsed ? 'justify-center' : 'justify-between'}`}
      >
        {!collapsed && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
            <Building2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">Helpdesk • Embrag</span>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className={`hidden lg:flex p-1.5 rounded-lg transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
          }`}
          title={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r transition-all duration-200 shrink-0 select-none ${
          collapsed ? 'w-18' : 'w-64'
        } ${
          theme === 'dark'
            ? 'bg-slate-950/90 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside
            className={`relative w-72 max-w-[85vw] h-full flex flex-col shadow-2xl z-10 transition-colors ${
              theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
            }`}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
