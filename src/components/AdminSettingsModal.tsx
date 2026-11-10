import React, { useState } from 'react';
import {
  X,
  Sliders,
  ShieldCheck,
  Plus,
  Trash2,
  Clock,
  Key,
  Check,
  AlertCircle,
  Building,
  Users,
  Shield,
  UserCheck,
  User,
  Crown,
  Wrench,
  Search,
} from 'lucide-react';
import { CorporateConfig, UserRole, UserRoleAssignment } from '../types';
import { useTheme } from '../context/ThemeContext';

interface AdminSettingsModalProps {
  config: CorporateConfig;
  onClose: () => void;
  onSaveConfig: (newConfig: CorporateConfig) => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  config,
  onClose,
  onSaveConfig,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'roles' | 'domains' | 'sla'>('roles');

  // State
  const [allowedDomains, setAllowedDomains] = useState<string[]>(config.allowedDomains);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [slaHours, setSlaHours] = useState(config.slaHours);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(
    config.emailNotificationsEnabled ?? true
  );
  const [roleAssignments, setRoleAssignments] = useState<UserRoleAssignment[]>(
    config.roleAssignments || []
  );

  // New Role Form State
  const [newRoleEmail, setNewRoleEmail] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleSelected, setNewRoleSelected] = useState<UserRole>('agent');
  const [searchRoleQuery, setSearchRoleQuery] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Add or update an email's role
  const handleAssignRole = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanEmail = newRoleEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    // If user didn't type domain, append primary domain
    if (!cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail}@${config.primaryDomain}`;
    }

    const domain = cleanEmail.split('@')[1];
    if (!allowedDomains.includes(domain)) {
      alert(`O e-mail deve pertencer a um dos domínios corporativos autorizados (@${allowedDomains.join(', @')}).`);
      return;
    }

    const existingIndex = roleAssignments.findIndex(
      (a) => a.email.toLowerCase() === cleanEmail
    );

    const newAssignment: UserRoleAssignment = {
      email: cleanEmail,
      role: newRoleSelected,
      name: newRoleName.trim() || cleanEmail.split('@')[0],
      department:
        newRoleSelected === 'admin' || newRoleSelected === 'agent'
          ? ('Tecnologia da Informação' as const)
          : undefined,
      assignedAt: new Date().toISOString(),
      assignedByEmail: 'admin@embrag.com.br',
    };

    if (existingIndex >= 0) {
      const updated = [...roleAssignments];
      updated[existingIndex] = newAssignment;
      setRoleAssignments(updated);
    } else {
      setRoleAssignments([newAssignment, ...roleAssignments]);
    }

    setNewRoleEmail('');
    setNewRoleName('');
    setNewRoleSelected('agent');
  };

  // Change role inline for an existing email
  const handleInlineRoleChange = (email: string, newRole: UserRole) => {
    const updated: UserRoleAssignment[] = roleAssignments.map((a) => {
      if (a.email.toLowerCase() === email.toLowerCase()) {
        return {
          ...a,
          role: newRole,
          department:
            newRole === 'admin' || newRole === 'agent'
              ? ('Tecnologia da Informação' as const)
              : undefined,
          assignedAt: new Date().toISOString(),
        };
      }
      return a;
    });
    setRoleAssignments(updated);
  };

  // Remove role assignment
  const handleRemoveRole = (email: string) => {
    if (email.toLowerCase() === 'admin@embrag.com.br') {
      alert('Não é possível remover o Administrador principal.');
      return;
    }
    setRoleAssignments(roleAssignments.filter((a) => a.email.toLowerCase() !== email.toLowerCase()));
  };

  // Domains handling
  const handleAddDomain = () => {
    let clean = newDomainInput.trim().toLowerCase();
    if (clean.startsWith('@')) clean = clean.slice(1);
    if (!clean) return;

    if (
      clean === 'gmail.com' ||
      clean === 'hotmail.com' ||
      clean === 'yahoo.com' ||
      clean === 'outlook.com'
    ) {
      alert('Provedores públicos de e-mail pessoal não podem ser adicionados por segurança.');
      return;
    }

    if (!allowedDomains.includes(clean)) {
      setAllowedDomains([...allowedDomains, clean]);
    }
    setNewDomainInput('');
  };

  const handleRemoveDomain = (domain: string) => {
    if (allowedDomains.length <= 1) {
      alert('É necessário manter pelo menos um domínio corporativo configurado.');
      return;
    }
    setAllowedDomains(allowedDomains.filter((d) => d !== domain));
  };

  const handleSave = () => {
    const updated: CorporateConfig = {
      ...config,
      allowedDomains,
      slaHours,
      emailNotificationsEnabled,
      roleAssignments,
    };
    onSaveConfig(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const filteredRoles = roleAssignments.filter((a) => {
    if (!searchRoleQuery) return true;
    const q = searchRoleQuery.toLowerCase();
    return a.email.toLowerCase().includes(q) || (a.name && a.name.toLowerCase().includes(q));
  });

  const adminCount = roleAssignments.filter((a) => a.role === 'admin').length;
  const agentCount = roleAssignments.filter((a) => a.role === 'agent').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        className={`border rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150 transition-colors ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            theme === 'dark' ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2
                className={`text-base sm:text-lg font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              >
                Configurações do Helpdesk
              </h2>
              <p
                className={`text-xs ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Gerencie os perfis de acesso de TI dos colaboradores, domínios e SLA
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

        {/* Navigation Tabs */}
        <div
          className={`flex items-center border-b px-5 pt-2 gap-2 ${
            theme === 'dark'
              ? 'border-slate-800 bg-slate-950/40'
              : 'border-slate-200 bg-slate-100/60'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
                : theme === 'dark'
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Perfis & Acessos de TI</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {roleAssignments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('domains')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'domains'
                ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
                : theme === 'dark'
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Domínios Corporativos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sla')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'sla'
                ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
                : theme === 'dark'
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>SLA & E-mails</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              {/* Top Description & Role Counter Banner */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    Controle de Acessos ao Helpdesk
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Escolha quais e-mails corporativos terão perfil de <strong>Técnico de TI</strong> (atendimento, respostas e notas internas) ou <strong>Administrador de TI</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                    <div className="text-xs font-extrabold text-purple-400">{adminCount}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Admins</div>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                    <div className="text-xs font-extrabold text-blue-400">{agentCount}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Técnicos</div>
                  </div>
                </div>
              </div>

              {/* Form to Assign or Update an Email's Role */}
              <form
                onSubmit={handleAssignRole}
                className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Atribuir Perfil de TI para E-mail Corporativo
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    @{config.primaryDomain}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-400">
                      E-mail Corporativo <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newRoleEmail}
                      onChange={(e) => setNewRoleEmail(e.target.value)}
                      placeholder="usuario@embrag.com.br"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-400">
                      Nome / Função (Opcional)
                    </label>
                    <input
                      type="text"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="Ex: Lucas Silveira - Suporte"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-400">
                      Perfil de Acesso <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={newRoleSelected}
                      onChange={(e) => setNewRoleSelected(e.target.value as UserRole)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="agent">🛠️ Técnico de TI (Suporte)</option>
                      <option value="admin">👑 Administrador de TI</option>
                      <option value="user">👤 Colaborador Padrão</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    O usuário receberá os privilégios assim que fizer login com sua conta Google.
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Conceder Acesso</span>
                  </button>
                </div>
              </form>

              {/* Roles List & Real-time Filter */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    E-mails com Acesso Configurado ({filteredRoles.length})
                  </h4>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchRoleQuery}
                      onChange={(e) => setSearchRoleQuery(e.target.value)}
                      placeholder="Filtrar por nome ou e-mail..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredRoles.map((assignment) => (
                    <div
                      key={assignment.email}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            assignment.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : assignment.role === 'agent'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {assignment.role === 'admin' ? (
                            <Crown className="w-4 h-4" />
                          ) : assignment.role === 'agent' ? (
                            <Wrench className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-200">
                              {assignment.name || assignment.email.split('@')[0]}
                            </span>
                            {assignment.email === 'admin@embrag.com.br' && (
                              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.2 rounded font-semibold border border-indigo-500/20">
                                Primário
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            {assignment.email}
                          </div>
                        </div>
                      </div>

                      {/* Inline Role Selector & Delete */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <select
                          value={assignment.role}
                          disabled={assignment.email === 'admin@embrag.com.br'}
                          onChange={(e) =>
                            handleInlineRoleChange(assignment.email, e.target.value as UserRole)
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                        >
                          <option value="admin">👑 Admin TI</option>
                          <option value="agent">🛠️ Técnico TI</option>
                          <option value="user">👤 Colaborador</option>
                        </select>

                        {assignment.email !== 'admin@embrag.com.br' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRole(assignment.email)}
                            title="Remover perfil de TI"
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOMAINS */}
          {activeTab === 'domains' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Domínios Corporativos Autorizados
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Apenas contas Google com estes domínios conseguem fazer login no sistema.
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">OAuth 2.0</span>
              </div>

              {/* Current Domains List */}
              <div className="space-y-2">
                {allowedDomains.map((domain) => (
                  <div
                    key={domain}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-mono text-sm font-semibold text-slate-200">
                        @{domain}
                      </span>
                      {domain === config.primaryDomain && (
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 font-bold uppercase">
                          Principal
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(domain)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded"
                      title="Remover domínio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Domain Input */}
              <div className="flex gap-2 pt-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    value={newDomainInput}
                    onChange={(e) => setNewDomainInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDomain())}
                    placeholder="novo-dominio.com.br"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDomain}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Domínio
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SLA & EMAIL */}
          {activeTab === 'sla' && (
            <div className="space-y-6">
              {/* SLA Deadlines */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Prazos Limites de SLA por Prioridade (Horas)
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs font-semibold text-rose-300">Urgente</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="72"
                        value={slaHours.urgente}
                        onChange={(e) =>
                          setSlaHours({ ...slaHours, urgente: Number(e.target.value) })
                        }
                        className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                      />
                      <span className="text-xs text-slate-400">h</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs font-semibold text-amber-300">Alta</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={slaHours.alta}
                        onChange={(e) =>
                          setSlaHours({ ...slaHours, alta: Number(e.target.value) })
                        }
                        className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                      />
                      <span className="text-xs text-slate-400">h</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs font-semibold text-blue-300">Média</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="240"
                        value={slaHours.media}
                        onChange={(e) =>
                          setSlaHours({ ...slaHours, media: Number(e.target.value) })
                        }
                        className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                      />
                      <span className="text-xs text-slate-400">h</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs font-semibold text-slate-300">Baixa</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="720"
                        value={slaHours.baixa}
                        onChange={(e) =>
                          setSlaHours({ ...slaHours, baixa: Number(e.target.value) })
                        }
                        className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                      />
                      <span className="text-xs text-slate-400">h</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Notifications Toggle */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Disparo de E-mails Automáticos e Alertas
                    </label>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Envia notificações via e-mail para solicitante e técnico em novas ocorrências.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={emailNotificationsEnabled}
                      onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            theme === 'dark' ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <span
            className={`text-xs ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Sincronizado automaticamente no Google Cloud Firestore
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <span>Salvar Configurações</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
