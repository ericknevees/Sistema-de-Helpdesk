import React, { useEffect } from 'react';
import { X, Mail, ExternalLink, CheckCircle, Bell, ArrowRight } from 'lucide-react';
import { HelpdeskNotification } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ToastAlertProps {
  notification: HelpdeskNotification | null;
  onDismiss: () => void;
  onOpenTicket: (ticketId: string) => void;
  onPreviewEmail: (notification: HelpdeskNotification) => void;
}

export const ToastAlert: React.FC<ToastAlertProps> = ({
  notification,
  onDismiss,
  onOpenTicket,
  onPreviewEmail,
}) => {
  const { theme } = useTheme();

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 7000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div
        className={`backdrop-blur-md rounded-2xl p-4 shadow-2xl relative overflow-hidden ring-1 ${
          theme === 'dark'
            ? 'bg-slate-900/95 border border-indigo-500/40 shadow-indigo-950/50 ring-white/10'
            : 'bg-white/95 border border-indigo-200 shadow-slate-300/60 ring-black/5'
        }`}
      >
        {/* Accent top line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400" />

        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
              theme === 'dark'
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                : 'bg-indigo-50 text-indigo-600 border-indigo-200'
            }`}
          >
            <Bell className="w-4 h-4 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-xs font-bold flex items-center gap-1.5 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              >
                <span>Alerta em Tempo Real</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </span>
              <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4
              className={`text-xs font-bold mt-1 truncate ${
                theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'
              }`}
            >
              {notification.title}
            </h4>
            <p
              className={`text-xs mt-0.5 line-clamp-2 leading-relaxed ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {notification.message}
            </p>

            <div
              className={`mt-3 pt-2 border-t flex items-center justify-between text-xs ${
                theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  onPreviewEmail(notification);
                  onDismiss();
                }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 text-[11px]"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>E-mail Corporativo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenTicket(notification.ticketId);
                  onDismiss();
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition-all shadow-sm"
              >
                <span>Acessar Chamado</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
