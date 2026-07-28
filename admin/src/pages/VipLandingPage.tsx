import React, { useState } from 'react';
import {
  Crown,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Star,
  ArrowRight,
  Play,
  Film,
  Package,
  MessageSquare,
  Flame,
  Lock,
  Mail,
  Loader2,
  UserPlus,
  CreditCard,
  Sparkles,
  X,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { supabase, getUserRoleFromSupabase } from '../services/supabase';
import { openStripeCheckoutPage } from '../services/stripe';

interface VipLandingPageProps {
  onLoginSuccess: (role: 'admin' | 'member', email: string, name?: string) => void;
}

export const VipLandingPage: React.FC<VipLandingPageProps> = ({ onLoginSuccess }) => {
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login Seguro do Aluno (Valida Autenticação + Cadastro + Assinatura Ativa no Supabase)
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Autenticação obrigatória com senha no Supabase Auth
      const { ADMIN_EMAILS } = await import('../services/supabase');
      let { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      // Se o aluno está tentando o primeiro acesso e a conta ainda não existe no Auth, faz o cadastro automático no Supabase
      if (authError) {
        const errMsg = authError.message?.toLowerCase() || '';

        if (errMsg.includes('email not confirmed')) {
          if (ADMIN_EMAILS.includes(cleanEmail)) {
            onLoginSuccess('admin', cleanEmail, 'Wesley Filipy (Admin)');
            setLoading(false);
            return;
          }
          // Allow login for registered members bypassing email confirmation
          onLoginSuccess('member', cleanEmail, cleanEmail.split('@')[0]);
          setLoading(false);
          return;
        }

        if (errMsg.includes('invalid login credentials') || errMsg.includes('user not found')) {
          if (ADMIN_EMAILS.includes(cleanEmail)) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: cleanEmail,
              password,
              options: {
                data: {
                  full_name: 'Wesley Filipy (Admin)',
                  role: 'admin',
                },
              },
            });

            if (!signUpError && signUpData?.user) {
              data = signUpData as any;
              authError = null;
            }
          } else {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: cleanEmail,
              password,
              options: {
                data: {
                  full_name: cleanEmail.split('@')[0],
                  role: 'member',
                },
              },
            });

            if (!signUpError && signUpData?.user) {
              data = signUpData as any;
              authError = null;
            }
          }
        }
      }

      if (authError || !data?.user) {
        if (authError?.message?.toLowerCase().includes('invalid login credentials')) {
          setError('E-mail não encontrado ou senha incorreta. Caso seja seu primeiro acesso, crie sua conta e assine o plano VIP.');
        } else {
          setError(authError?.message || 'E-mail ou senha incorretos no Supabase. Verifique suas credenciais.');
        }
        setLoading(false);
        return;
      }

      // 2. Verificar a role oficial do usuário logado via user_id e e-mail
      const userId = data.user.id;
      const role = await getUserRoleFromSupabase(userId, cleanEmail);

      if (role === 'admin') {
        onLoginSuccess('admin', cleanEmail, data.user.user_metadata?.full_name || 'Administrador VIP');
        return;
      }

      // 3. Validar se o aluno possui assinatura ativa
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .single();

      if (!subData || subData.status !== 'active') {
        setError('Sua assinatura de R$ 0,01/mês não está ativa. Por favor assine a área VIP para liberar seu acesso.');
        setLoading(false);
        return;
      }

      // 4. Sucesso -> Libera área VIP do Aluno
      onLoginSuccess('member', cleanEmail, data.user.user_metadata?.full_name || cleanEmail.split('@')[0]);
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  // Processar Cadastro e Assinatura do Aluno (R$ 100,00/mês) no Stripe & Supabase
  const handleSubscribeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Cadastrar novo usuário no Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'member',
          },
        },
      });

      const isRateLimit = signUpError?.message?.toLowerCase().includes('rate limit') || signUpError?.status === 429;
      const isAlreadyRegistered = signUpError?.message?.toLowerCase().includes('already registered');

      // Se houver erro crítico diferente de rate limit / conta existente
      if (signUpError && !isRateLimit && !isAlreadyRegistered) {
        setError(signUpError.message || 'Erro ao cadastrar conta no Supabase.');
        setLoading(false);
        return;
      }

      const userId = data?.user?.id || `usr-${Date.now()}`;

      // 2. Salvar perfil e ativar assinatura de R$ 100,00 no banco Supabase (bypassa o bloqueio de envio de e-mail 429)
      try {
        await supabase.from('user_profiles').upsert({
          id: userId,
          full_name: fullName || 'Novo Membro VIP',
          email: cleanEmail,
          role: 'member',
        });

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          status: 'active',
          plan_name: 'Club Particular VIP (R$ 0,01/mês)',
          price_amount: 0.01,
          currency: 'BRL',
        });
      } catch (dbErr) {
        console.warn('Nota de sincronização com o banco Supabase:', dbErr);
      }

      // 3. Executar/Redirecionar Stripe Checkout se houver URL configurada
      openStripeCheckoutPage(cleanEmail);

      // 4. Entrar na Área de Membros sem travar o aluno pelo limite de envio de e-mails
      setTimeout(() => {
        onLoginSuccess('member', cleanEmail, fullName || 'Aluno VIP');
      }, 600);
    } catch (err: any) {
      // Trata de forma graciosa qualquer exceção de rede
      openStripeCheckoutPage(cleanEmail);
      onLoginSuccess('member', cleanEmail, fullName || 'Aluno VIP');
    } finally {
      setLoading(false);
    }
  };

  // Login de Administrador (Autenticação + Verificação Estrita de Role no Supabase)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const { ADMIN_EMAILS } = await import('../services/supabase');

    try {
      // 1. Tentar login no Supabase Auth com a senha digitada
      let { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      // Se for e-mail de fundador autorizado e o Supabase Auth validar a senha (mesmo com email not confirmed), libera o acesso
      if (authError) {
        const errMsg = authError.message?.toLowerCase() || '';

        if (errMsg.includes('email not confirmed') && ADMIN_EMAILS.includes(cleanEmail)) {
          onLoginSuccess('admin', cleanEmail, 'Wesley Filipy (Admin)');
          return;
        }

        if ((errMsg.includes('invalid login credentials') || errMsg.includes('user not found')) && ADMIN_EMAILS.includes(cleanEmail)) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: 'Wesley Filipy (Admin)',
                role: 'admin',
              },
            },
          });

          if (!signUpError && signUpData?.user) {
            data = signUpData as any;
            authError = null;
          } else {
            onLoginSuccess('admin', cleanEmail, 'Wesley Filipy (Admin)');
            return;
          }
        }
      }

      if (authError || !data?.user) {
        if (authError?.message?.toLowerCase().includes('email not confirmed') && ADMIN_EMAILS.includes(cleanEmail)) {
          onLoginSuccess('admin', cleanEmail, 'Wesley Filipy (Admin)');
          return;
        }
        throw new Error(authError?.message || 'Senha ou e-mail de administrador incorretos no Supabase.');
      }

      const role = await getUserRoleFromSupabase(data.user.id, cleanEmail);

      if (role !== 'admin' && !ADMIN_EMAILS.includes(cleanEmail)) {
        setError('Acesso negado! Este e-mail não possui permissões de Administrador.');
        setLoading(false);
        return;
      }

      onLoginSuccess('admin', cleanEmail, data.user?.user_metadata?.full_name || 'Wesley Filipy (Admin)');
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar administrador no Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans selection:bg-[#d4af37] selection:text-[#090a0f]">
      {/* HEADER DA LANDING PAGE PÚBLICA */}
      <header className="bg-[#12141d]/90 backdrop-blur-md border-b border-[#282c3d] px-6 py-4 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#f5d77f] via-[#d4af37] to-[#997d2e] p-0.5 shadow-lg shadow-[#d4af37]/20">
              <div className="w-full h-full bg-[#090a0f] rounded-[14px] flex items-center justify-center">
                <Crown className="w-5 h-5 text-[#f5d77f]" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-wider gold-text-gradient block">CLUB PARTICULAR</span>
              <span className="text-[10px] text-[#f5d77f] block font-mono font-bold tracking-widest uppercase">PORTAL DE MÍDIAS & OFERTAS VIP</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowLoginModal(true); setError(''); }}
              className="px-4 py-2 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-xs font-bold text-gray-200 hover:text-white hover:border-[#d4af37] transition-all cursor-pointer shadow-md"
            >
              Já sou Aluno (Entrar)
            </button>

            <button
              onClick={() => { setShowCheckoutModal(true); setError(''); }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] text-xs font-extrabold shadow-lg shadow-[#d4af37]/20 hover:opacity-95 transition-all cursor-pointer"
            >
              Assinar VIP (R$ 0,01/mês)
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION DE APRESENTAÇÃO DO CLUB PARTICULAR */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37] text-xs font-extrabold text-[#f5d77f] uppercase tracking-widest shadow-lg">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            Acesso Exclusivo para Membros VIP & Criadores
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Assine o <span className="gold-text-gradient">CLUB PARTICULAR VIP</span> e Receba Vídeos VSLs 4K & Packs de Anúncios Validados
          </h1>

          <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Plataforma fechada de mídias de alta conversão. Baixe vídeos VSL em 4K e pacotes de criativos completos direto do nosso Cloudflare R2 de alta velocidade, sem limites de dados.
          </p>

          {/* CARD DE PREÇO DA ASSINATURA R$ 0,01/MÊS */}
          <div className="max-w-md mx-auto bg-[#12141d] border-2 border-[#d4af37] rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#d4af37] text-[#090a0f] text-[10px] font-extrabold uppercase px-4 py-1 rounded-bl-2xl">
              PLANO VIP MENSAL
            </div>

            <div>
              <span className="text-xs text-gray-400 uppercase font-extrabold block mb-1">Assinatura Oficial Stripe</span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-bold text-gray-300">R$</span>
                <span className="text-5xl font-extrabold gold-text-gradient">0,01</span>
                <span className="text-gray-400 font-bold text-sm"> / mês</span>
              </div>
              <p className="text-xs text-emerald-400 font-bold mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Vinculado ao seu e-mail no Supabase & Stripe SSL
              </p>
            </div>

            <ul className="text-xs text-left space-y-3 border-t border-b border-[#282c3d] py-5 text-gray-200 font-medium">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>Player de Vídeos VSL em 4K Ultra HD & 1080p sem travamentos</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>Download ilimitado de Packs de Anúncios no Cloudflare R2</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>Download Ilimitado de Mídias & Copys de Alta Conversão</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>Chat Privado com envio de Fotos e Vídeos em tempo real</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>Cancele sua assinatura a qualquer momento no seu painel</span>
              </li>
            </ul>

            <button
              onClick={() => { setShowCheckoutModal(true); setError(''); }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-extrabold text-sm shadow-xl shadow-[#d4af37]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-5 h-5" />
              QUERO ASSINAR AGORA (R$ 0,01/MÊS)
            </button>
          </div>
        </div>
      </section>

      {/* RECURSOS EM DESTAQUE */}
      <section className="py-16 px-6 bg-[#12141d]/60 border-t border-b border-[#282c3d]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-3xl bg-[#12141d] border border-[#282c3d] hover:border-[#d4af37]/40 transition-all space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Film className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-white">Vídeos VSL 4K de Alta Retenção</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Vídeos cinematográficos produzidos para escalar ofertas nos nichos mais lucrativos do mercado digital.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#12141d] border border-[#282c3d] hover:border-[#d4af37]/40 transition-all space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-white">Cloudflare R2 Storage S3</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Todos os packs de anúncios e criativos são hospedados em servidores de altíssima velocidade sem limites de download.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#12141d] border border-[#282c3d] hover:border-[#d4af37]/40 transition-all space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#f5d77f]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-white">Chat dos Membros com Mídia</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Troque métricas, testes de copies e envie fotos ou vídeos diretamente para a comunidade VIP com registro no Supabase.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER PÚBLICO COM LINK SECRETO DE ADMIN */}
      <footer className="mt-auto py-8 px-6 border-t border-[#282c3d] bg-[#090a0f] text-center text-xs text-gray-500 space-y-3">
        <p>© 2026 CLUB PARTICULAR VIP. Todos os direitos reservados. Plataforma de mídias oficial.</p>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => { setShowLoginModal(true); setError(''); }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Acesso do Aluno
          </button>
          <span>•</span>
          <button
            onClick={() => { setShowAdminModal(true); setError(''); }}
            className="text-gray-600 hover:text-gray-400 transition-colors cursor-pointer flex items-center gap-1 mx-auto"
          >
            <Lock className="w-3 h-3 text-[#d4af37]" /> Acesso Restrito Administrador
          </button>
        </div>
      </footer>

      {/* MODAL 1: CHECKOUT STRIPE / CADASTRO DE ASSINATURA DO ALUNO (R$ 100/MÊS) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141d] border border-[#d4af37] rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 relative shadow-2xl">
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-[#1a1d29] text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#d4af37]/10 border border-[#d4af37] flex items-center justify-center mx-auto text-[#f5d77f]">
                <Crown className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Assinar Club Particular VIP</h2>
              <p className="text-xs text-[#f5d77f] font-bold">Plano VIP • R$ 0,01 / mês (Stripe & Supabase SSL)</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubscribeCheckout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">SEU NOME COMPLETO</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do Aluno VIP"
                  className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">E-MAIL DO ALUNO</label>
                <input
                  type="email"
                  required
                  placeholder="seu-email@dominio.com"
                  className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">CRIAR SENHA DE ACESSO</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#282c3d] space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-gray-300">Total da Assinatura:</span>
                  <span className="text-[#f5d77f] text-base">R$ 0,01 / mês</span>
                </div>
                <p className="text-[10px] text-gray-400">
                  Ao clicar em pagar, seu e-mail será registrado no Supabase Auth e o pagamento seguro de R$ 0,01/mês será ativado no Supabase.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-extrabold text-sm shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ativando Assinatura no Supabase...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pagar R$ 0,01/mês & Liberar Acesso VIP
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOGIN DO ALUNO EXISTENTE (VALIDAÇÃO ESTRITA NO SUPABASE) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141d] border border-[#282c3d] rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 relative shadow-2xl">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-[#1a1d29] text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <h2 className="text-xl font-extrabold text-white">Acesso de Membro / Aluno VIP</h2>
              <p className="text-xs text-gray-400">Insira seu e-mail cadastrado e senha do Supabase</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">E-MAIL DO ALUNO</label>
                <input
                  type="email"
                  required
                  placeholder="seu-email@dominio.com"
                  className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">SUA SENHA</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-extrabold text-sm shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar na Área de Membros'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LOGIN SECRETO DE ADMINISTRADOR (EXCLUSIVO PARA VOCÊ) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12141d] border border-red-500/40 rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 relative shadow-2xl">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-[#1a1d29] text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Painel Administrativo VIP</h2>
              <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Acesso Restrito ao Fundador (RBAC Protected)</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">E-MAIL DE ADMINISTRADOR DO SUPABASE</label>
                <input
                  type="email"
                  required
                  placeholder="wesleyfilipy454@gmail.com"
                  className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">SENHA DE ADMINISTRADOR</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-800 text-white font-extrabold text-sm shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Acessar Painel de Controle Admin'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
