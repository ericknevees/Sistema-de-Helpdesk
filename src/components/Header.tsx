import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  PlusCircle,
  Sun,
  Moon,
  LogOut,
  Sliders,
  ShieldCheck,
  ChevronDown,
  User,
  Shield,
  Laptop,
  Check,
  Building,
  FileText,
  Download,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { HelpdeskNotification, UserProfile } from '../types';
import { NotificationBell } from './NotificationBell';
import { useTheme } from '../context/ThemeContext';
import { AppViewMode } from './Sidebar';

interface HeaderProps {
  currentView: AppViewMode;
  user: UserProfile | null;
  onLogout: () => void;
  onOpenNewTicket: () => void;
  onOpenSettings: () => void;
  onOpenMobileSidebar: () => void;
  notifications: HelpdeskNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAllNotifications: () => void;
  onSelectTicketById: (ticketId: string) => void;
  onPreviewEmail: (notification: HelpdeskNotification) => void;
  allowedDomains: string[];
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  user,
  onLogout,
  onOpenNewTicket,
  onOpenSettings,
  onOpenMobileSidebar,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAllNotifications,
  onSelectTicketById,
  onPreviewEmail,
  allowedDomains,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = (view: AppViewMode) => {
    switch (view) {
      case 'list':
        return {
          title: 'Fila de Chamados',
          subtitle: 'Central unificada de atendimento de solicitações de TI',
        };
      case 'kanban':
        return {
          title: 'Quadro Kanban',
          subtitle: 'Visão em cartões por estágio de atendimento',
        };
      case 'stats':
        return {
          title: 'Métricas & SLA',
          subtitle: 'Painel gerencial de indicadores, tempos e resoluções',
        };
      case 'audit':
        return {
          title: 'Auditoria & Logs',
          subtitle: 'Trilha imutável de eventos e conformidade de governança',
        };
      case 'inventory':
        return {
          title: 'Estoque Tecnológico',
          subtitle: 'Rastreamento de custódia, localização física e controle patrimonial',
        };
    }
  };

  const currentInfo = getPageTitle(currentView);

  return (
    <header
      className={`h-16 border-b sticky top-0 z-20 backdrop-blur-md px-4 sm:px-6 transition-colors duration-150 flex items-center justify-between ${
        theme === 'dark'
          ? 'bg-slate-950/80 border-slate-800 text-slate-100'
          : 'bg-white/90 border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Left: Mobile hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1
              className={`text-base sm:text-lg font-bold tracking-tight leading-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              {currentInfo.title}
            </h1>
          </div>
          <p
            className={`hidden sm:block text-xs truncate max-w-md ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls: Single "Novo Chamado" button, Notifications, User Menu */}
      <div className="flex items-center gap-2.5">
        {user ? (
          <>
            {/* Action Button: Visible on mobile/tablet where sidebar is in drawer */}
            <button
              type="button"
              onClick={onOpenNewTicket}
              className="lg:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Novo</span>
            </button>

            {/* Notification Bell */}
            <NotificationBell
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              onClearAll={onClearAllNotifications}
              onSelectTicketById={onSelectTicketById}
              onPreviewEmail={onPreviewEmail}
            />

            {/* User Dropdown Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className={`flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-850'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 shadow-xs'
                }`}
              >
                {/* User Avatar */}
                <div className="relative shrink-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500/40"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 rounded-full border-slate-900" />
                </div>

                {/* Name & Role (Desktop) */}
                <div className="hidden md:flex flex-col text-left">
                  <span
                    className={`text-xs font-semibold leading-snug truncate max-w-[120px] ${
                      theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {user.name}
                  </span>
                  <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">
                    {user.role === 'admin'
                      ? 'Admin TI'
                      : user.role === 'agent'
                      ? 'Técnico TI'
                      : 'Colaborador'}
                  </span>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Panel */}
              {userMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-72 rounded-2xl border shadow-xl p-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100 ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/80'
                      : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
                  }`}
                >
                  {/* User Profile Card */}
                  <div
                    className={`p-3 rounded-xl border mb-2 transition-colors ${
                      theme === 'dark' ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-emerald-500/30"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold truncate">{user.name}</div>
                        <div className="text-[11px] font-mono text-slate-400 truncate">{user.email}</div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Perfil:</span>
                      <span className="font-semibold text-emerald-500">
                        {user.role === 'admin'
                          ? 'Administrador TI'
                          : user.role === 'agent'
                          ? 'Técnico de TI'
                          : 'Colaborador'}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Departamento:</span>
                      <span className="truncate max-w-[140px] text-slate-300">
                        {user.department || 'Geral'}
                      </span>
                    </div>
                  </div>

                  {/* Theme Switcher in User Menu */}
                  <div className="px-2 py-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-2">
                      {theme === 'dark' ? <Moon className="w-4 h-4 text-emerald-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                      Tema da Interface
                    </span>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
                        theme === 'dark'
                          ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                          : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                    </button>
                  </div>

                  {/* Admin Settings Option */}
                  {user.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenSettings();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        theme === 'dark'
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Sliders className="w-4 h-4 text-slate-400" />
                      <span>Configurações do Helpdesk</span>
                    </button>
                  )}

                  {/* Sign Out Action */}
                  <div className="pt-1 mt-1 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Desconectar da Conta</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Building className="w-4 h-4 text-emerald-500" />
            <span>Helpdesk</span>
          </div>
        )}
      </div>
    </header>
  );
};
