import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Download,
  Search,
  Filter,
  CheckCircle2,
  UserCheck,
  Wrench,
  ShieldAlert,
  Bookmark,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  RotateCcw,
  Clock,
  ArrowRightLeft,
  Eye,
  Edit,
  MapPin,
  User,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import {
  Equipment,
  EquipmentMovement,
  EquipmentStatus,
  EquipmentCategory,
  UserProfile,
  DeliveryTerm,
  GoogleAppsScriptSyncConfig,
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  CONDITION_LABELS,
  getStatusBadgeClasses,
  getConditionBadgeClasses,
  getCategoryIcon,
} from './inventoryUtils';
import { EquipmentCard } from './EquipmentCard';
import { EquipmentFormModal } from './EquipmentFormModal';
import { EquipmentMovementModal } from './EquipmentMovementModal';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { DeliveryTermModal } from './DeliveryTermModal';
import { AppsScriptSyncModal } from './AppsScriptSyncModal';

interface TechInventoryViewProps {
  equipments: Equipment[];
  movements: EquipmentMovement[];
  deliveryTerms?: DeliveryTerm[];
  gasConfig?: GoogleAppsScriptSyncConfig;
  currentUser: UserProfile;
  onSaveEquipment: (equipment: Equipment, isNew: boolean) => Promise<void>;
  onSaveMovement: (movement: EquipmentMovement, updatedEquipment: Equipment) => Promise<void>;
  onUpdateEquipmentPhotos: (equipmentId: string, newPhotos: string[]) => Promise<void>;
  onSaveDeliveryTerm?: (term: DeliveryTerm) => Promise<void> | void;
  onSaveGasConfig?: (config: GoogleAppsScriptSyncConfig) => void;
  onImportEquipments?: (imported: Partial<Equipment>[]) => Promise<number>;
}

