import React from 'react';
import { LayoutDashboard, Gift, Bell, LogOut, Crown } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'offers', label: 'Gerenciar Ofertas', icon: Gift },
    { id: 'notifications', label: 'Disparo de Notificações', icon: Bell },
  ];

  return (
    <aside className="w-64 bg-[#12141d] border-r border-[#282c3d] flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#282c3d] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 border border-[#d4af37] flex items-center justify-center">
            <Crown className="w-5 h-5 text-[#d4af37]" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wider gold-text-gradient">CLUB PARTICULAR</h1>
            <p className="text-xs text-gray-400">Painel Administrativo VIP</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] shadow-lg shadow-[#d4af37]/20 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1d29]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-[#282c3d]">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sair do Painel
        </button>
      </div>
    </aside>
  );
};
