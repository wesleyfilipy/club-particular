import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Dashboard } from '../pages/Dashboard';
import { OffersManager } from '../pages/OffersManager';
import { NotificationsManager } from '../pages/NotificationsManager';

interface AdminLayoutProps {
  onLogout: () => void;
  initialTab?: string;
}

/** Painel administrativo (apenas e-mails de administrador) */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout, initialTab = 'dashboard' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#010013] text-white selection:bg-[#6b76ff] selection:text-white">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={onLogout}
        mobileOpen={menuOpen}
        onCloseMobile={() => setMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMenu={() => setMenuOpen(true)} />

        <main className="p-4 md:p-8 flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'offers' && <OffersManager />}
          {activeTab === 'notifications' && <NotificationsManager />}
        </main>
      </div>
    </div>
  );
};
