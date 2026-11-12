import React from 'react';
import {
  Laptop,
  Monitor,
  Cpu,
  Printer,
  Smartphone,
  Router,
  Network,
  Wifi,
  Radio,
  Server,
  Layers,
  Box,
} from 'lucide-react';
import {
  EquipmentCategory,
  EquipmentStatus,
  EquipmentCondition,
  MovementType,
} from '../../types';

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  notebook: 'Notebook',
  desktop: 'Desktop / Computador',
  monitor: 'Monitor',
  impressora: 'Impressora / Multifuncional',
  smartphone: 'Smartphone / Celular',
  roteador: 'Roteador',
  switch: 'Switch de Rede',
  access_point: 'Ponto de Acesso (AP)',
  antena: 'Antena / Rádio',
  servidor: 'Servidor',
  periferico: 'Periférico',
  outro: 'Outro Equipamento',
};

export const STATUS_LABELS: Record<EquipmentStatus, string> = {
  disponivel: 'Disponível no Estoque',
  em_uso: 'Em Uso',
  reservado: 'Reservado',
  em_manutencao: 'Em Manutenção',
  baixado: 'Baixado / Sucateado',
};

export const CONDITION_LABELS: Record<EquipmentCondition, string> = {
  novo: 'Novo / Lacrado',
  excelente: 'Excelente',
  bom: 'Bom estado',
  regular: 'Regular / Marcas de uso',
  danificado: 'Danificado / Defeito',
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  cadastro_inicial: 'Cadastro Inicial no Estoque',
  entrega: 'Entrega ao Colaborador',
  devolucao: 'Devolução ao Estoque',
  transferencia: 'Transferência de Responsável',
  mudanca_local: 'Mudança de Localização',
  envio_manutencao: 'Envio para Manutenção Externa',
  retorno_manutencao: 'Retorno de Manutenção',
  reserva: 'Reserva de Equipamento',
  baixa: 'Baixa Patrimonial Definitiva',
  edicao: 'Atualização de Cadastro',
};

export function getCategoryIcon(category: EquipmentCategory, className = 'w-5 h-5') {
  switch (category) {
    case 'notebook':
      return <Laptop className={className} />;
    case 'monitor':
      return <Monitor className={className} />;
    case 'desktop':
      return <Cpu className={className} />;
    case 'impressora':
      return <Printer className={className} />;
    case 'smartphone':
      return <Smartphone className={className} />;
    case 'roteador':
      return <Router className={className} />;
    case 'switch':
      return <Network className={className} />;
    case 'access_point':
      return <Wifi className={className} />;
    case 'antena':
      return <Radio className={className} />;
    case 'servidor':
      return <Server className={className} />;
    case 'periferico':
      return <Layers className={className} />;
    default:
      return <Box className={className} />;
  }
}

export function getStatusBadgeClasses(status: EquipmentStatus) {
  switch (status) {
    case 'disponivel':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'em_uso':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'reservado':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case 'em_manutencao':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'baixado':
      return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
    default:
      return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  }
}

export function getConditionBadgeClasses(condition: EquipmentCondition) {
  switch (condition) {
    case 'novo':
    case 'excelente':
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5';
    case 'bom':
      return 'text-blue-600 dark:text-blue-400 bg-blue-500/5';
    case 'regular':
      return 'text-amber-600 dark:text-amber-400 bg-amber-500/5';
    case 'danificado':
      return 'text-rose-600 dark:text-rose-400 bg-rose-500/5';
    default:
      return 'text-slate-600 dark:text-slate-400 bg-slate-500/5';
  }
}

/**
 * Comprime imagens no cliente utilizando Canvas e WebP (máx 800px, 70% qualidade)
 * Resulta em imagens nítidas de 25-45KB, perfeitamente integráveis nos documentos Firestore.
 */
export async function compressImageToWebP(file: File, maxWidth = 800, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      reject(new Error('Formato inválido. Envie imagens JPG, PNG ou WebP.'));
      return;
    }

    // Validar tamanho máximo do arquivo de entrada (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('A imagem original não pode exceder 10MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo selecionado.'));
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao processar dados da imagem.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Erro ao inicializar renderizador de imagem.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Exportar como WebP ou JPEG se WebP não for suportado
        try {
          const webpDataUrl = canvas.toDataURL('image/webp', quality);
          resolve(webpDataUrl);
        } catch {
          const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(jpegDataUrl);
        }
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
