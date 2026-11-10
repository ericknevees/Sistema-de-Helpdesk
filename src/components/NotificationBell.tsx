import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Mail,
  CheckCheck,
  Trash2,
  ExternalLink,
  PlusCircle,
  Clock,
  UserCheck,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { HelpdeskNotification, NotificationType } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NotificationBellProps {
  notifications: HelpdeskNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectTicketById: (ticketId: string) => void;
  onPreviewEmail: (notification: HelpdeskNotification) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectTicketById,
  onPreviewEmail,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'created':
        return <PlusCircle className="w-4 h-4 text-indigo-500" />;
      case 'status_updated':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'assigned':
        return <UserCheck className="w-4 h-4 text-purple-500" />;
      case 'new_comment':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return new Date(isoString).toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Central de Notificações e Alertas"
        className={`relative p-2 rounded-lg border transition-all cursor-pointer ${
          isOpen
            ? theme === 'dark'
              ? 'bg-slate-800 text-white border-emerald-500/50'
              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
            : theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200 text-slate-900 shadow-xl'
          }`}
        >
          {/* Dropdown Header */}
          <div
            className={`p-3.5 border-b flex items-center justify-between ${
              theme === 'dark'
                ? 'border-slate-800 bg-slate-950/80'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}
              >
                Notificações & Alertas
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {unreadCount} nova(s)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  title="Marcar todas como lidas"
                  className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lidas</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  title="Limpar histórico"
                  className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div
            className={`max-h-80 overflow-y-auto divide-y ${
              theme === 'dark' ? 'divide-slate-800/80' : 'divide-slate-100'
            }`}
          >
            {notifications.length === 0 ? (
              <div
                className={`p-8 text-center text-xs space-y-1 ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                <Bell
                  className={`w-6 h-6 mx-auto mb-2 ${
                    theme === 'dark' ? 'text-slate-600' : 'text-slate-300'
                  }`}
                />
                <p className={`font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>
                  Nenhuma notificação
                </p>
                <p>Você receberá alertas quando houver criação, alteração ou atribuição de chamados.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    onMarkAsRead(notif.id);
                    onSelectTicketById(notif.ticketId);
                    setIsOpen(false);
                  }}
                  className={`p-3.5 transition-colors cursor-pointer group flex items-start gap-3 relative ${
                    theme === 'dark'
                      ? !notif.read
                        ? 'bg-indigo-950/30 hover:bg-slate-800/70'
                        : 'hover:bg-slate-850/80'
                      : !notif.read
                      ? 'bg-indigo-50/60 hover:bg-indigo-50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {!notif.read && (
                    <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}

                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
                      theme === 'dark'
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-xs font-bold truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 ${
                          theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
                        }`}
                      >
                        {notif.title}
                      </span>
                      <span
                        className={`text-[10px] shrink-0 font-medium ${
                          theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p
                      className={`text-xs line-clamp-2 leading-relaxed ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {notif.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[11px] pt-1">
                      <span
                        className={`font-mono text-[10px] ${
                          theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        Para: {notif.recipientEmail}
                      </span>

                      {/* Button to preview the sent email */}
                      {notif.emailSent && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreviewEmail(notif);
                          }}
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded px-2 py-0.5 border transition-all ${
                            theme === 'dark'
                              ? 'text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border-indigo-500/20'
                              : 'text-indigo-600 hover:text-indigo-800 bg-indigo-50 border-indigo-200'
                          }`}
                        >
                          <Mail className="w-3 h-3" />
                          <span>Ver E-mail</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Dropdown Footer */}
          <div
            className={`p-2.5 border-t text-center ${
              theme === 'dark'
                ? 'bg-slate-950/90 border-slate-800 text-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <span className="text-[10px] flex items-center justify-center gap-1">
              <Mail className="w-3 h-3 text-emerald-500" />
              Notificações e-mail automáticas ativas no domínio corporativo
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
