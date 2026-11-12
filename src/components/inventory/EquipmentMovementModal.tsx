import React, { useState } from 'react';
import {
  X,
  ArrowRightLeft,
  User,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  Wrench,
  RotateCcw,
  ShieldAlert,
  Send,
  Bookmark,
} from 'lucide-react';
import {
  Equipment,
  EquipmentMovement,
  EquipmentStatus,
  EquipmentCondition,
  MovementType,
  UserProfile,
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  CONDITION_LABELS,
  MOVEMENT_TYPE_LABELS,
} from './inventoryUtils';

interface EquipmentMovementModalProps {
  equipment: Equipment;
  currentUser: UserProfile;
  onClose: () => void;
  onSaveMovement: (movement: EquipmentMovement, updatedEquipment: Equipment) => Promise<void>;
  onOpenDeliveryTerm?: (
    equipment: Equipment,
    recipientName: string,
    recipientEmail: string,
    department: string,
    branch: string
  ) => void;
}

export const EquipmentMovementModal: React.FC<EquipmentMovementModalProps> = ({
  equipment,
  currentUser,
  onClose,
  onSaveMovement,
  onOpenDeliveryTerm,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Determine available movement types based on current status
  const currentStatus = equipment.status;

  // Selected movement type
  const [selectedType, setSelectedType] = useState<MovementType>(() => {
    if (currentStatus === 'disponivel') return 'entrega';
    if (currentStatus === 'em_uso') return 'devolucao';
    if (currentStatus === 'em_manutencao') return 'retorno_manutencao';
    if (currentStatus === 'reservado') return 'entrega';
    return 'mudanca_local';
  });

  // Form Fields
  const [assignedToName, setAssignedToName] = useState(
    equipment.assignedTo?.assignedToName || ''
  );
  const [assignedToEmail, setAssignedToEmail] = useState(
    equipment.assignedTo?.assignedToEmail || ''
  );
  const [department, setDepartment] = useState(
    equipment.assignedTo?.department || equipment.department || 'Administrativo'
  );
  const [branch, setBranch] = useState(equipment.branch || 'Matriz - São Paulo');

  // CRITICAL RULE (from planning mode answers):
  // When devolucao is selected, do NOT prefill location. Require manual input!
  const [newLocation, setNewLocation] = useState(() => {
    if (currentStatus === 'em_uso') return ''; // Empty for devolucao
    return equipment.location || '';
  });

  const [condition, setCondition] = useState<EquipmentCondition>(equipment.condition);
  const [maintenanceProvider, setMaintenanceProvider] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [generateDeliveryTerm, setGenerateDeliveryTerm] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When type changes, adjust defaults
  const handleTypeChange = (type: MovementType) => {
    setSelectedType(type);
    setErrorMsg(null);
    if (type === 'devolucao') {
      // Must be typed manually as confirmed in planning
      setNewLocation('');
    } else if (type === 'mudanca_local') {
      setNewLocation('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validations
    if (selectedType === 'entrega' || selectedType === 'transferencia') {
      if (!assignedToName.trim()) {
        setErrorMsg('Por favor, informe o nome do colaborador responsável.');
        return;
      }
      if (!newLocation.trim()) {
        setErrorMsg('Informe a localização física onde o colaborador utilizará o equipamento.');
        return;
      }
    }

    if (selectedType === 'devolucao') {
      // Mandatory manual entry of storage location
      if (!newLocation.trim()) {
        setErrorMsg(
          'A localização exata no estoque (ex: Almoxarifado TI - Armário 01, Prateleira B) é de preenchimento obrigatório na devolução.'
        );
        return;
      }
    }

    if (selectedType === 'mudanca_local') {
      if (!newLocation.trim()) {
        setErrorMsg('Informe a nova localização física do equipamento.');
        return;
      }
    }

    if (selectedType === 'envio_manutencao') {
      if (!maintenanceProvider.trim()) {
        setErrorMsg('Informe o nome da assistência técnica ou fornecedor de manutenção.');
        return;
      }
      if (!notes.trim()) {
        setErrorMsg('Descreva o defeito ou motivo do envio para manutenção nas observações.');
        return;
      }
    }

    if (selectedType === 'baixa') {
      if (!notes.trim()) {
        setErrorMsg('A justificativa da baixa patrimonial é obrigatória.');
        return;
      }
    }

    setSubmitting(true);

    try {
      // Determine new status
      let nextStatus: EquipmentStatus = equipment.status;
      let nextAssignedTo = equipment.assignedTo;

      if (selectedType === 'entrega' || selectedType === 'transferencia') {
        nextStatus = 'em_uso';
        nextAssignedTo = {
          assignedToName: assignedToName.trim(),
          assignedToEmail: assignedToEmail.trim() || undefined,
          department: department.trim() || undefined,
          assignedAt: new Date().toISOString(),
          assignedByAdminEmail: currentUser.email,
        };
      } else if (selectedType === 'devolucao') {
        nextStatus = 'disponivel';
        nextAssignedTo = null; // Removed from custody
      } else if (selectedType === 'envio_manutencao') {
        nextStatus = 'em_manutencao';
        nextAssignedTo = null;
      } else if (selectedType === 'retorno_manutencao') {
        nextStatus = 'disponivel';
        nextAssignedTo = null;
      } else if (selectedType === 'reserva') {
        nextStatus = 'reservado';
        nextAssignedTo = assignedToName.trim()
          ? {
              assignedToName: `Reservado para: ${assignedToName.trim()}`,
              assignedToEmail: assignedToEmail.trim() || undefined,
              department: department.trim() || undefined,
              assignedAt: new Date().toISOString(),
              assignedByAdminEmail: currentUser.email,
            }
          : null;
      } else if (selectedType === 'baixa') {
        nextStatus = 'baixado';
        nextAssignedTo = null;
      }

      const nowIso = new Date().toISOString();

      const updatedEquipment: Equipment = {
        ...equipment,
        status: nextStatus,
        condition: condition,
        branch: branch.trim() || equipment.branch,
        department: selectedType === 'devolucao' ? 'Tecnologia da Informação' : department.trim() || equipment.department,
        location: newLocation.trim() || equipment.location,
        assignedTo: nextAssignedTo,
        updatedAt: nowIso,
        lastMovementAt: nowIso,
      };

      const movement: EquipmentMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        equipmentId: equipment.id,
        equipmentCode: `${equipment.internalCode}${equipment.assetTag ? ` (${equipment.assetTag})` : ''}`,
        equipmentName: equipment.name,
        type: selectedType,
        previousStatus: equipment.status,
        newStatus: nextStatus,
        previousAssignedTo: equipment.assignedTo?.assignedToName || null,
        newAssignedTo: nextAssignedTo?.assignedToName || null,
        previousLocation: equipment.location,
        newLocation: newLocation.trim() || equipment.location,
        previousBranch: equipment.branch,
        newBranch: branch.trim() || equipment.branch,
        performedByUid: currentUser.uid,
        performedByName: currentUser.name,
        performedByEmail: currentUser.email,
        timestamp: nowIso,
        notes: notes.trim() || undefined,
        maintenanceProvider: maintenanceProvider.trim() || undefined,
        expectedReturnDate: expectedReturnDate || undefined,
      };

      await onSaveMovement(movement, updatedEquipment);
      onClose();

      if (selectedType === 'entrega' && generateDeliveryTerm && onOpenDeliveryTerm) {
        onOpenDeliveryTerm(
          updatedEquipment,
          assignedToName.trim(),
          assignedToEmail.trim(),
          department.trim(),
          branch.trim()
        );
      }
    } catch (err: any) {
      console.error('Erro ao salvar movimentação:', err);
      setErrorMsg(err.message || 'Falha ao processar movimentação. Tente novamente.');
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
        className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl p-6 sm:p-8 my-auto transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800/60 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold leading-tight">
                  Registrar Movimentação de Ativo
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {equipment.internalCode} • {equipment.name}
                </p>
              </div>
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

        {/* Current State Summary Banner */}
        <div
          className={`mt-4 p-3 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div>
            <span className="text-slate-400">Situação Atual: </span>
            <span className="font-bold text-emerald-500">{STATUS_LABELS[equipment.status]}</span>
          </div>

          <div>
            <span className="text-slate-400">Com quem está: </span>
            <span className="font-semibold">
              {equipment.assignedTo?.assignedToName || 'Estoque TI'}
            </span>
          </div>

          <div>
            <span className="text-slate-400">Local Atual: </span>
            <span className="font-semibold">{equipment.location}</span>
          </div>
        </div>

        {/* Movement Type Selector */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Tipo de Movimentação:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('entrega')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === 'entrega'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : isDark
                    ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Entrega</span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">Para colaborador</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('devolucao')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === 'devolucao'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : isDark
                    ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Devolução</span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">Retorno ao estoque</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('transferencia')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === 'transferencia'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : isDark
                    ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transferência</span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">Outro responsável</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('mudanca_local')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === 'mudanca_local'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : isDark
                    ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Mudar Local</span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">Outra sala / rack</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('envio_manutencao')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === 'envio_manutencao'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : isDark
                    ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Manutenção</span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">Enviar para conserto</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('retorno_manutencao')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === 'retorno_manutencao'
                    ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                    : isDark
                    ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Retorno</span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">Voltou consertado</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('reserva')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === 'reserva'
                    ? 'bg-purple-500 text-white border-purple-500 shadow-sm'
                    : isDark
                    ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Reservar</span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">Para novo colaborador</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('baixa')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === 'baixa'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : isDark
                    ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Dar Baixa</span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">Sucata / Obsolescência</div>
              </button>
            </div>
          </div>

          {/* Error alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Conditional Fields based on selected type */}
          {(selectedType === 'entrega' || selectedType === 'transferencia' || selectedType === 'reserva') && (
            <div className="p-4 rounded-2xl border space-y-3 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                Dados do Responsável pela Custódia
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nome do Colaborador *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mariana Souza ou Roberto Dias"
                    value={assignedToName}
                    onChange={(e) => setAssignedToName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">E-mail Corporativo</label>
                  <input
                    type="email"
                    placeholder="colaborador@embrag.com.br"
                    value={assignedToEmail}
                    onChange={(e) => setAssignedToEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Setor / Departamento</label>
                  <input
                    type="text"
                    placeholder="Ex: Financeiro, TI, Comercial"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Unidade / Filial</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer"
                  >
                    <option value="Matriz - São Paulo">Matriz - São Paulo</option>
                    <option value="Filial - Curitiba">Filial - Curitiba</option>
                    <option value="Centro de Distribuição - Cajamar">Centro de Distribuição - Cajamar</option>
                    <option value="Remoto / Home Office">Remoto / Home Office</option>
                  </select>
                </div>
              </div>

              {selectedType === 'entrega' && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateDeliveryTerm}
                      onChange={(e) => setGenerateDeliveryTerm(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 block">
                        Gerar Termo de Entrega & Assinatura Digital do Colaborador
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Abre o termo oficial da Embrag pronto para assinatura na tela, envio de link ou impressão
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Maintenance Specific Fields */}
          {selectedType === 'envio_manutencao' && (
            <div className="p-4 rounded-2xl border space-y-3 bg-amber-500/5 border-amber-500/20">
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wide">
                Dados da Manutenção Externa
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Assistência Técnica / Fornecedor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PrintTech Serviços Ltda., Dell ProSupport"
                    value={maintenanceProvider}
                    onChange={(e) => setMaintenanceProvider(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-amber-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Previsão de Retorno</label>
                  <input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border outline-none bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* New Physical Location - CRITICAL RULE: Mandatory on Devolução */}
          <div>
            <label className="block text-xs font-bold mb-1">
              Nova Localização Física *
              {selectedType === 'devolucao' && (
                <span className="text-amber-500 text-[11px] font-normal ml-2">
                  (Obrigatório especificar a sala, armário ou prateleira onde o item foi guardado)
                </span>
              )}
            </label>
            <input
              type="text"
              required
              placeholder={
                selectedType === 'devolucao'
                  ? 'Ex: Almoxarifado TI - Armário 02, Prateleira B'
                  : selectedType === 'envio_manutencao'
                  ? 'Ex: Laboratório PrintTech (OS #9821)'
                  : 'Ex: 2º Andar - Estação 14 ou Sala 204'
              }
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            />
          </div>

          {/* Condition of Equipment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Estado de Conservação Conferido</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as EquipmentCondition)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                <option value="novo">Novo / Lacrado</option>
                <option value="excelente">Excelente</option>
                <option value="bom">Bom estado</option>
                <option value="regular">Regular / Marcas de uso</option>
                <option value="danificado">Danificado / Com defeito</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Administrador Executor</label>
              <input
                type="text"
                disabled
                value={`${currentUser.name} (${currentUser.email})`}
                className="w-full px-3 py-2 text-xs rounded-xl border bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-400"
              />
            </div>
          </div>

          {/* Justification & Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              Observações / Justificativa da Movimentação
              {selectedType === 'baixa' && <span className="text-rose-500 font-bold ml-1">*</span>}
            </label>
            <textarea
              rows={2}
              placeholder={
                selectedType === 'baixa'
                  ? 'Descreva a justificativa detalhada e autorização da baixa patrimonial...'
                  : 'Termo de entrega assinado, chamado relacionado, detalhes do acessório entregue...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            />
          </div>

          {/* Action buttons */}
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
                  <span>Gravando...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirmar Movimentação</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
