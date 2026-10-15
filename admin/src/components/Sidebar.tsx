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
    <aside className="w-64 bg-[#0b0a1f] border-r border-[#25244a] flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#25244a] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#6b76ff]/10 border border-[#6b76ff] flex items-center justify-center">
            <Crown className="w-5 h-5 text-[#6b76ff]" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wider gold-text-gradient">ESCALA SWIPE</h1>
            <p className="text-xs text-gray-400">Painel Administrativo</p>
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
                    ? 'bg-gradient-to-r from-[#bc060f] to-[#3e4be1] text-white shadow-lg shadow-[#6b76ff]/20 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-[#13122b]'
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
      <div className="p-4 border-t border-[#25244a]">
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
