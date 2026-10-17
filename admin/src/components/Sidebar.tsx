import React from 'react';
import { LayoutDashboard, Gift, Bell, LogOut, X } from 'lucide-react';
import { Logo } from './Logo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  mobileOpen: boolean; // no celular o menu é uma gaveta
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, mobileOpen, onCloseMobile }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'offers', label: 'Gerenciar Ofertas', icon: Gift },
    { id: 'notifications', label: 'Disparo de Notificações', icon: Bell },
  ];

  return (
    <>
      {/* Fundo escuro atrás da gaveta (celular) */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={onCloseMobile} />}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 w-64 bg-[#0e0d0b] border-r border-[#2c2818] flex flex-col justify-between h-screen transition-transform md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-[#2c2818] space-y-2 relative">
            <h1 className="sr-only">Escala Swipe</h1>
            <Logo className="h-10" />
            <p className="text-xs text-gray-400">Painel Administrativo</p>
            <button
              onClick={onCloseMobile}
              className="md:hidden absolute top-4 right-4 p-2 rounded-full bg-white/5 text-gray-300 cursor-pointer"
              aria-label="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); onCloseMobile(); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#f6e27a] via-[#d4af37] to-[#a8801f] text-black shadow-lg shadow-[#d4af37]/20 font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-[#17150f]'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-[#2c2818]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sair do Painel
          </button>
        </div>
      </aside>
    </>
  );
};
