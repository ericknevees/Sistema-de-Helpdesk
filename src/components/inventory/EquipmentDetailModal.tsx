import React, { useState } from 'react';
import {
  X,
  User,
  MapPin,
  Clock,
  ArrowRightLeft,
  Calendar,
  Layers,
  ZoomIn,
  Camera,
  History,
  Info,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  ShieldAlert,
  Building,
  FileText,
} from 'lucide-react';
import {
  Equipment,
  EquipmentMovement,
  UserProfile,
  DeliveryTerm,
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import {
  getCategoryIcon,
  CATEGORY_LABELS,
  STATUS_LABELS,
  CONDITION_LABELS,
  MOVEMENT_TYPE_LABELS,
  getStatusBadgeClasses,
  getConditionBadgeClasses,
  compressImageToWebP,
} from './inventoryUtils';
import { PhotoLightboxModal } from './PhotoLightboxModal';

interface EquipmentDetailModalProps {
  equipment: Equipment;
  movements: EquipmentMovement[];
  deliveryTerms?: DeliveryTerm[];
  currentUser: UserProfile;
  onClose: () => void;
  onOpenMovementModal: (equipment: Equipment) => void;
  onUpdateEquipmentPhotos: (equipmentId: string, newPhotos: string[]) => Promise<void>;
  onOpenDeliveryTermModal?: (term: DeliveryTerm | null, equipment: Equipment) => void;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  equipment,
  movements,
  deliveryTerms = [],
  currentUser,
  onClose,
  onOpenMovementModal,
  onUpdateEquipmentPhotos,
  onOpenDeliveryTermModal,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'history' | 'terms'>('overview');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const photos = equipment.photos || [];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setUploadingPhoto(true);

    try {
      const compressedWebP = await compressImageToWebP(file);
      const updatedPhotos = [...photos, compressedWebP];
      await onUpdateEquipmentPhotos(equipment.id, updatedPhotos);
    } catch (err: any) {
      console.error('Erro no upload de foto:', err);
      setPhotoError(err.message || 'Falha ao processar e comprimir foto.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const isAssigned = !!equipment.assignedTo?.assignedToName;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl p-6 sm:p-8 my-auto max-h-[92vh] flex flex-col transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800/60 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-2.5 rounded-2xl border ${
                isDark ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-slate-100 border-slate-200 text-emerald-600'
              }`}
            >
              {getCategoryIcon(equipment.category, 'w-6 h-6')}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {equipment.internalCode}
                </span>
                {equipment.assetTag && (
                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    Patrimônio: {equipment.assetTag}
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadgeClasses(
                    equipment.status
                  )}`}
                >
                  {STATUS_LABELS[equipment.status]}
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-bold truncate mt-1">{equipment.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMovementModal(equipment);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Movimentar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 pb-2 border-b border-slate-800/40 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Visão Geral & Custódia</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'photos'
                ? 'bg-emerald-500 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Fotos ({photos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico ({movements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'terms'
                ? 'bg-emerald-500 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Termos & Assinatura ({deliveryTerms.length})</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Highlight Cards: COM QUEM ESTÁ & ONDE ESTÁ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Com quem está */}
                <div
                  className={`p-4 rounded-2xl border ${
                    isAssigned
                      ? isDark
                        ? 'bg-blue-500/10 border-blue-500/20'
                        : 'bg-blue-50/80 border-blue-200'
                      : isDark
                      ? 'bg-slate-950/60 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                    <User className="w-4 h-4" />
                    <span>Com quem está</span>
                  </div>

                  {isAssigned ? (
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {equipment.assignedTo?.assignedToName}
                      </div>
                      {equipment.assignedTo?.assignedToEmail && (
                        <div className="text-xs font-mono text-slate-400 mt-0.5">
                          {equipment.assignedTo.assignedToEmail}
                        </div>
                      )}
                      <div className="text-xs text-slate-400 mt-1">
                        Setor: {equipment.assignedTo?.department || equipment.department}
                      </div>
                      {equipment.assignedTo?.assignedAt && (
                        <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Em custódia desde{' '}
                            {new Date(equipment.assignedTo.assignedAt).toLocaleDateString([], {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      Sem responsável atribuído no momento (Item disponível no estoque da TI).
                    </div>
                  )}
                </div>

                {/* Onde está */}
                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/60 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>Onde está fisicamente</span>
                  </div>

                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {equipment.location}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Unidade: {equipment.branch}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Setor alocado: {equipment.department}
                  </div>
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Especificações do Ativo
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Categoria:</span>
                    <span className="font-semibold">{CATEGORY_LABELS[equipment.category]}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Fabricante:</span>
                    <span className="font-semibold">{equipment.brand}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Modelo:</span>
                    <span className="font-semibold">{equipment.model}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Número de Série:</span>
                    <span className="font-mono font-semibold">
                      {equipment.serialNumber || 'Não informado'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Estado de Conservação:</span>
                    <span
                      className={`font-semibold inline-block px-2 py-0.5 rounded text-[11px] ${getConditionBadgeClasses(
                        equipment.condition
                      )}`}
                    >
                      {CONDITION_LABELS[equipment.condition]}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Data de Entrada no Estoque:</span>
                    <span className="font-semibold">
                      {equipment.entryDate
                        ? new Date(equipment.entryDate).toLocaleDateString([], {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : 'Não informada'}
                    </span>
                  </div>
                </div>

                {equipment.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-800/40 text-xs">
                    <span className="text-slate-400 block text-[11px] font-semibold mb-1">
                      Observações Técnicas / Configuração:
                    </span>
                    <p className="text-slate-300 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {equipment.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FOTOS */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Fotos opcionais para identificação física, etiqueta patrimonial ou conservação.
                </p>

                {/* Upload Button */}
                <label className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{uploadingPhoto ? 'Comprimindo...' : 'Adicionar Foto'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadingPhoto}
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>

              {photoError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
                  {photoError}
                </div>
              )}

              {photos.length === 0 ? (
                <div
                  className={`h-40 rounded-2xl border border-dashed flex flex-col items-center justify-center p-6 text-center ${
                    isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'
                  }`}
                >
                  <Camera className="w-8 h-8 opacity-40 mb-2" />
                  <span className="text-xs font-semibold">Nenhuma foto adicionada ainda.</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Fotos não são obrigatórias, mas facilitam o reconhecimento visual do aparelho.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setLightboxIndex(idx)}
                      className="group relative h-40 rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 cursor-pointer shadow-sm"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold">
                        <ZoomIn className="w-4 h-4" />
                        <span>Ampliar</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HISTÓRICO DE MOVIMENTAÇÕES (IMUTÁVEL) */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Registro imutável de todas as entregas, devoluções, trocas e manutenções deste equipamento.
              </div>

              {movements.length === 0 ? (
                <div
                  className={`h-32 rounded-2xl border border-dashed flex items-center justify-center text-xs ${
                    isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'
                  }`}
                >
                  Nenhuma movimentação registrada até o momento.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {movements.map((m) => (
                    <div key={m.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-slate-900 bg-emerald-500" />

                      <div
                        className={`p-3.5 rounded-2xl border text-xs ${
                          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {MOVEMENT_TYPE_LABELS[m.type] || m.type}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {new Date(m.timestamp).toLocaleString([], {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Assignee transition */}
                        {(m.previousAssignedTo || m.newAssignedTo) && (
                          <div className="mt-1.5 text-slate-300 flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-400">Responsável:</span>
                            <span>{m.previousAssignedTo || 'Sem responsável'}</span>
                            <span>→</span>
                            <span className="font-semibold text-white">
                              {m.newAssignedTo || 'Sem responsável'}
                            </span>
                          </div>
                        )}

                        {/* Location transition */}
                        <div className="mt-1 text-slate-300 flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400">Localização:</span>
                          <span className="truncate max-w-[160px]">{m.previousLocation || 'Estoque TI'}</span>
                          <span>→</span>
                          <span className="font-semibold text-white truncate max-w-[200px]">
                            {m.newLocation}
                          </span>
                        </div>

                        {/* Maintenance info */}
                        {m.maintenanceProvider && (
                          <div className="mt-1 text-amber-500 font-medium">
                            Assistência: {m.maintenanceProvider}{' '}
                            {m.expectedReturnDate && `(Previsão: ${m.expectedReturnDate})`}
                          </div>
                        )}

                        {/* Notes */}
                        {m.notes && (
                          <p className="mt-2 pt-1.5 border-t border-slate-800/40 text-slate-400 italic">
                            "{m.notes}"
                          </p>
                        )}

                        <div className="mt-2 text-[10px] text-slate-500">
                          Executado por: {m.performedByName} ({m.performedByEmail})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TERMOS DE ENTREGA & ASSINATURA */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Termos de Responsabilidade Emitidos
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Documentos oficiais de custódia e assinaturas digitais do colaborador
                  </p>
                </div>

                {onOpenDeliveryTermModal && (
                  <button
                    type="button"
                    onClick={() => onOpenDeliveryTermModal(null, equipment)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Novo Termo de Entrega</span>
                  </button>
                )}
              </div>

              {deliveryTerms.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-700/60 text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-400" />
                  <p className="text-xs font-semibold">Nenhum termo gerado para este equipamento ainda.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Gere um termo oficial ao entregar o aparelho para o colaborador assinar digitalmente.
                  </p>
                  {onOpenDeliveryTermModal && (
                    <button
                      type="button"
                      onClick={() => onOpenDeliveryTermModal(null, equipment)}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-semibold transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Gerar Termo de Entrega Agora</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {deliveryTerms.map((term) => (
                    <div
                      key={term.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400">
                              {term.protocol}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                term.status === 'assinado'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {term.status === 'assinado' ? '✓ Assinado' : 'Pendente de Assinatura'}
                            </span>
                          </div>

                          <div className="mt-1 text-xs text-slate-300 font-medium">
                            Colaborador: <span className="font-bold text-white">{term.recipientName}</span>
                            {term.recipientRole && ` (${term.recipientRole})`}
                          </div>

                          <div className="text-[11px] text-slate-500">
                            {term.recipientEmail} • {term.branch}
                          </div>
                        </div>

                        {onOpenDeliveryTermModal && (
                          <button
                            type="button"
                            onClick={() => onOpenDeliveryTermModal(term, equipment)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Visualizar / Imprimir</span>
                          </button>
                        )}
                      </div>

                      {term.signedAt && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/40 text-[11px] text-emerald-400/90 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            Assinado digitalmente em {new Date(term.signedAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <PhotoLightboxModal
          photos={photos}
          initialIndex={lightboxIndex}
          equipmentName={equipment.name}
          equipmentCode={equipment.internalCode}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
};
