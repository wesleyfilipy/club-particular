import React from 'react';
import { ShieldCheck, User } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 bg-[#0b0a1f] border-b border-[#25244a] px-8 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-xs text-gray-400 font-medium">Servidor Supabase Conectado</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6b76ff]/10 border border-[#6b76ff]/40 text-xs font-bold text-[#a8aeff]">
          <ShieldCheck className="w-4 h-4 text-[#6b76ff]" />
          ADMINISTRADOR SUPREMO
        </div>
        <div className="w-9 h-9 rounded-full bg-[#13122b] border border-[#25244a] flex items-center justify-center text-white">
          <User className="w-5 h-5" />
        </div>
      </div>
    </header>
  );
};
