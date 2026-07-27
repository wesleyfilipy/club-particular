import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { OffersManager } from './pages/OffersManager';
import { MediaUploader } from './pages/MediaUploader';
import { NotificationsManager } from './pages/NotificationsManager';
import { Login } from './pages/Login';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default to logged in for review preview
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#090a0f] text-white">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => setIsAuthenticated(false)}
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
