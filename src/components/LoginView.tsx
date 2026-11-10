import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { signInWithGoogleCorporate, UnauthorizedCorporateDomainError } from '../lib/firebase';
import { UserProfile, UserRoleAssignment } from '../types';
import { EmbragLogo } from './EmbragLogo';
import { useTheme } from '../context/ThemeContext';

interface LoginViewProps {
  allowedDomains: string[];
  roleAssignments?: UserRoleAssignment[];
  onLoginSuccess: (user: UserProfile) => void;
  mockLogin: (role: 'admin' | 'user' | 'agent', email: string, name: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  allowedDomains,
  roleAssignments,
  onLoginSuccess,
  mockLogin,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const user = await signInWithGoogleCorporate(allowedDomains, roleAssignments);
      onLoginSuccess(user);
    } catch (err: any) {
      if (err instanceof UnauthorizedCorporateDomainError) {
        setErrorMessage(
          `Acesso não autorizado: o e-mail "${err.email}" não pertence ao domínio corporativo @${err.allowedDomains.join(', @')}.`
        );
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('A janela de autenticação foi fechada antes de concluir o login.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Pop-ups bloqueados no navegador. Por favor, autorize pop-ups para entrar com o Google.');
      } else {
        setErrorMessage(
          err.message || 'Erro durante a autenticação. Verifique sua conexão e tente novamente.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between transition-colors duration-200 select-none ${
        theme === 'dark' ? 'bg-[#090d16] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Header Bar for Theme Toggle */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Building2 className="w-4 h-4 text-emerald-500" />
          <span>Embrag S/A</span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-xs'
          }`}
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600" />
              <span>Modo Escuro</span>
            </>
          )}
        </button>
      </header>

      {/* Center Public Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div
          className={`w-full max-w-md rounded-3xl border shadow-xl p-8 sm:p-10 transition-colors ${
            theme === 'dark'
              ? 'bg-slate-900/90 border-slate-800 shadow-slate-950/60'
              : 'bg-white border-slate-200 shadow-slate-200/50'
          }`}
        >
          {/* Enlarged Centered Logo (no dark blue box) */}
          <div className="flex flex-col items-center text-center">
            <EmbragLogo
              theme={theme}
              size="login"
              className="items-center justify-center mb-6"
            />

            {/* Product Name: Helpdesk */}
            <h1
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Helpdesk
            </h1>

            <p
              className={`mt-2 text-xs sm:text-sm leading-relaxed max-w-xs ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Central corporativa para abertura e atendimento de solicitações de suporte.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mt-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Google Sign-In Action */}
          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${
                theme === 'dark'
                  ? 'bg-white hover:bg-slate-100 text-slate-900'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.89 0 12s.45 3.86 1.24 5.42l4.04-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Entrar com Google</span>
                  <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
                </>
              )}
            </button>

            {/* Corporate Account Directive */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Acesso restrito a contas corporativas</span>
              <span className="font-mono text-emerald-500 font-semibold">
                @{allowedDomains[0] || 'embrag.com.br'}
              </span>
            </div>
          </div>

          {/* Fast Access / Demo Profiles */}
          <div className="mt-8 pt-6 border-t border-slate-800/60">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider block text-center mb-3 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Acesso Rápido de Demonstração
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  mockLogin('admin', 'admin@embrag.com.br', 'Administrador TI Embrag')
                }
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-950/80 hover:bg-slate-800 border-slate-800'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-500">Admin TI</span>
                  <span className="text-[10px] font-mono opacity-60">Fila Total</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                  admin@embrag.com.br
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  mockLogin('user', 'mariana.souza@embrag.com.br', 'Mariana Souza (Financeiro)')
                }
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-950/80 hover:bg-slate-800 border-slate-800'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400">Colaborador</span>
                  <span className="text-[10px] font-mono opacity-60">Demandas</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                  mariana.souza@...
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500">
        Embrag S/A • Governança & Tecnologia da Informação
      </footer>
    </div>
  );
};
