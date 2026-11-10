import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  AlertCircle,
  Send,
  Sparkles,
  Paperclip,
  Trash2,
  FileText,
} from 'lucide-react';
import { z } from 'zod';
import {
  CorporateConfig,
  Department,
  Ticket,
  TicketAttachment,
  TicketCategory,
  TicketPriority,
  UserProfile,
} from '../types';
import { useTheme } from '../context/ThemeContext';
import { formatBytes } from '../lib/utils';

interface NewTicketModalProps {
  currentUser: UserProfile;
  config: CorporateConfig;
  onClose: () => void;
  onCreateTicket: (ticket: Ticket) => void;
}

const CATEGORIES: TicketCategory[] = [
  'Hardware & Periféricos',
  'Software & Licenças',
  'Rede & Conectividade',
  'Acessos & Permissões',
  'Email & Google Workspace',
  'Telefonia & VOIP',
  'Impressoras & Scanners',
  'Outros Assuntos',
];

const DEPARTMENTS: Department[] = [
  'Tecnologia da Informação',
  'Financeiro & Controladoria',
  'Recursos Humanos',
  'Operações & Logística',
  'Comercial & Vendas',
  'Diretoria & Jurídico',
  'Administrativo',
];

// Zod schema for new ticket validation
const newTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'O título deve conter pelo menos 5 caracteres.')
    .max(120, 'O título deve ter no máximo 120 caracteres.'),
  description: z
    .string()
    .trim()
    .min(10, 'A descrição deve conter pelo menos 10 caracteres explicando o problema.')
    .max(3000, 'A descrição é muito longa (limite de 3000 caracteres).'),
  category: z.string().min(1, 'Selecione uma categoria válida.'),
  department: z.string().min(1, 'Selecione um departamento válido.'),
  priority: z.enum(['baixa', 'media', 'alta', 'urgente']),
  workstationLocation: z.string().max(80, 'Localidade com no máximo 80 caracteres.').optional(),
});

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  currentUser,
  config,
  onClose,
  onCreateTicket,
}) => {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Hardware & Periféricos');
  const [department, setDepartment] = useState<Department>(
    currentUser.department || 'Administrativo'
  );
  const [priority, setPriority] = useState<TicketPriority>('media');
  const [workstationLocation, setWorkstationLocation] = useState('');
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const quickTemplates = [
    {
      label: 'Google Workspace / Email',
      cat: 'Email & Google Workspace' as TicketCategory,
      prio: 'media' as TicketPriority,
      title: 'Ajuste de permissão ou sincronização de e-mail corporativo',
    },
    {
      label: 'Falha de Rede / VPN',
      cat: 'Rede & Conectividade' as TicketCategory,
      prio: 'alta' as TicketPriority,
      title: 'Instabilidade na conexão VPN Fortinet ou rede interna',
    },
    {
      label: 'Periférico / Monitor',
      cat: 'Hardware & Periféricos' as TicketCategory,
      prio: 'baixa' as TicketPriority,
      title: 'Substituição de teclado, mouse ou monitor na estação de trabalho',
    },
    {
      label: 'Bloqueio de Sistema',
      cat: 'Acessos & Permissões' as TicketCategory,
      prio: 'urgente' as TicketPriority,
      title: 'Credencial corporativa bloqueada impedindo operação no sistema',
    },
  ];

  const applyTemplate = (tpl: (typeof quickTemplates)[0]) => {
    setCategory(tpl.cat);
    setPriority(tpl.prio);
    setTitle(tpl.title);
    setFormErrors((prev) => ({ ...prev, title: '' }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: TicketAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        alert(`O arquivo ${file.name} ultrapassa o limite de 5MB.`);
        continue;
      }
      newItems.push({
        id: `att-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      });
    }
    setAttachments((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = newTicketSchema.safeParse({
      title,
      description,
      category,
      department,
      priority,
      workstationLocation,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(fieldErrors);
      return;
    }

    setFormErrors({});

    // Calculate SLA due date
    const hours = config.slaHours[priority] || 24;
    const slaDueDate = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    const randomCode = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: Ticket = {
      id: `tkt-${Date.now()}`,
      code: randomCode,
      title: title.trim(),
      description: description.trim(),
      category,
      department,
      priority,
      status: 'novo',
      workstationLocation: workstationLocation.trim() || undefined,
      requesterUid: currentUser.uid,
      requesterName: currentUser.name,
      requesterEmail: currentUser.email,
      requesterPhoto: currentUser.photoURL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slaDueDate,
      commentsCount: 0,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    onCreateTicket(newTicket);
    onClose();
  };

  const inputClass = (hasError?: boolean) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 ${
      hasError
        ? 'border-rose-500 focus:ring-rose-500/30'
        : 'focus:ring-emerald-500/30 focus:border-emerald-500'
    } ${
      theme === 'dark'
        ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
    }`;

  const labelClass = `text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div
        className={`border rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150 transition-colors ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            theme === 'dark'
              ? 'border-slate-800 bg-slate-950/60'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2
                className={`text-base sm:text-lg font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              >
                Novo Chamado de Suporte TI
              </h2>
              <p
                className={`text-xs ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Solicitante:{' '}
                <span
                  className={`font-semibold ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
                  }`}
                >
                  {currentUser.name}
                </span>{' '}
                ({currentUser.email})
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Quick template suggestions */}
          <div className="space-y-1.5">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-500" />
              Sugestões Rápidas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickTemplates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-emerald-300'
                      : 'bg-slate-100 hover:bg-emerald-50 border-slate-200 text-slate-700 hover:text-emerald-700'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              Assunto / Título do Chamado <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Não consigo acessar a pasta compartilhada no Google Drive..."
              className={inputClass(!!formErrors.title)}
            />
            {formErrors.title && (
              <p className="text-xs text-rose-500 font-medium">{formErrors.title}</p>
            )}
          </div>

          {/* Category & Department Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelClass}>
                Categoria do Incidente <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className={inputClass(!!formErrors.category)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>
                Departamento Solicitante <span className="text-rose-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className={inputClass(!!formErrors.department)}
              >
                {DEPARTMENTS.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Workstation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelClass}>
                Prioridade / Impacto Operacional
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className={inputClass()}
              >
                <option value="baixa">Baixa (Dúvidas ou melhorias normais)</option>
                <option value="media">Média (Impacto parcial, contorno viável)</option>
                <option value="alta">Alta (Processo importante paralisado)</option>
                <option value="urgente">Urgente (Emergência crítica geral)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>
                Estação / Filial / Andar (Opcional)
              </label>
              <input
                type="text"
                value={workstationLocation}
                onChange={(e) => setWorkstationLocation(e.target.value)}
                placeholder="Ex: Matriz 3º andar, Estação TI-02 ou Remoto"
                className={inputClass()}
              >
              </input>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              Descrição Detalhada do Problema <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique o que aconteceu, mensagens de erro exibidas e ações já tentadas..."
              className={inputClass(!!formErrors.description)}
            />
            {formErrors.description && (
              <p className="text-xs text-rose-500 font-medium">{formErrors.description}</p>
            )}
          </div>

          {/* Attachments Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={labelClass}>Anexos / Capturas de Tela (Máx 5MB)</label>
              <label
                htmlFor="ticket-file-input"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
                <span>Adicionar Arquivo</span>
              </label>
              <input
                id="ticket-file-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate font-medium">{att.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({formatBytes(att.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                      title="Remover anexo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
              theme === 'dark'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <p className="leading-relaxed">
              O chamado será vinculado ao e-mail corporativo{' '}
              <strong className="font-mono">{currentUser.email}</strong> e atribuído com prioridade{' '}
              <strong className="uppercase">{priority}</strong>.
            </p>
          </div>

          {/* Footer Submit */}
          <div
            className={`pt-3 border-t flex items-center justify-end gap-3 ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Registrar Chamado</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
