import React from 'react';
import { X, Mail, CheckCircle2, Shield, Calendar, User, ExternalLink } from 'lucide-react';
import { HelpdeskNotification } from '../types';
import { useTheme } from '../context/ThemeContext';

interface EmailPreviewModalProps {
  notification: HelpdeskNotification;
  onClose: () => void;
  onOpenTicket: (ticketId: string) => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  notification,
  onClose,
  onOpenTicket,
}) => {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        className={`border rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150 transition-colors ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between ${
            theme === 'dark' ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`text-sm sm:text-base font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Visualização do E-mail Corporativo
                </h3>
                <span className="text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Disparado via SMTP / Workspace
                </span>
              </div>
              <p
                className={`text-xs font-mono mt-0.5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Destinatário:{' '}
                <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>
                  {notification.recipientEmail}
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Headers Meta */}
        <div
          className={`p-4 border-b text-xs space-y-1.5 font-mono ${
            theme === 'dark'
              ? 'bg-slate-950/90 border-slate-800 text-slate-300'
              : 'bg-slate-100/70 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <span className={theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}>De: </span>
              <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>
                helpdesk@embrag.com.br
              </strong>{' '}
              (Helpdesk Embrag)
            </div>
            <div className={`text-[11px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
              {new Date(notification.createdAt).toLocaleString()}
            </div>
          </div>
          <div>
            <span className={theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}>Para: </span>
            <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>
              {notification.recipientName}
            </strong>{' '}
            &lt;{notification.recipientEmail}&gt;
          </div>
          <div>
            <span className={theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}>Assunto: </span>
            <span className="text-indigo-500 font-semibold">{notification.emailSubject}</span>
          </div>
        </div>

        {/* Email Body rendered */}
        <div
          className={`flex-1 overflow-y-auto p-4 sm:p-6 ${
            theme === 'dark' ? 'bg-slate-950/40 text-slate-200' : 'bg-slate-50 text-slate-800'
          }`}
        >
          <div
            className={`prose max-w-none ${theme === 'dark' ? 'prose-invert text-slate-200' : 'text-slate-800'}`}
            dangerouslySetInnerHTML={{
              __html: notification.emailHtmlPreview || '<p>Sem conteúdo HTML gerado.</p>',
            }}
          />
        </div>

        {/* Modal Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            theme === 'dark' ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div
            className={`flex items-center gap-1.5 text-xs ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Assinatura DKIM / SPF autenticada</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenTicket(notification.ticketId);
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Chamado</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
