import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { OffersManager } from './pages/OffersManager';
import { MediaUploader } from './pages/MediaUploader';
import { NotificationsManager } from './pages/NotificationsManager';
import { MemberDashboard } from './pages/MemberDashboard';
import { Login } from './pages/Login';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'member'>('admin');
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
    setUserRole('admin');
    setUserEmail('');
    setUserName('');
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // PAINEL EXCLUSIVO DO ALUNO / MEMBRO
  if (userRole === 'member') {
    return (
      <MemberDashboard
        userEmail={userEmail || 'aluno@clubparticular.com'}
        userName={userName || 'Aluno VIP'}
        onLogout={handleLogout}
      />
    );
  }

  // PAINEL ADMINISTRATIVO VIP
  return (
    <div className="flex min-h-screen bg-[#090a0f] text-white">
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

