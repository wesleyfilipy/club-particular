import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { OffersManager } from './pages/OffersManager';
import { MediaUploader } from './pages/MediaUploader';
import { NotificationsManager } from './pages/NotificationsManager';
import { MemberDashboard } from './pages/MemberDashboard';
import { VipLandingPage } from './pages/VipLandingPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'member'>('member');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLoginSuccess = (role: 'admin' | 'member', email: string, name?: string) => {
    setUserRole(role);
    setUserEmail(email);
    setUserName(name || '');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('member');
    setUserEmail('');
    setUserName('');
  };

  // VISITANTES E NOVOS ALUNOS VÊEM A LANDING PAGE VIP (COM VENDAS R$ 1.000/MÊS E LOGIN DE ALUNOS)
  if (!isAuthenticated) {
    return <VipLandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  // PAINEL EXCLUSIVO DO ALUNO / MEMBRO ASSINANTE (R$ 1.000/MÊS)
  if (userRole === 'member') {
    return (
      <MemberDashboard
        userEmail={userEmail || 'aluno@clubparticular.com'}
        userName={userName || 'Aluno VIP'}
        onLogout={handleLogout}
      />
    );
  }

  // PAINEL ADMINISTRATIVO VIP EXCLUSIVO (APENAS VOCÊ LOGADO COMO ADMIN)
  return (
    <div className="flex min-h-screen bg-[#090a0f] text-white selection:bg-[#d4af37] selection:text-[#090a0f]">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-8 flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'offers' && <OffersManager />}
          {activeTab === 'media' && <MediaUploader />}
          {activeTab === 'notifications' && <NotificationsManager />}
        </main>
      </div>
    </div>
  );
}
