import React from 'react';
import { ShieldCheck, User } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 bg-[#12141d] border-b border-[#282c3d] px-8 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-xs text-gray-400 font-medium">Servidor Supabase Conectado</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/40 text-xs font-bold text-[#f5d77f]">
          <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
          ADMINISTRADOR SUPREMO
        </div>
        <div className="w-9 h-9 rounded-full bg-[#1a1d29] border border-[#282c3d] flex items-center justify-center text-white">
          <User className="w-5 h-5" />
        </div>
      </div>
    </header>
  );
};
