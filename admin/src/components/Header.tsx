import React from 'react';
import { ShieldCheck, Menu } from 'lucide-react';
import { Logo } from './Logo';

interface HeaderProps {
  onOpenMenu: () => void; // abre o menu lateral no celular
}

export const Header: React.FC<HeaderProps> = ({ onOpenMenu }) => {
  return (
    <header className="h-16 bg-[#0e0d0b] border-b border-[#2c2818] px-4 md:px-8 flex items-center justify-between gap-3 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMenu}
          className="md:hidden p-2 rounded-full bg-white/5 text-gray-200 cursor-pointer shrink-0"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Logo className="h-8 md:hidden" />
        <div className="hidden md:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs text-gray-400 font-medium">Servidor conectado</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/40 text-xs font-bold text-[#e8c766] shrink-0">
        <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
        <span className="hidden sm:inline">ADMINISTRADOR</span>
        <span className="sm:hidden">ADMIN</span>
      </div>
    </header>
  );
};
