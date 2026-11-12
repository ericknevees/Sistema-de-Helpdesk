import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  X,
  Printer,
  CheckCircle2,
  Clock,
  Send,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  PenTool,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DeliveryTerm, Equipment, UserProfile } from '../../types';

interface DeliveryTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  term?: DeliveryTerm | null;
  equipment?: Equipment | null;
  currentUser: UserProfile;
  onSaveTerm: (term: DeliveryTerm) => Promise<void> | void;
}

const COMMON_ACCESSORIES = [
  'Carregador original com cabo de alimentação',
  'Mouse óptico corporativo',
  'Mochila corporativa antifurto Embrag',
  'Capa de proteção acolchoada',
  'Adaptador USB-C / HDMI / Ethernet',
  'Headset corporativo com microfone',
  'Cabo de segurança Kensington',
  'Película de proteção de tela aplicada',
];

const DEFAULT_DECLARATION = `Declaro ter recebido da EMBRAG o equipamento tecnológico discriminado neste termo, em perfeitas condições de uso, funcionamento e conservação física, juntamente com todos os seus acessórios relacionados.

Comprometo-me a:
1. Utilizar o referido equipamento e seus softwares estritamente para o desempenho de minhas atividades profissionais na EMBRAG, observando a Política de Segurança da Informação e LGPD.
2. Zelar pela guarda, integridade física e segurança do equipamento, mantendo-o protegido contra quedas, líquidos, temperaturas excessivas ou furto/roubo.
3. Comunicar imediatamente à equipe de Tecnologia da Informação (TI) qualquer extravio, dano, avaria ou anomalia técnica, acompanhado de Boletim de Ocorrência policial em caso de furto ou roubo.
4. Restituir o equipamento e seus acessórios de imediato à EMBRAG nas mesmas condições em que os recebi (ressalvado o desgaste natural do uso) em caso de substituição, transferência de setor ou rescisão contratual.`;

