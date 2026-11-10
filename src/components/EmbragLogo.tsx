import React from 'react';

export type LogoSize = 'login' | 'sidebar' | 'compact' | 'icon';

interface EmbragLogoProps {
  theme?: 'dark' | 'light';
  size?: LogoSize;
  className?: string;
  showProductBadge?: boolean;
}

export const EmbragLogo: React.FC<EmbragLogoProps> = ({
  theme = 'dark',
  size = 'sidebar',
  className = '',
  showProductBadge = false,
}) => {
  // Use light logo (dark text + green symbol) on light theme,
  // and dark logo (white text + green symbol) on dark theme. Both are 100% transparent.
  const logoUrl =
    theme === 'light' ? '/assets/embrag-logo-light.png' : '/assets/embrag-logo-dark.png';

  // Dimension mapping adhering to guidelines:
  // Login: 240px - 260px width
  // Sidebar expanded: 180px - 200px width
  // Compact / icon: responsive for collapsed sidebar and mobile
  const sizeClasses: Record<LogoSize, string> = {
    login: 'w-[240px] sm:w-[270px] h-auto object-contain',
    sidebar: 'w-[185px] sm:w-[200px] h-auto object-contain',
    compact: 'h-8 sm:h-9 w-auto object-contain',
    icon: 'w-8 h-8 object-contain',
  };

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <img
        src={logoUrl}
        alt="Embrag"
        className={`${sizeClasses[size]} transition-all duration-150 select-none`}
        loading="eager"
      />

      {showProductBadge && (
        <div className="flex items-center gap-1.5 mt-1.5 pl-0.5">
          <span
            className={`text-xs font-bold tracking-tight uppercase ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            Helpdesk
          </span>
          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            Corporativo
          </span>
        </div>
      )}
    </div>
  );
};