export const TechInventoryView: React.FC<TechInventoryViewProps> = ({
  equipments,
  movements,
  deliveryTerms = [],
  gasConfig,
  currentUser,
  onSaveEquipment,
  onSaveMovement,
  onUpdateEquipmentPhotos,
  onSaveDeliveryTerm,
  onSaveGasConfig,
  onImportEquipments,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Security Gate: Ensure only Admins access this view
  const isAdmin = currentUser.role === 'admin';

  // Presentation Mode: Default is "cards" (Quadro de cartões visuais agrupados por situação)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);

  const [selectedEquipmentForDetails, setSelectedEquipmentForDetails] = useState<Equipment | null>(null);
  const [selectedEquipmentForMovement, setSelectedEquipmentForMovement] = useState<Equipment | null>(null);

  // Delivery Terms & Google Apps Script Modal states
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [selectedTermForModal, setSelectedTermForModal] = useState<DeliveryTerm | null>(null);
  const [selectedEquipmentForTermModal, setSelectedEquipmentForTermModal] = useState<Equipment | null>(null);

  // Lightbox state
  const [lightboxData, setLightboxData] = useState<{ photos: string[]; index: number } | null>(null);

  // 1. KPI Indicators Calculations
  const stats = useMemo(() => {
    const total = equipments.length;
    const disponiveis = equipments.filter((e) => e.status === 'disponivel').length;
    const emUso = equipments.filter((e) => e.status === 'em_uso').length;
    const emManutencao = equipments.filter((e) => e.status === 'em_manutencao').length;
    const baixados = equipments.filter((e) => e.status === 'baixado').length;
    const reservados = equipments.filter((e) => e.status === 'reservado').length;

    return { total, disponiveis, emUso, emManutencao, baixados, reservados };
  }, [equipments]);

  // Unique branches and departments for dynamic filter options
  const uniqueBranches = useMemo(() => {
    const set = new Set<string>();
    equipments.forEach((e) => {
      if (e.branch) set.add(e.branch);
    });
    return Array.from(set);
  }, [equipments]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    equipments.forEach((e) => {
      if (e.department) set.add(e.department);
      if (e.assignedTo?.department) set.add(e.assignedTo.department);
    });
    return Array.from(set);
  }, [equipments]);

  // 2. Filtered Equipments
  const filteredEquipments = useMemo(() => {
    return equipments.filter((item) => {
      // Search text (code, asset, name, model, serial, responsible, location)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const codeMatch = item.internalCode.toLowerCase().includes(q);
        const assetMatch = item.assetTag?.toLowerCase().includes(q) || false;
        const nameMatch = item.name.toLowerCase().includes(q);
        const brandMatch = item.brand.toLowerCase().includes(q);
        const modelMatch = item.model.toLowerCase().includes(q);
        const serialMatch = item.serialNumber?.toLowerCase().includes(q) || false;
        const respMatch = item.assignedTo?.assignedToName.toLowerCase().includes(q) || false;
        const locMatch = item.location.toLowerCase().includes(q);

        if (
          !codeMatch &&
          !assetMatch &&
          !nameMatch &&
          !brandMatch &&
          !modelMatch &&
          !serialMatch &&
          !respMatch &&
          !locMatch
        ) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Category
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      // Branch
      if (branchFilter !== 'all' && item.branch !== branchFilter) {
        return false;
      }

      // Department
      if (
        departmentFilter !== 'all' &&
        item.department !== departmentFilter &&
        item.assignedTo?.department !== departmentFilter
      ) {
        return false;
      }

      return true;
    });
  }, [equipments, searchTerm, statusFilter, categoryFilter, branchFilter, departmentFilter]);

  // 3. Export to CSV
  const handleExportCSV = () => {
    if (!isAdmin) return;

    const headers = [
      'Código Interno',
      'Patrimônio',
      'Nome do Equipamento',
      'Categoria',
      'Fabricante',
      'Modelo',
      'Número de Série',
      'Situação',
      'Estado de Conservação',
      'Com Quem Está (Responsável)',
      'E-mail Responsável',
      'Unidade / Filial',
      'Setor',
      'Localização Física Exata',
      'Data de Entrada',
      'Última Movimentação',
    ];

    const rows = filteredEquipments.map((eq) => [
      `"${eq.internalCode}"`,
      `"${eq.assetTag || ''}"`,
      `"${eq.name.replace(/"/g, '""')}"`,
      `"${CATEGORY_LABELS[eq.category]}"`,
      `"${eq.brand}"`,
      `"${eq.model}"`,
      `"${eq.serialNumber || ''}"`,
      `"${STATUS_LABELS[eq.status]}"`,
      `"${CONDITION_LABELS[eq.condition]}"`,
      `"${eq.assignedTo?.assignedToName || 'Sem responsável / Estoque TI'}"`,
      `"${eq.assignedTo?.assignedToEmail || ''}"`,
      `"${eq.branch}"`,
      `"${eq.department}"`,
      `"${eq.location.replace(/"/g, '""')}"`,
      `"${eq.entryDate || ''}"`,
      `"${new Date(eq.updatedAt).toLocaleDateString()}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Estoque_Tecnologico_Embrag_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Grouped status buckets for the Card Board View
  const statusBuckets: { id: EquipmentStatus; label: string; dot: string }[] = [
    { id: 'disponivel', label: 'Disponíveis no Estoque', dot: 'bg-emerald-500' },
    { id: 'em_uso', label: 'Em Uso com Colaborador', dot: 'bg-blue-500' },
    { id: 'reservado', label: 'Reservados', dot: 'bg-purple-500' },
    { id: 'em_manutencao', label: 'Em Manutenção', dot: 'bg-amber-500' },
    { id: 'baixado', label: 'Baixados / Sucata', dot: 'bg-slate-400' },
  ];

  // If not admin, show security block
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Acesso Restrito ao Administrador</h2>
        <p className="text-sm text-slate-400 max-w-md mt-2">
          A aba de Estoque Tecnológico e controle de custódia patrimonial é restrita
          exclusivamente aos Administradores do Helpdesk.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div
          className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Ativos</span>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-mono font-bold mt-2 text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Parque cadastrado</div>
        </div>

        {/* Disponíveis */}
        <div
          className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span>Disponíveis</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-mono font-bold mt-2 text-emerald-600 dark:text-emerald-400">
            {stats.disponiveis}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Prontos no estoque</div>
        </div>

        {/* Em Uso */}
        <div
          className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <span>Em Uso</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-mono font-bold mt-2 text-blue-600 dark:text-blue-400">
            {stats.emUso}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Sob custódia ativa</div>
        </div>

        {/* Reservados */}
        <div
          className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 text-xs font-semibold">
            <span>Reservados</span>
            <Bookmark className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-mono font-bold mt-2 text-purple-600 dark:text-purple-400">
            {stats.reservados}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Onboarding / Projeto</div>
        </div>

        {/* Em Manutenção */}
        <div
          className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <span>Manutenção</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-mono font-bold mt-2 text-amber-600 dark:text-amber-400">
            {stats.emManutencao}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Em assistência técnica</div>
        </div>

        {/* Baixados */}
        <div
          className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Baixados</span>
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-mono font-bold mt-2 text-slate-500">
            {stats.baixados}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Histórico contábil</div>
        </div>
      </div>

      {/* Control Bar: Search + Filters + Actions */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por patrimônio, código, modelo, responsável, série ou local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Center: Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`text-xs px-2.5 py-2 rounded-xl border outline-none cursor-pointer transition-colors ${
              isDark ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">Todas as Situações</option>
            <option value="disponivel">Disponível no Estoque</option>
            <option value="em_uso">Em Uso com Colaborador</option>
            <option value="reservado">Reservado</option>
            <option value="em_manutencao">Em Manutenção</option>
            <option value="baixado">Baixado / Sucata</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`text-xs px-2.5 py-2 rounded-xl border outline-none cursor-pointer transition-colors ${
              isDark ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">Todas as Categorias</option>
            {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          {/* Branch filter */}
          {uniqueBranches.length > 0 && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className={`text-xs px-2.5 py-2 rounded-xl border outline-none cursor-pointer transition-colors ${
                isDark ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">Todas as Filiais</option>
              {uniqueBranches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}

          {/* View Mode Toggle: Cards vs Table */}
          <div
            className={`flex items-center p-1 rounded-xl border ${
              isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Quadro de Cartões por Situação (Padrão)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quadro</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Visualização em Tabela Detalhada"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabela</span>
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Google Apps Script Integration */}
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-emerald-400 hover:bg-slate-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-xs'
            }`}
            title="Sincronização e integração com Google Apps Script / Planilha Embrag"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Google Apps Script</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* Delivery Terms */}
          <button
            type="button"
            onClick={() => {
              setSelectedTermForModal(null);
              setSelectedEquipmentForTermModal(null);
              setIsTermModalOpen(true);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-indigo-400 hover:bg-slate-800'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 shadow-xs'
            }`}
            title="Termos de Entrega & Assinaturas Digitais da Embrag"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Termos ({deliveryTerms.length})</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'
            }`}
            title="Exportar lista filtrada para arquivo CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Exportar CSV</span>
          </button>

          {/* New Equipment Button */}
          <button
            type="button"
            onClick={() => {
              setEquipmentToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Equipamento</span>
          </button>
        </div>
      </div>

      {/* Main Content: Cards Board View OR Detailed Table */}
      {viewMode === 'cards' ? (
        /* =======================================================
           VIEW 1: QUADRO DE CARTÕES VISUAIS AGRUPADOS POR SITUAÇÃO
           (Conforme escolha direta do usuário no planejamento)
           ======================================================= */
        <div className="space-y-6">
          {statusBuckets.map((bucket) => {
            const bucketEquipments = filteredEquipments.filter(
              (e) => e.status === bucket.id
            );

            // If a specific status filter is active, only show the matching bucket
            if (statusFilter !== 'all' && statusFilter !== bucket.id) {
              return null;
            }

            return (
              <div key={bucket.id} className="space-y-3">
                {/* Bucket Section Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${bucket.dot}`} />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      {bucket.label}
                    </h3>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {bucketEquipments.length}
                    </span>
                  </div>
                </div>

                {/* Cards Grid */}
                {bucketEquipments.length === 0 ? (
                  <div
                    className={`p-6 rounded-2xl border border-dashed text-center text-xs ${
                      isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'
                    }`}
                  >
                    Nenhum equipamento nesta situação no momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {bucketEquipments.map((equipment) => (
                      <EquipmentCard
                        key={equipment.id}
                        equipment={equipment}
                        onViewDetails={(eq) => setSelectedEquipmentForDetails(eq)}
                        onMove={(eq) => setSelectedEquipmentForMovement(eq)}
                        onEdit={(eq) => {
                          setEquipmentToEdit(eq);
                          setIsFormOpen(true);
                        }}
                        onOpenPhotoLightbox={(photos, idx) =>
                          setLightboxData({ photos, index: idx })
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* =======================================================
           VIEW 2: TABELA COMPLETA COM MINIATURAS E COLUNAS DETALHADAS
           ======================================================= */
        <div
          className={`w-full rounded-2xl border overflow-hidden shadow-xs transition-colors ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`border-b select-none font-bold text-slate-400 uppercase tracking-wider text-[11px] ${
                    isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <th className="py-3 px-3.5 w-14 text-center">Ativo</th>
                  <th className="py-3 px-3">Código / Patrimônio</th>
                  <th className="py-3 px-3">Equipamento & Modelo</th>
                  <th className="py-3 px-3">Situação</th>
                  <th className="py-3 px-3">Com Quem Está</th>
                  <th className="py-3 px-3">Onde Está (Local Físico)</th>
                  <th className="py-3 px-3">Última Movimentação</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 dark:divide-slate-800">
                {filteredEquipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      Nenhum equipamento encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredEquipments.map((eq) => {
                    const hasPhoto = eq.photos && eq.photos.length > 0;
                    const isAssigned = !!eq.assignedTo?.assignedToName;

                    return (
                      <tr
                        key={eq.id}
                        onClick={() => setSelectedEquipmentForDetails(eq)}
                        className={`transition-colors cursor-pointer group ${
                          isDark
                            ? 'hover:bg-slate-850'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Thumbnail / Icon */}
                        <td className="py-2.5 px-3.5 text-center">
                          {hasPhoto ? (
                            <img
                              src={eq.photos![0]}
                              alt=""
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxData({ photos: eq.photos!, index: 0 });
                              }}
                              className="w-9 h-9 rounded-lg object-cover mx-auto ring-1 ring-slate-700 hover:ring-emerald-500 transition-all cursor-zoom-in"
                            />
                          ) : (
                            <div
                              className={`w-9 h-9 rounded-lg border mx-auto flex items-center justify-center ${
                                isDark
                                  ? 'bg-slate-800 border-slate-700 text-emerald-400'
                                  : 'bg-slate-100 border-slate-200 text-emerald-600'
                              }`}
                            >
                              {getCategoryIcon(eq.category, 'w-4 h-4')}
                            </div>
                          )}
                        </td>

                        {/* Code + Asset Tag */}
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {eq.internalCode}
                          </div>
                          {eq.assetTag && (
                            <div className="font-mono text-[10px] text-slate-400">
                              {eq.assetTag}
                            </div>
                          )}
                        </td>

                        {/* Equipment Name, Brand, Model */}
                        <td className="py-2.5 px-3 max-w-[220px]">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {eq.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {eq.brand} • {eq.model}
                          </div>
                        </td>

                        {/* Status + Condition */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadgeClasses(
                              eq.status
                            )}`}
                          >
                            {STATUS_LABELS[eq.status]}
                          </span>
                          <div
                            className={`text-[10px] font-medium mt-0.5 ${getConditionBadgeClasses(
                              eq.condition
                            )}`}
                          >
                            {CONDITION_LABELS[eq.condition]}
                          </div>
                        </td>

                        {/* Com Quem Está */}
                        <td className="py-2.5 px-3 max-w-[200px]">
                          {isAssigned ? (
                            <div>
                              <div className="font-semibold text-blue-600 dark:text-blue-400 truncate flex items-center gap-1">
                                <User className="w-3 h-3 shrink-0" />
                                <span>{eq.assignedTo?.assignedToName}</span>
                              </div>
                              {eq.assignedTo?.department && (
                                <div className="text-[10px] text-slate-400 truncate">
                                  {eq.assignedTo.department}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-slate-400 italic text-[11px]">
                              Sem responsável (Estoque)
                            </div>
                          )}
                        </td>

                        {/* Onde Está */}
                        <td className="py-2.5 px-3 max-w-[220px]">
                          <div className="font-medium text-slate-900 dark:text-slate-200 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{eq.location}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {eq.branch}
                          </div>
                        </td>

                        {/* Last Movement */}
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                          {new Date(eq.updatedAt).toLocaleDateString([], {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEquipmentForMovement(eq);
                              }}
                              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                                isDark
                                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-emerald-400'
                                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-emerald-700'
                              }`}
                              title="Movimentar"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Movimentar</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEquipmentToEdit(eq);
                                setIsFormOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal: Create / Edit */}
      {isFormOpen && (
        <EquipmentFormModal
          equipmentToEdit={equipmentToEdit}
          existingEquipments={equipments}
          currentUser={currentUser}
          onClose={() => setIsFormOpen(false)}
          onSave={onSaveEquipment}
        />
      )}

      {/* Movement Modal */}
      {selectedEquipmentForMovement && (
        <EquipmentMovementModal
          equipment={selectedEquipmentForMovement}
          currentUser={currentUser}
          onClose={() => setSelectedEquipmentForMovement(null)}
          onSaveMovement={onSaveMovement}
          onOpenDeliveryTerm={(eq) => {
            setSelectedEquipmentForTermModal(eq);
            setSelectedTermForModal(null);
            setIsTermModalOpen(true);
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedEquipmentForDetails && (
        <EquipmentDetailModal
          equipment={selectedEquipmentForDetails}
          movements={movements.filter(
            (m) => m.equipmentId === selectedEquipmentForDetails.id
          )}
          deliveryTerms={deliveryTerms.filter(
            (t) => t.equipmentId === selectedEquipmentForDetails.id
          )}
          currentUser={currentUser}
          onClose={() => setSelectedEquipmentForDetails(null)}
          onOpenMovementModal={(eq) => setSelectedEquipmentForMovement(eq)}
          onUpdateEquipmentPhotos={onUpdateEquipmentPhotos}
          onOpenDeliveryTermModal={(term, eq) => {
            setSelectedTermForModal(term);
            setSelectedEquipmentForTermModal(eq);
            setIsTermModalOpen(true);
          }}
        />
      )}

      {/* Delivery Term Modal */}
      {isTermModalOpen && (
        <DeliveryTermModal
          isOpen={isTermModalOpen}
          onClose={() => setIsTermModalOpen(false)}
          term={selectedTermForModal}
          equipment={selectedEquipmentForTermModal || equipments[0]}
          currentUser={currentUser}
          onSaveTerm={(term) => {
            if (onSaveDeliveryTerm) onSaveDeliveryTerm(term);
          }}
        />
      )}

      {/* Google Apps Script Integration Modal */}
      {isSyncModalOpen && gasConfig && (
        <AppsScriptSyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          config={gasConfig}
          onSaveConfig={(cfg) => {
            if (onSaveGasConfig) onSaveGasConfig(cfg);
          }}
          equipments={equipments}
          onImportEquipments={onImportEquipments || (async () => 0)}
          currentUser={currentUser}
        />
      )}

      {/* Lightbox Modal */}
      {lightboxData && (
        <PhotoLightboxModal
          photos={lightboxData.photos}
          initialIndex={lightboxData.index}
          equipmentName="Ativo Tecnológico"
          equipmentCode="Foto do Equipamento"
          onClose={() => setLightboxData(null)}
        />
      )}
    </div>
  );
};
