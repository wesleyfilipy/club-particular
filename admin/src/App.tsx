import React, { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { OffersManager } from './pages/OffersManager';
import { NotificationsManager } from './pages/NotificationsManager';
import { MemberDashboard } from './pages/MemberDashboard';
import { VipLandingPage } from './pages/VipLandingPage';
import { Paywall } from './pages/Paywall';
import { supabase, getAccessStatus } from './services/supabase';

type ViewState = 'loading' | 'anon' | 'paywall' | 'member' | 'admin';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [view, setView] = useState<ViewState>('loading');
  const [activeTab, setActiveTab] = useState('dashboard');

  // 1. Sessão vem SEMPRE do Supabase Auth (nunca liberamos acesso sem sessão válida)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setSessionLoaded(true);
      if (!newSession) sessionStorage.removeItem('preferred_role');
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Decide a tela: admin, membro com assinatura paga, ou tela de pagamento
  // Lê a sessão atual direto do Supabase para não depender de estado desatualizado
  const resolveView = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      setView('anon');
      return;
    }

    const access = await getAccessStatus(user.id, user.email || '');
    const wantsAdmin = sessionStorage.getItem('preferred_role') === 'admin';

    if (access.isAdmin) {
      setView(wantsAdmin ? 'admin' : 'member');
    } else if (access.hasActiveSubscription) {
      setView('member');
    } else {
      setView('paywall');
    }
  }, []);

  const currentUserId = session?.user?.id;
  useEffect(() => {
    if (sessionLoaded) resolveView();
  }, [sessionLoaded, currentUserId, resolveView]);

  // Reverifica a assinatura a cada minuto e ao voltar para a aba:
  // quem não renovou é bloqueado mesmo com a página aberta.
  useEffect(() => {
    if (!currentUserId) return;
    const recheck = () => {
      if (document.visibilityState === 'visible') resolveView();
    };
    const interval = window.setInterval(recheck, 60_000);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, [currentUserId, resolveView]);

  const handleLoginSuccess = (role: 'admin' | 'member') => {
    sessionStorage.setItem('preferred_role', role);
    resolveView();
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('preferred_role');
    await supabase.auth.signOut();
  };

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-[#010013] flex items-center justify-center text-[#6b76ff] font-bold text-sm">
        Carregando sessão segura do Escala Swipe...
      </div>
    );
  }

  if (view === 'anon' || !session?.user) {
    return <VipLandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  const userEmail = (session.user.email || '').toLowerCase();
  const userName = session.user.user_metadata?.full_name || userEmail.split('@')[0];

  if (view === 'paywall') {
    return <Paywall userEmail={userEmail} onRecheck={resolveView} onLogout={handleLogout} />;
  }

  if (view === 'member') {
    return <MemberDashboard userEmail={userEmail} userName={userName} onLogout={handleLogout} />;
  }

  // PAINEL ADMINISTRATIVO (apenas e-mails de administrador)
  return (
    <div className="flex min-h-screen bg-[#010013] text-white selection:bg-[#6b76ff] selection:text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-8 flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'offers' && <OffersManager />}
          {activeTab === 'notifications' && <NotificationsManager />}
        </main>
      </div>
    </div>
  );
}
