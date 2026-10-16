import React, { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AdminLayout } from './components/AdminLayout';
import { MemberDashboard } from './pages/MemberDashboard';
import { VipLandingPage } from './pages/VipLandingPage';
import { Paywall } from './pages/Paywall';
import { ResetPassword } from './pages/ResetPassword';
import { AdminMfa } from './pages/AdminMfa';
import { supabase, getAccessStatus } from './services/supabase';
import { verifySession, clearSession, startNewSession } from './services/session';

// Link de "redefinir senha" do e-mail: o Supabase volta para o site com type=recovery
const isRecoveryLink = () => /type=recovery/.test(window.location.hash + window.location.search);

type ViewState = 'loading' | 'anon' | 'paywall' | 'member' | 'admin' | 'mfa';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [view, setView] = useState<ViewState>('loading');
  const [notice, setNotice] = useState('');
  const [recovering, setRecovering] = useState(() => {
    if (!isRecoveryLink()) return false;
    startNewSession(); // este aparelho passa a ser o ativo da conta
    return true;
  });
  const [isAdminUser, setIsAdminUser] = useState(false);

  // 1. Sessão vem SEMPRE do Supabase Auth (nunca liberamos acesso sem sessão válida)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        startNewSession();
        setRecovering(true);
      }
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

    // Uma sessão por conta: se a conta entrou em outro aparelho, este é desconectado
    if (!(await verifySession())) {
      clearSession();
      sessionStorage.removeItem('preferred_role');
      setNotice('Sua conta foi acessada em outro aparelho. Por segurança, este aparelho foi desconectado.');
      await supabase.auth.signOut();
      setView('anon');
      return;
    }

    setIsAdminUser(access.isAdmin);
    const preferredRole = sessionStorage.getItem('preferred_role');
    const wantsAdmin = preferredRole === 'admin';

    if (access.isAdmin) {
      // Admin logado mas sem ter clicado em "Admin" (ex.: abriu o site de novo):
      // mostra a página de vendas normal; a verificação só aparece ao clicar em "Admin"
      if (!preferredRole) {
        setView('anon');
        return;
      }
      // Conta de administrador: exige a verificação em 2 etapas (app autenticador)
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel !== 'aal2') {
        setView('mfa');
        return;
      }
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
    setNotice('');
    sessionStorage.setItem('preferred_role', role);
    resolveView();
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('preferred_role');
    clearSession();
    await supabase.auth.signOut();
  };

  if (recovering) {
    return (
      <ResetPassword
        onDone={() => {
          setRecovering(false);
          resolveView();
        }}
      />
    );
  }

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-[#010013] flex items-center justify-center text-[#6b76ff] font-bold text-sm">
        Carregando sessão segura do Escala Swipe...
      </div>
    );
  }

  if (view === 'anon' || !session?.user) {
    return (
      <VipLandingPage
        onLoginSuccess={handleLoginSuccess}
        notice={notice}
        // Admin já logado: o link "Admin" abre direto a verificação em 2 etapas
        onAdminEnter={isAdminUser && session?.user ? () => handleLoginSuccess('admin') : undefined}
      />
    );
  }

  const userEmail = (session.user.email || '').toLowerCase();
  const userName = session.user.user_metadata?.full_name || userEmail.split('@')[0];

  if (view === 'mfa') {
    return (
      <AdminMfa
        onVerified={resolveView}
        onLogout={handleLogout}
        onCancel={() => {
          sessionStorage.removeItem('preferred_role');
          setView('anon');
        }}
      />
    );
  }

  if (view === 'paywall') {
    return <Paywall userEmail={userEmail} onRecheck={resolveView} onLogout={handleLogout} />;
  }

  if (view === 'member') {
    return <MemberDashboard userEmail={userEmail} userName={userName} isAdmin={isAdminUser} onLogout={handleLogout} />;
  }

  // PAINEL ADMINISTRATIVO (apenas e-mails de administrador)
  return <AdminLayout onLogout={handleLogout} />;
}
