import React from 'react';
import {
  User,
  MapPin,
  Clock,
  ArrowRightLeft,
  Eye,
  Edit,
  ZoomIn,
  ShieldCheck,
  Building,
  AlertTriangle,
} from 'lucide-react';
import { Equipment } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import {
  getCategoryIcon,
  CATEGORY_LABELS,
  STATUS_LABELS,
  CONDITION_LABELS,
  getStatusBadgeClasses,
  getConditionBadgeClasses,
} from './inventoryUtils';

interface EquipmentCardProps {
  equipment: Equipment;
  onViewDetails: (equipment: Equipment) => void;
  onMove: (equipment: Equipment) => void;
  onEdit: (equipment: Equipment) => void;
  onOpenPhotoLightbox: (photos: string[], initialIndex: number) => void;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  onViewDetails,
  onMove,
  onEdit,
  onOpenPhotoLightbox,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const hasPhoto = equipment.photos && equipment.photos.length > 0;
  const isAssigned = !!equipment.assignedTo?.assignedToName;

  return (
    <div
      onClick={() => onViewDetails(equipment)}
      className={`group relative flex flex-col rounded-2xl border p-4 transition-all duration-150 cursor-pointer ${
        isDark
          ? 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-slate-700 shadow-sm'
          : 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm'
      }`}
    >
      {/* Top Header Row: Category Icon + Code + Asset Tag */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`p-1.5 rounded-lg border ${
              isDark ? 'bg-slate-800/80 border-slate-700 text-emerald-400' : 'bg-slate-100 border-slate-200 text-emerald-600'
            }`}
            title={CATEGORY_LABELS[equipment.category]}
          >
            {getCategoryIcon(equipment.category, 'w-4 h-4')}
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {equipment.internalCode}
            </span>

            {equipment.assetTag && (
              <span
                className={`font-mono text-[11px] px-1.5 py-0.5 rounded border truncate ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
                title="Patrimônio Oficial"
              >
                {equipment.assetTag}
              </span>
            )}
          </div>
        </div>

        {/* Condition Badge */}
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border border-transparent ${getConditionBadgeClasses(
            equipment.condition
          )}`}
          title={`Conservação: ${CONDITION_LABELS[equipment.condition]}`}
        >
          {CONDITION_LABELS[equipment.condition]}
        </span>
      </div>

      {/* Media or Visual Header */}
      {hasPhoto ? (
        <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-slate-950/40 border border-slate-800/40">
          <img
            src={equipment.photos![0]}
            alt={equipment.name}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPhotoLightbox(equipment.photos!, 0);
            }}
            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer"
            title="Ampliar foto"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {equipment.photos!.length > 1 && (
            <span className="absolute top-2 right-2 text-[10px] font-mono font-bold bg-black/70 text-white px-1.5 py-0.5 rounded">
              +{equipment.photos!.length - 1} fotos
            </span>
          )}
        </div>
      ) : (
        <div
          className={`w-full h-20 rounded-xl mb-3 flex items-center justify-center border border-dashed transition-colors ${
            isDark ? 'border-slate-800/80 bg-slate-950/30 text-slate-600' : 'border-slate-200 bg-slate-50/50 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            {getCategoryIcon(equipment.category, 'w-5 h-5 opacity-50')}
            <span className="opacity-70">{CATEGORY_LABELS[equipment.category]}</span>
          </div>
        </div>
      )}

      {/* Equipment Name & Model */}
      <h4
        className={`text-xs sm:text-sm font-bold leading-tight line-clamp-1 transition-colors ${
          isDark ? 'text-slate-100 group-hover:text-emerald-300' : 'text-slate-900 group-hover:text-emerald-700'
        }`}
        title={equipment.name}
      >
        {equipment.name}
      </h4>

      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
        {equipment.brand} • {equipment.model}
        {equipment.serialNumber && ` • S/N: ${equipment.serialNumber}`}
      </p>

      {/* Highlight Box 1: COM QUEM ESTÁ */}
      <div
        className={`mt-3 p-2.5 rounded-xl border transition-colors ${
          isAssigned
            ? isDark
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
              : 'bg-blue-50/80 border-blue-200/80 text-blue-900'
            : isDark
            ? 'bg-slate-800/40 border-slate-800 text-slate-400'
            : 'bg-slate-100/70 border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider opacity-75">
          <User className="w-3 h-3 shrink-0" />
          <span>Com quem está:</span>
        </div>
        <div className="text-xs font-semibold mt-0.5 truncate">
          {isAssigned ? (
            equipment.assignedTo?.assignedToName
          ) : (
            <span className="italic font-normal">Sem responsável atribuído (Estoque TI)</span>
          )}
        </div>
        {equipment.assignedTo?.department && (
          <div className="text-[10px] opacity-75 truncate mt-0.5">
            Setor: {equipment.assignedTo.department}
          </div>
        )}
      </div>

      {/* Highlight Box 2: ONDE ESTÁ */}
      <div
        className={`mt-2 p-2.5 rounded-xl border transition-colors ${
          isDark
            ? 'bg-emerald-500/5 border-emerald-500/15 text-slate-300'
            : 'bg-emerald-50/50 border-emerald-200/60 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
          <MapPin className="w-3 h-3 shrink-0" />
          <span>Onde está:</span>
        </div>
        <div className="text-xs font-semibold mt-0.5 truncate text-slate-900 dark:text-white" title={equipment.location}>
          {equipment.location}
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-0.5">
          {equipment.branch} • {equipment.department}
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-800/60 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate" title="Última atualização">
          <Clock className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {new Date(equipment.updatedAt).toLocaleDateString([], {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
            })}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMove(equipment);
            }}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-emerald-400 hover:text-emerald-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-emerald-700 hover:text-emerald-800'
            }`}
            title="Movimentar equipamento (Entrega, Devolução, Transferência, Manutenção)"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Movimentar</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(equipment);
            }}
            className={`p-1.5 rounded-lg border text-slate-400 hover:text-slate-200 transition-colors cursor-pointer ${
              isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
            }`}
            title="Editar cadastro"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