export const DeliveryTermModal: React.FC<DeliveryTermModalProps> = ({
  isOpen,
  onClose,
  term,
  equipment,
  currentUser,
  onSaveTerm,
}) => {
  if (!isOpen) return null;

  // Initialize form state
  const isExisting = !!term;

  const [recipientName, setRecipientName] = useState(
    term?.recipientName || equipment?.assignedTo?.assignedToName || ''
  );
  const [recipientEmail, setRecipientEmail] = useState(
    term?.recipientEmail || equipment?.assignedTo?.assignedToEmail || ''
  );
  const [recipientRole, setRecipientRole] = useState(term?.recipientRole || '');
  const [recipientDepartment, setRecipientDepartment] = useState(
    term?.recipientDepartment || equipment?.department || ''
  );
  const [branch, setBranch] = useState(
    term?.branch || equipment?.branch || 'Matriz - São Paulo'
  );
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>(
    term?.accessories || [
      'Carregador original com cabo de alimentação',
      'Mochila corporativa antifurto Embrag',
    ]
  );
  const [customAccessory, setCustomAccessory] = useState('');
  const [conditionNotes, setConditionNotes] = useState(
    term?.conditionNotes || 'Equipamento conferido em perfeito estado de funcionamento e conservação.'
  );

  // Digital Signature state
  const [signatureData, setSignatureData] = useState<string | null>(
    term?.signatureDataUrl || null
  );
  const [isSigningMode, setIsSigningMode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Canvas for digital drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Protocol number
  const protocol =
    term?.protocol ||
    `EMB-TRM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const appsScriptBaseUrl =
    'https://script.google.com/a/macros/embrag.com.br/s/AKfycbx4sMrOZdtblAwyp3HJ9Wtz4msDQvnBJy31qZvCpKl102AbvA3U-AVdctmmn-Hnv1Kp-A/exec';

  const isSigned = term?.status === 'assinado' || !!signatureData;

  // Toggle accessory
  const toggleAccessory = (item: string) => {
    setSelectedAccessories((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const addCustomAccessory = () => {
    const trimmed = customAccessory.trim();
    if (trimmed && !selectedAccessories.includes(trimmed)) {
      setSelectedAccessories((prev) => [...prev, trimmed]);
      setCustomAccessory('');
    }
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // dark ink
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignatureData(null);
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/?termo=${protocol}&protocolo=${encodeURIComponent(protocol)}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async (markAsSigned: boolean) => {
    if (!recipientName.trim()) {
      alert('Por favor, informe o nome do colaborador recebedor.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedTerm: DeliveryTerm = {
        id: term?.id || `term-${Date.now()}`,
        protocol,
        equipmentId: equipment?.id || term?.equipmentId || 'eqp-unknown',
        equipmentCode: equipment?.internalCode || term?.equipmentCode || 'EQP-000',
        equipmentName: equipment?.name || term?.equipmentName || 'Equipamento TI',
        brand: equipment?.brand || term?.brand || '',
        model: equipment?.model || term?.model || '',
        serialNumber: equipment?.serialNumber || term?.serialNumber || '',
        assetTag: equipment?.assetTag || term?.assetTag || '',
        category: equipment?.category || term?.category || 'notebook',
        condition: equipment?.condition || term?.condition || 'excelente',
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        recipientRole: recipientRole.trim(),
        recipientDepartment: recipientDepartment.trim(),
        branch,
        accessories: selectedAccessories,
        conditionNotes,
        declarationVersion: '2.4',
        declarationText: DEFAULT_DECLARATION,
        status: markAsSigned || signatureData ? 'assinado' : 'pendente',
        signedAt: markAsSigned || signatureData ? (term?.signedAt || new Date().toISOString()) : undefined,
        signatureDataUrl: signatureData || term?.signatureDataUrl,
        signerName: recipientName.trim(),
        signerIpOrLocation: 'Ambiente Corporativo Embrag TI',
        createdAt: term?.createdAt || new Date().toISOString(),
        createdByUid: term?.createdByUid || currentUser.uid,
        createdByName: term?.createdByName || currentUser.name,
        createdByEmail: term?.createdByEmail || currentUser.email,
        externalScriptUrl: `${appsScriptBaseUrl}#estoque`,
      };

      await onSaveTerm(updatedTerm);
      onClose();
    } catch (e) {
      console.error('Erro ao salvar termo:', e);
      alert('Erro ao salvar o termo. Verifique a conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:my-0 print:max-w-none text-slate-900 dark:text-slate-100">
        
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/60">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Termo de Responsabilidade & Entrega
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  {protocol}
                </span>
                {isSigned ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Assinado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                    <Clock className="w-3.5 h-3.5" /> Pendente de Assinatura
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Integrado ao inventário e ao Google Apps Script corporativo da Embrag
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Imprimir documento oficial"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Copiar link para o colaborador assinar"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <a
              href={`${appsScriptBaseUrl}#estoque`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Abrir no Google Apps Script Embrag"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="p-8 max-h-[75vh] overflow-y-auto space-y-6 print:p-0 print:max-h-none print:overflow-visible">
          
          {/* Document Header with Embrag Identity */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 dark:border-slate-700 pb-5 print:border-black">
            <div className="flex items-center gap-4">
              <img
                src="/assets/embrag-logo-light.png"
                alt="Logo Embrag"
                className="h-12 w-auto object-contain dark:hidden print:block"
              />
              <img
                src="/assets/embrag-logo-dark.png"
                alt="Logo Embrag"
                className="h-12 w-auto object-contain hidden dark:block print:hidden"
              />
              <div>
                <h1 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white print:text-black">
                  EMBRAG • TECNOLOGIA DA INFORMAÇÃO
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono print:text-gray-600">
                  DEPARTAMENTO DE GESTÃO DE ATIVOS E CUSTÓDIA
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold block text-slate-800 dark:text-slate-200 print:text-black">
                {protocol}
              </span>
              <span className="text-[11px] text-slate-500 font-mono block">
                Versão do Termo: 2.4
              </span>
              <span className="text-[11px] text-slate-500 font-mono block">
                Emissão: {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          <div className="text-center py-2">
            <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
              Termo de Responsabilidade e Entrega de Equipamento Tecnológico
            </h2>
          </div>

          {/* Section 1: Equipment Details */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 print:border print:bg-white print:p-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center print:bg-black print:text-white">
                1
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black">
                Identificação do Equipamento
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Código Interno</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">
                  {equipment?.internalCode || term?.equipmentCode || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Patrimônio</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white print:text-black">
                  {equipment?.assetTag || term?.assetTag || 'Não etiquetado'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Número de Série</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white print:text-black">
                  {equipment?.serialNumber || term?.serialNumber || 'Não informado'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Estado Físico</span>
                <span className="capitalize font-semibold text-slate-900 dark:text-white print:text-black">
                  {equipment?.condition || term?.condition || 'Excelente'}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-4 border-t border-slate-200 dark:border-slate-700/60 pt-2 flex flex-wrap justify-between">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Aparelho / Descrição:</span>
                  <span className="font-bold text-slate-900 dark:text-white print:text-black">
                    {equipment?.name || term?.equipmentName} ({equipment?.brand || term?.brand} {equipment?.model || term?.model})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Unidade / Filial:</span>
                  <span className="font-semibold text-slate-900 dark:text-white print:text-black">
                    {branch}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Recipient / Colaborador */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 print:border print:bg-white print:p-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center print:bg-black print:text-white">
                2
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black">
                Dados do Colaborador (Responsável pela Guarda)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nome do colaborador"
                  disabled={isSigned}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-1 focus:ring-indigo-500 disabled:opacity-75 print:border-none print:p-0 print:font-bold"
                />
              </div>
              <div>
                <label className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1">E-mail Corporativo (@embrag.com.br)</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="colaborador@embrag.com.br"
                  disabled={isSigned}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-500 disabled:opacity-75 print:border-none print:p-0"
                />
              </div>
              <div>
                <label className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1">Cargo / Função</label>
                <input
                  type="text"
                  value={recipientRole}
                  onChange={(e) => setRecipientRole(e.target.value)}
                  placeholder="Ex: Analista de Operações"
                  disabled={isSigned}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-500 disabled:opacity-75 print:border-none print:p-0"
                />
              </div>
              <div>
                <label className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1">Departamento / Setor</label>
                <input
                  type="text"
                  value={recipientDepartment}
                  onChange={(e) => setRecipientDepartment(e.target.value)}
                  placeholder="Ex: Financeiro"
                  disabled={isSigned}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-500 disabled:opacity-75 print:border-none print:p-0"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Accessories Checklist */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 print:border print:bg-white print:p-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center print:bg-black print:text-white">
                  3
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black">
                  Acessórios e Itens Inclusos na Entrega
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 print:hidden">
                {selectedAccessories.length} selecionado(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {COMMON_ACCESSORIES.map((item) => (
                <label
                  key={item}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer text-[12px] ${
                    selectedAccessories.includes(item)
                      ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-900 dark:text-slate-100 font-medium'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  } print:border-none print:p-0.5 print:bg-transparent print:text-black`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAccessories.includes(item)}
                    onChange={() => toggleAccessory(item)}
                    disabled={isSigned}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>

            {!isSigned && (
              <div className="mt-3 flex gap-2 print:hidden">
                <input
                  type="text"
                  value={customAccessory}
                  onChange={(e) => setCustomAccessory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAccessory())}
                  placeholder="Adicionar outro item/acessório específico..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addCustomAccessory}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            )}
          </div>

          {/* Section 4: Declaration / Cláusulas Oficiais */}
          <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-amber-50/30 dark:bg-amber-950/10 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2 print:border print:bg-white print:p-2 print:text-black">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1 print:text-black">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 print:text-black" />
              <span>Declaração de Responsabilidade e Termos de Uso Corporativo</span>
            </div>
            <p className="whitespace-pre-line text-[11.5px] font-sans">
              {DEFAULT_DECLARATION}
            </p>
          </div>

          {/* Section 5: Signatures Area */}
          <div className="border-t-2 border-slate-900 dark:border-slate-700 pt-6 mt-6 print:border-black print:mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
              
              {/* Entrega pela TI */}
              <div className="text-center space-y-1">
                <div className="h-16 flex items-center justify-center border-b border-dashed border-slate-400 dark:border-slate-600 mb-2">
                  <div className="text-center font-mono text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {term?.createdByName || currentUser.name}
                    </span>
                    <span>TI Embrag • Matrícula TI</span>
                  </div>
                </div>
                <span className="font-bold uppercase tracking-wider block text-slate-900 dark:text-white print:text-black">
                  Responsável pela Entrega (TI)
                </span>
                <span className="text-[11px] text-slate-500">
                  Departamento de Suporte e Infraestrutura
                </span>
              </div>

              {/* Recebimento pelo Colaborador (Digital ou Desenho) */}
              <div className="text-center space-y-1">
                <div className="h-20 flex flex-col items-center justify-center border-b border-slate-900 dark:border-slate-600 mb-2 relative print:border-black">
                  {signatureData ? (
                    <img
                      src={signatureData}
                      alt="Assinatura Digital"
                      className="max-h-16 max-w-full object-contain filter dark:invert print:filter-none"
                    />
                  ) : isSigningMode ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <canvas
                        ref={canvasRef}
                        width={320}
                        height={76}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 cursor-crosshair touch-none"
                      />
                    </div>
                  ) : (
                    <div className="text-slate-400 dark:text-slate-500 text-[11px] italic flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5" />
                      <span>{isSigned ? 'Assinado eletronicamente' : 'Aguardando assinatura'}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span className="font-bold uppercase tracking-wider text-slate-900 dark:text-white print:text-black">
                    {recipientName || 'Colaborador (Recebedor)'}
                  </span>
                  {signatureData && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                      ✓ Autenticado
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 font-mono">
                  {isSigned
                    ? `Assinado digitalmente em: ${new Date(term?.signedAt || Date.now()).toLocaleString('pt-BR')}`
                    : 'Assinatura por certificado interno / desenho digital'}
                </div>

                {/* Signing Controls (Hidden in Print) */}
                <div className="pt-2 flex justify-center gap-2 print:hidden">
                  {!signatureData && !isSigningMode && (
                    <button
                      type="button"
                      onClick={() => setIsSigningMode(true)}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                    >
                      <PenTool className="w-3 h-3" /> Assinar na Tela Agora
                    </button>
                  )}
                  {isSigningMode && (
                    <>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> Limpar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSigningMode(false)}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
                      >
                        <Check className="w-3 h-3" /> Confirmar Assinatura
                      </button>
                    </>
                  )}
                  {signatureData && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[11px] text-slate-500 hover:text-red-500 underline"
                    >
                      Refazer assinatura
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Bottom Actions (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Sincronizado com histórico de movimentações e Google Sheets</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Salvar como Pendente
            </button>
            <button
              type="button"
              disabled={isSaving || !recipientName.trim()}
              onClick={() => handleSave(true)}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{signatureData ? 'Salvar Termo Assinado' : 'Confirmar e Assinar'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
