import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Shield,
  User,
  CheckCircle2,
  AlertCircle,
  Printer,
  Search,
  History,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { UserProfile } from '../types';

// Image assets generated for the manuals
import userHeroImg from '../assets/images/manual_usuario_hero_1794498907075.jpg';
import adminHeroImg from '../assets/images/manual_admin_hero_1794498907575.jpg';
import stepTicketImg from '../assets/images/step_abrir_chamado_1794498920326.jpg';
import stepSignatureImg from '../assets/images/step_entrega_assinatura_1794498920594.jpg';
import stepKanbanImg from '../assets/images/step_kanban_triagem_1794498933772.jpg';
import stepInventoryImg from '../assets/images/step_estoque_cards_1794498933945.jpg';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  initialMode?: 'user' | 'admin';
}

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialMode = 'user',
}) => {
  const { theme } = useTheme();
  const isAdmin = currentUser?.role === 'admin';
  const [activeManual, setActiveManual] = useState<'user' | 'admin'>(
    initialMode === 'admin' && isAdmin ? 'admin' : 'user'
  );
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-5xl h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/90'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80'
        }`}
      >
        {/* Top Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
            theme === 'dark' ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50/90'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                activeManual === 'admin'
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {activeManual === 'admin'
                    ? 'Manual do Administrador de TI'
                    : 'Manual de Uso do Colaborador'}
                </h2>
                <span
                  className={`hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                    activeManual === 'admin'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
                  }`}
                >
                  {activeManual === 'admin' ? 'Acesso Restrito TI' : 'Guia Passo a Passo'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {activeManual === 'admin'
                  ? 'Instruções para gestão de chamados, controle do estoque tecnológico, movimentações e governança'
                  : 'Aprenda como abrir chamados, acompanhar resoluções e assinar termos de equipamentos'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className={`p-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                theme === 'dark'
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-800'
              }`}
              title="Imprimir Manual"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Manual Selector Tabs */}
        <div
          className={`flex items-center justify-between px-6 border-b shrink-0 ${
            theme === 'dark' ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-100/70'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveManual('user')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeManual === 'user'
                  ? 'border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Manual do Colaborador</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveManual('admin')}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeManual === 'admin'
                    ? 'border-indigo-600 text-indigo-700 dark:border-indigo-500 dark:text-indigo-400'
                    : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Manual do Administrador (TI)</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                  ADMIN
                </span>
              </button>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 py-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                theme === 'dark' ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar instrução..."
                className="bg-transparent border-none outline-hidden text-xs w-36 focus:w-48 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* ========================================================================= */}
          {/* MANUAL DO COLABORADOR (FUNCIONÁRIO) */}
          {/* ========================================================================= */}
          {activeManual === 'user' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              {/* Hero Banner with Illustration */}
              <div
                className={`overflow-hidden rounded-3xl border ${
                  theme === 'dark' ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-6 sm:p-8">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Guia de Utilização Corporativo
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold mt-1 tracking-tight text-slate-900 dark:text-white">
                      Bem-vindo ao Helpdesk Embrag
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                      Este portal é o seu canal direto e ágil com a equipe de Tecnologia da Informação.
                      Abra solicitações de hardware, softwares, acessos ou rede, acompanhe prazos de atendimento
                      e assine seus termos de equipamentos de forma 100% digital.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Login com Conta Google
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> SLA Transparente
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Assinatura Eletrônica
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/40 shadow-md">
                    <img
                      src={userHeroImg}
                      alt="Ilustração do Colaborador utilizando o Helpdesk"
                      className="w-full h-auto object-cover max-h-[220px]"
                    />
                  </div>
                </div>
              </div>

              {/* Step 1: Login */}
              <div
                className={`p-6 rounded-3xl border transition-colors ${
                  theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-sm">
                    1
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Como Acessar o Sistema</h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      O acesso ao Helpdesk utiliza o sistema de login único (SSO) do <strong className="text-slate-900 dark:text-white">Google Workspace</strong>.
                      Você não precisa memorizar novas senhas.
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-800 dark:text-slate-200">
                      <li>Acesse o link do Helpdesk no seu navegador.</li>
                      <li>Clique no botão <strong className="text-emerald-700 dark:text-emerald-400">"Entrar com Google"</strong>.</li>
                      <li>
                        Selecione sua conta de e-mail institucional terminada em <code className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-slate-200 dark:border-slate-700">@embrag.com.br</code>.
                      </li>
                      <li>O sistema identificará automaticamente seu nome, e-mail e departamento.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 2: Open Ticket (with image) */}
              <div
                className={`p-6 rounded-3xl border transition-colors ${
                  theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Como Abrir um Novo Chamado de Suporte</h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                      Sempre que precisar de auxílio da equipe de TI, registre um chamado para garantir priorização e cumprimento do SLA.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-3 text-xs text-slate-800 dark:text-slate-200">
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
                      <div className="font-bold text-emerald-800 dark:text-emerald-400 text-xs uppercase tracking-wide">Passo a passo no formulário:</div>
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-200 leading-relaxed">
                        <li>
                          Clique no botão verde <strong className="text-slate-900 dark:text-white">"+ Novo Chamado"</strong> na barra lateral.
                        </li>
                        <li>
                          <strong className="text-slate-900 dark:text-white">Título:</strong> Escreva um resumo objetivo (ex: <em>"Impressora do financeiro não puxa folha"</em>).
                        </li>
                        <li>
                          <strong className="text-slate-900 dark:text-white">Categoria:</strong> Escolha entre <em>Hardware, Software, Rede, Acessos</em> ou <em>Outro</em>.
                        </li>
                        <li>
                          <strong className="text-slate-900 dark:text-white">Prioridade:</strong> Indique o impacto (Baixa, Média, Alta ou Crítica).
                        </li>
                        <li>
                          <strong className="text-slate-900 dark:text-white">Descrição:</strong> Explique detalhadamente o que aconteceu, mensagens de erro e o que você já tentou.
                        </li>
                        <li>
                          Clique em <strong className="text-emerald-700 dark:text-emerald-400">"Criar Chamado"</strong>.
                        </li>
                      </ol>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-amber-300 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-950 dark:text-amber-300 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <span className="leading-relaxed">
                        Um código único como <strong className="text-amber-900 dark:text-amber-200 font-mono">TKT-2026-0042</strong> será gerado e um prazo limite de resposta (SLA) será calculado na hora.
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                    <img
                      src={stepTicketImg}
                      alt="Formulário de Abertura de Chamado"
                      className="w-full h-auto object-cover"
                    />
                    <div className="p-2.5 text-center text-[11px] font-medium text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800">
                      Tela de preenchimento de solicitação com seleção de categoria e urgência
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Tracking & Chat */}
              <div
                className={`p-6 rounded-3xl border transition-colors ${
                  theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-sm">
                    3
                  </div>
                  <div className="space-y-3 flex-1">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Acompanhamento e Conversa com o Técnico</h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      Você pode verificar o andamento de todos os seus chamados em tempo real na <strong className="text-slate-900 dark:text-white">Fila de Chamados</strong>.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs">
                        <span className="font-bold text-blue-700 dark:text-blue-400 block mb-1">Status do Chamado</span>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                          <strong className="text-slate-900 dark:text-white">Aberto:</strong> Aguardando técnico.<br />
                          <strong className="text-slate-900 dark:text-white">Em Atendimento:</strong> Técnico alocado.<br />
                          <strong className="text-slate-900 dark:text-white">Resolvido:</strong> Finalizado com sucesso.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">Chat de Mensagens</span>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                          Abra o chamado para enviar novas mensagens, esclarecer dúvidas e receber orientações do suporte de TI.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs">
                        <span className="font-bold text-purple-700 dark:text-purple-400 block mb-1">Sino de Notificações</span>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                          Sempre que o técnico responder, uma notificação aparecerá no sino do topo e no seu e-mail institucional.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Digital Signature (with image) */}
              <div
                className={`p-6 rounded-3xl border transition-colors ${
                  theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Como Assinar o Termo de Recebimento de Equipamento</h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                      Ao receber um notebook, monitor ou celular da TI, é emitido um <strong className="text-slate-900 dark:text-white">Termo de Responsabilidade e Custódia</strong> com protocolo oficial.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md order-2 md:order-1">
                    <img
                      src={stepSignatureImg}
                      alt="Assinatura Eletrônica no Canvas do Helpdesk"
                      className="w-full h-auto object-cover"
                    />
                    <div className="p-2.5 text-center text-[11px] font-medium text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800">
                      Coleta de assinatura manuscrita na tela do celular, tablet ou com o mouse
                    </div>
                  </div>

                  <div className="space-y-3 text-xs text-slate-800 dark:text-slate-200 order-1 md:order-2">
                    <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-200 leading-relaxed">
                      <li>O técnico da TI apresentará o termo com o modelo e patrimônio do equipamento.</li>
                      <li>
                        Confira se os dados do equipamento e sua localização física estão corretos.
                      </li>
                      <li>
                        No campo de assinatura, assine com o dedo (no celular/tablet) ou usando o mouse do computador.
                      </li>
                      <li>
                        Clique em <strong className="text-emerald-700 dark:text-emerald-400">"Confirmar e Assinar Termo"</strong>.
                      </li>
                    </ol>

                    <div className="p-3.5 rounded-2xl border border-emerald-300 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 text-xs font-medium">
                      ✓ Sua assinatura é gravada com segurança jurídica e associada ao seu e-mail corporativo.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MANUAL DO ADMINISTRADOR DE TI (EXCLUSIVO ADMIN) */}
          {/* ========================================================================= */}
          {activeManual === 'admin' && isAdmin && (
            <div className="space-y-8 max-w-4xl mx-auto">
              {/* Admin Hero Banner */}
              <div
                className={`overflow-hidden rounded-3xl border ${
                  theme === 'dark' ? 'bg-indigo-950/30 border-indigo-500/30' : 'bg-indigo-50/80 border-indigo-200 shadow-xs'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-6 sm:p-8">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                      Painel do Administrador de TI
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold mt-1 tracking-tight text-slate-900 dark:text-white">
                      Gestão Global do Helpdesk & Estoque
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                      Como administrador, você possui controle irrestrito sobre o atendimento da equipe técnica,
                      parametrização de SLAs, gestão de papéis corporativos e todo o ciclo de vida do <strong className="text-slate-900 dark:text-white">Estoque Tecnológico</strong>.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-slate-400">
                      <span className="flex items-center gap-1 text-indigo-700 dark:text-indigo-400 font-semibold">
                        <ShieldCheck className="w-4 h-4" /> Acesso Exclusivo TI
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-indigo-700 dark:text-indigo-400 font-semibold">
                        <History className="w-4 h-4" /> Trilha Imutável
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-indigo-700 dark:text-indigo-400 font-semibold">
                        <Layers className="w-4 h-4" /> Controle Patrimonial
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-indigo-200 dark:border-indigo-500/30 shadow-md">
                    <img
                      src={adminHeroImg}
                      alt="Painel do Administrador do Helpdesk"
                      className="w-full h-auto object-cover max-h-[220px]"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Step 1: Kanban & SLA */}
              <div
                className={`p-6 rounded-3xl border transition-colors ${
                  theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Gestão de Chamados & Quadro Kanban</h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                      Acompanhe o fluxo de atendimento em colunas visuais com garantia de atribuição atômica para evitar conflitos de atendimento.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-3 text-xs text-slate-800 dark:text-slate-200">
                    <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-200 leading-relaxed">
                      <li>
                        <strong className="text-slate-900 dark:text-white">Triagem de Novos Chamados:</strong> Acesse o <strong className="text-indigo-700 dark:text-indigo-400">Quadro Kanban</strong> para visualizar tickets agrupados por <em>Aberto</em>, <em>Em Atendimento</em>, <em>Aguardando</em> e <em>Resolvido</em>.
                      </li>
                      <li>
                        <strong className="text-slate-900 dark:text-white">Assumir Chamado:</strong> Com 1 clique no botão "Assumir", o técnico se torna o responsável formal no Firestore.
                      </li>
                      <li>
                        <strong className="text-slate-900 dark:text-white">Notas Internas:</strong> Marque a caixa <em>"Nota Técnica Interna"</em> ao comentar para registrar diagnósticos confidenciais invisíveis para o solicitante.
                      </li>
                      <li>
                        <strong className="text-slate-900 dark:text-white">Controle de SLA:</strong> O sistema sinaliza chamados próximos do vencimento ou estourados com base na matriz configurada.
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                    <img
                      src={stepKanbanImg}
                      alt="Quadro Kanban de Chamados"
                      className="w-full h-auto object-cover"
                    />
                    <div className="p-2.5 text-center text-[11px] font-medium text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800">
                      Fluxo em colunas de atendimento e distribuição de demandas entre técnicos
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Step 2: Tech Inventory Management */}
              <div
                className={`p-6 rounded-3xl border transition-colors ${
                  theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Estoque Tecnológico: Cadastro e Visualização</h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                      Módulo exclusivo para administradores, acessível no menu lateral sob a seção <strong className="text-slate-900 dark:text-white">Administração</strong>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                    <img
                      src={stepInventoryImg}
                      alt="Visualização do Estoque Tecnológico em Cartões"
                      className="w-full h-auto object-cover"
                    />
                    <div className="p-2.5 text-center text-[11px] font-medium text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800">
                      Cartões agrupados por situação: Disponíveis, Em Uso, Em Manutenção e Baixados
                    </div>
                  </div>

                  <div className="space-y-3 text-xs text-slate-800 dark:text-slate-200">
                    <div className="font-bold text-indigo-800 dark:text-indigo-400 text-xs uppercase tracking-wide">Instruções de Cadastro de Equipamento:</div>
                    <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-200 leading-relaxed">
                      <li>Acesse a aba <strong className="text-slate-900 dark:text-white">Estoque Tecnológico</strong>.</li>
                      <li>Clique em <strong className="text-indigo-700 dark:text-indigo-400">"+ Novo Equipamento"</strong>.</li>
                      <li>
                        <strong className="text-slate-900 dark:text-white">Identificador Interno (Obrigatório):</strong> Código exclusivo (ex: <code className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300">NOT-001</code>). O sistema valida contra duplicatas.
                      </li>
                      <li>
                        <strong className="text-slate-900 dark:text-white">Patrimônio e Série:</strong> Insira a etiqueta física e o número de série de fábrica se existirem.
                      </li>
                      <li>
                        <strong className="text-slate-900 dark:text-white">Categoria e Modelo:</strong> Selecione o tipo (Notebook, Monitor, Roteador, etc.) e informe fabricante e especificações.
                      </li>
                      <li>
                        <strong className="text-slate-900 dark:text-white">Fotos Otimizadas:</strong> Adicione fotos do equipamento (opcional). Elas serão compactadas em WebP para não onerar o banco.
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Admin Step 3: Movements, Custody & Return */}
              <div
                className={`p-6 rounded-3xl border transition-colors ${
                  theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-sm">
                    3
                  </div>
                  <div className="space-y-3 flex-1">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Entrega, Transferência e Devolução de Aparelhos</h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      Cada alteração física gera um registro indelével em <code className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">/inventory_movements</code> com quem executou, horários e justificativa.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs space-y-2">
                        <span className="font-bold text-emerald-800 dark:text-emerald-400 block text-xs uppercase tracking-wide">Como Realizar a Entrega</span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                          1. Abra o cartão do equipamento disponível.<br />
                          2. Clique no botão <strong className="text-slate-900 dark:text-white">"Entregar Equipamento"</strong>.<br />
                          3. Selecione o colaborador da lista ou digite o nome/e-mail.<br />
                          4. <strong className="text-emerald-800 dark:text-emerald-400">Obrigatório:</strong> Preencha a Unidade, Setor e Localização Física (ex: Sala 204, Estação 3).<br />
                          5. O sistema gera a minuta do termo com assinatura digital.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs space-y-2">
                        <span className="font-bold text-amber-800 dark:text-amber-400 block text-xs uppercase tracking-wide">Como Registrar Devolução</span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                          1. Abra o equipamento que está "Em Uso".<br />
                          2. Clique em <strong className="text-slate-900 dark:text-white">"Registrar Devolução"</strong>.<br />
                          3. O colaborador é desvinculado imediatamente.<br />
                          4. <strong className="text-amber-800 dark:text-amber-400">Obrigatório:</strong> Digite manualmente onde o aparelho será guardado no estoque (ex: Depósito TI, Armário 1B).<br />
                          5. O status retorna para "Disponível".
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Step 4: Settings & Users */}
              <div
                className={`p-6 rounded-3xl border transition-colors ${
                  theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-sm">
                    4
                  </div>
                  <div className="space-y-3 flex-1">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Gestão de Papéis, Permissões e Configurações de SLA</h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      Gerencie quem tem acesso administrativo e parametrize os tempos de atendimento em <strong className="text-slate-900 dark:text-white">Configurações do Helpdesk</strong>.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-800 dark:text-slate-200">
                      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                        <strong className="text-indigo-800 dark:text-indigo-400 block mb-1 font-bold">Atribuir Administrador</strong>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                          Insira o e-mail <code className="font-mono text-[10px] text-slate-900 dark:text-slate-100">@embrag.com.br</code> na aba "Papéis & Permissões" e selecione "Administrador".
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                        <strong className="text-emerald-800 dark:text-emerald-400 block mb-1 font-bold">Atribuir Técnico TI</strong>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                          Concede acesso à triagem de chamados e Kanban sem liberar o Estoque Tecnológico.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                        <strong className="text-blue-800 dark:text-blue-400 block mb-1 font-bold">Horas de SLA</strong>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                          Defina o número de horas para resolução conforme a criticidade (ex: Crítica: 2h, Alta: 6h, Normal: 24h).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
