import React, { useState } from 'react';
import {
  X,
  Plus,
  Camera,
  Trash2,
  AlertCircle,
  Save,
  Laptop,
  CheckCircle2,
} from 'lucide-react';
import {
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
  EquipmentCondition,
  UserProfile,
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  CONDITION_LABELS,
  compressImageToWebP,
} from './inventoryUtils';

interface EquipmentFormModalProps {
  equipmentToEdit?: Equipment | null;
  existingEquipments: Equipment[];
  currentUser: UserProfile;
  onClose: () => void;
  onSave: (equipment: Equipment, isNew: boolean) => Promise<void>;
}

export const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  equipmentToEdit,
  existingEquipments,
  currentUser,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isEditing = !!equipmentToEdit;

  // Form states
  const [internalCode, setInternalCode] = useState(
    equipmentToEdit?.internalCode || `EQP-${Math.floor(100 + Math.random() * 900)}`
  );
  const [assetTag, setAssetTag] = useState(equipmentToEdit?.assetTag || '');
  const [name, setName] = useState(equipmentToEdit?.name || '');
  const [category, setCategory] = useState<EquipmentCategory>(
    equipmentToEdit?.category || 'notebook'
  );
  const [brand, setBrand] = useState(equipmentToEdit?.brand || '');
  const [model, setModel] = useState(equipmentToEdit?.model || '');
  const [serialNumber, setSerialNumber] = useState(equipmentToEdit?.serialNumber || '');
  const [status, setStatus] = useState<EquipmentStatus>(
    equipmentToEdit?.status || 'disponivel'
  );
  const [condition, setCondition] = useState<EquipmentCondition>(
    equipmentToEdit?.condition || 'excelente'
  );
  const [branch, setBranch] = useState(
    equipmentToEdit?.branch || 'Matriz - São Paulo'
  );
  const [department, setDepartment] = useState(
    equipmentToEdit?.department || 'Tecnologia da Informação'
  );
  const [location, setLocation] = useState(
    equipmentToEdit?.location || 'Almoxarifado TI - Armário 01'
  );

  // Custody fields
  const [assignedToName, setAssignedToName] = useState(
    equipmentToEdit?.assignedTo?.assignedToName || ''
  );
  const [assignedToEmail, setAssignedToEmail] = useState(
    equipmentToEdit?.assignedTo?.assignedToEmail || ''
  );
  const [assignedDepartment, setAssignedDepartment] = useState(
    equipmentToEdit?.assignedTo?.department || ''
  );

  const [entryDate, setEntryDate] = useState(
    equipmentToEdit?.entryDate || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(equipmentToEdit?.notes || '');
  const [photos, setPhotos] = useState<string[]>(equipmentToEdit?.photos || []);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle Photo Add
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setUploadingPhoto(true);

    try {
      const compressedWebP = await compressImageToWebP(file);
      setPhotos((prev) => [...prev, compressedWebP]);
    } catch (err: any) {
      console.error('Erro na compressão de imagem:', err);
      setErrorMsg(err.message || 'Falha ao processar foto.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Validar campos essenciais
    if (!internalCode.trim()) {
      setErrorMsg('O código interno do equipamento é obrigatório.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Informe o nome ou descrição do equipamento.');
      return;
    }
    if (!brand.trim() || !model.trim()) {
      setErrorMsg('Fabricante e modelo são obrigatórios.');
      return;
    }
    if (!location.trim()) {
      setErrorMsg('A localização física (sala, armário, rack) é obrigatória.');
      return;
    }

    // 2. Prevenção de duplicidade
    const normalizedCode = internalCode.trim().toUpperCase();
    const normalizedAsset = assetTag.trim().toUpperCase();
    const normalizedSerial = serialNumber.trim().toUpperCase();

    const duplicateCode = existingEquipments.find(
      (eq) =>
        eq.id !== equipmentToEdit?.id &&
        eq.internalCode.trim().toUpperCase() === normalizedCode
    );
    if (duplicateCode) {
      setErrorMsg(`O código interno "${internalCode}" já está cadastrado no equipamento ${duplicateCode.name}.`);
      return;
    }

    if (normalizedAsset) {
      const duplicateAsset = existingEquipments.find(
        (eq) =>
          eq.id !== equipmentToEdit?.id &&
          eq.assetTag &&
          eq.assetTag.trim().toUpperCase() === normalizedAsset
      );
      if (duplicateAsset) {
        setErrorMsg(`O número de patrimônio "${assetTag}" já pertence a outro equipamento (${duplicateAsset.name}).`);
        return;
      }
    }

    if (normalizedSerial) {
      const duplicateSerial = existingEquipments.find(
        (eq) =>
          eq.id !== equipmentToEdit?.id &&
          eq.serialNumber &&
          eq.serialNumber.trim().toUpperCase() === normalizedSerial
      );
      if (duplicateSerial) {
        setErrorMsg(`O número de série "${serialNumber}" já está cadastrado em outro equipamento (${duplicateSerial.name}).`);
        return;
      }
    }

    // 3. Validação de situação e responsável
    if (status === 'em_uso') {
      if (!assignedToName.trim()) {
        setErrorMsg('Para equipamentos "Em Uso", é obrigatório informar o nome do colaborador responsável.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const nowIso = new Date().toISOString();

      let assignedToData = null;
      if (status === 'em_uso' && assignedToName.trim()) {
        assignedToData = {
          assignedToName: assignedToName.trim(),
          assignedToEmail: assignedToEmail.trim() || undefined,
          department: assignedDepartment.trim() || department,
          assignedAt: equipmentToEdit?.assignedTo?.assignedAt || nowIso,
          assignedByAdminEmail: currentUser.email,
        };
      } else if (status === 'reservado' && assignedToName.trim()) {
        assignedToData = {
          assignedToName: assignedToName.trim(),
          assignedToEmail: assignedToEmail.trim() || undefined,
          department: assignedDepartment.trim() || department,
          assignedAt: equipmentToEdit?.assignedTo?.assignedAt || nowIso,
          assignedByAdminEmail: currentUser.email,
        };
      }

      const equipmentPayload: Equipment = {
        id: equipmentToEdit?.id || `eqp-${Date.now()}`,
        internalCode: internalCode.trim().toUpperCase(),
        assetTag: assetTag.trim() || undefined,
        name: name.trim(),
        category,
        brand: brand.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim() || undefined,
        status,
        condition,
        branch: branch.trim(),
        department: department.trim(),
        location: location.trim(),
        assignedTo: assignedToData,
        entryDate,
        notes: notes.trim() || undefined,
        photos: photos.length > 0 ? photos : undefined,
        createdAt: equipmentToEdit?.createdAt || nowIso,
        updatedAt: nowIso,
        lastMovementAt: equipmentToEdit?.lastMovementAt || nowIso,
      };

      await onSave(equipmentPayload, !isEditing);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar equipamento:', err);
      setErrorMsg(err.message || 'Falha ao salvar equipamento. Verifique sua conexão.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {isEditing ? 'Editar Equipamento' : 'Novo Equipamento no Estoque'}
              </h3>
              <p className="text-xs text-slate-400">
                Cadastro patrimonial e controle de custódia corporativa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
          {/* Section 1: Identificação Básica */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              1. Identificação & Patrimônio
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Código Interno Único *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: EQP-101 ou NB-004"
                  value={internalCode}
                  onChange={(e) => setInternalCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Número de Patrimônio
                  <span className="text-slate-400 font-normal ml-1">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: PAT-04190"
                  value={assetTag}
                  onChange={(e) => setAssetTag(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Categoria *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold mb-1">
                Nome ou Descrição Comercial do Equipamento *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Notebook Dell Latitude 5430 - Core i7 16GB"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Fabricante / Marca *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dell, Lenovo, Cisco, HP"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Modelo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Latitude 5430, Catalyst 2960"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Número de Série (S/N)</label>
                <input
                  type="text"
                  placeholder="Ex: 8FK9Z23"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Situação & Conservação */}
          <div className="pt-2 border-t border-slate-800/40">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              2. Situação Operacional & Estado de Conservação
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Situação Atual *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  <option value="disponivel">Disponível no Estoque</option>
                  <option value="em_uso">Em Uso (com Colaborador)</option>
                  <option value="reservado">Reservado</option>
                  <option value="em_manutencao">Em Manutenção</option>
                  <option value="baixado">Baixado / Sucateado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Estado de Conservação *</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as EquipmentCondition)}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  <option value="novo">Novo / Lacrado</option>
                  <option value="excelente">Excelente</option>
                  <option value="bom">Bom estado</option>
                  <option value="regular">Regular / Marcas de uso</option>
                  <option value="danificado">Danificado / Com defeito</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Responsável / Custódia (se em uso ou reservado) */}
          {(status === 'em_uso' || status === 'reservado') && (
            <div className="p-4 rounded-2xl border space-y-3 bg-blue-50/50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Responsável Atual pela Custódia (Obrigatório para Em Uso)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nome do Responsável *</label>
                  <input
                    type="text"
                    required={status === 'em_uso'}
                    placeholder="Ex: Mariana Souza"
                    value={assignedToName}
                    onChange={(e) => setAssignedToName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">E-mail Corporativo</label>
                  <input
                    type="email"
                    placeholder="mariana.souza@embrag.com.br"
                    value={assignedToEmail}
                    onChange={(e) => setAssignedToEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Setor do Colaborador</label>
                  <input
                    type="text"
                    placeholder="Ex: Financeiro"
                    value={assignedDepartment}
                    onChange={(e) => setAssignedDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Onde Está (Localização Física) */}
          <div className="pt-2 border-t border-slate-800/40">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              3. Onde Está (Localização Física)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Unidade / Filial *</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  <option value="Matriz - São Paulo">Matriz - São Paulo</option>
                  <option value="Filial - Curitiba">Filial - Curitiba</option>
                  <option value="Centro de Distribuição - Cajamar">Centro de Distribuição - Cajamar</option>
                  <option value="Remoto / Home Office">Remoto / Home Office</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Setor de Alocação *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: TI, Financeiro, Logística"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Data de Entrada</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold mb-1">
                Ponto Físico Exato (Sala, Estação, Armário, Rack) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 2º Andar - Estação FIN-04 ou Almoxarifado TI - Armário 01, Gaveta 02"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Section 5: Fotos Opcionais */}
          <div className="pt-2 border-t border-slate-800/40">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                4. Fotos Opcionais ({photos.length})
              </h4>

              <label className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                <Camera className="w-3.5 h-3.5 text-emerald-500" />
                <span>{uploadingPhoto ? 'Comprimindo...' : 'Adicionar Foto'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingPhoto}
                  onChange={handlePhotoSelect}
                />
              </label>
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {photos.map((p, idx) => (
                  <div
                    key={idx}
                    className="relative group h-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-950"
                  >
                    <img src={p} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600/90 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                      title="Remover foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Nenhuma foto anexada. O sistema exibirá o ícone da categoria automaticamente.
              </p>
            )}
          </div>

          {/* Section 6: Observações Técnicas */}
          <div className="pt-2 border-t border-slate-800/40">
            <label className="block text-xs font-semibold mb-1">
              Observações Técnicas / Histórico Prévio
            </label>
            <textarea
              rows={2}
              placeholder="Especificações adicionais (RAM, armazenamento, acessórios, etc.)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800/60 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Equipamento'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
