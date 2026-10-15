import React, { useState } from 'react';
import {
  Crown,
  CheckCircle2,
  Film,
  Package,
  TrendingUp,
  Lock,
  Loader2,
  CreditCard,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react';
import { supabase, ADMIN_EMAILS } from '../services/supabase';
import { openStripeCheckoutPage } from '../services/stripe';

interface VipLandingPageProps {
  onLoginSuccess: (role: 'admin' | 'member') => void;
}

const translateAuthError = (message: string) => {
  const msg = message.toLowerCase();
  if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('email not confirmed')) return 'Confirme seu e-mail pelo link enviado para a sua caixa de entrada antes de entrar.';
  if (msg.includes('rate limit')) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  if (msg.includes('password')) return 'A senha precisa ter pelo menos 6 caracteres.';
  return message;
};

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

  // Login do membro: só autentica. O App verifica a assinatura paga e mostra a tela de pagamento se precisar.
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);
    if (authError) {
      setError(translateAuthError(authError.message));
      return;
    }
    onLoginSuccess('member');
  };

  // Cadastro: cria UMA conta por e-mail e envia para o pagamento vinculado a esta conta.
  // O acesso só é liberado quando o Stripe confirma o pagamento (webhook).
  const handleSubscribeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = email.trim().toLowerCase();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      const msg = signUpError.message.toLowerCase();
      setError(
        msg.includes('already registered')
          ? 'Este e-mail já possui uma conta. Entre com ele em "Já sou membro" para assinar ou acessar.'
          : translateAuthError(signUpError.message)
      );
      setLoading(false);
      return;
    }

    // Supabase devolve identities vazio quando o e-mail já está cadastrado
    if (!data.user || data.user.identities?.length === 0) {
      setError('Este e-mail já possui uma conta. Entre com ele em "Já sou membro" para assinar ou acessar.');
      setLoading(false);
      return;
    }

    openStripeCheckoutPage(cleanEmail, data.user.id);
  };

  // Login de administrador: senha obrigatória no Supabase Auth + e-mail na lista de administradores
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = email.trim().toLowerCase();

    if (!ADMIN_EMAILS.includes(cleanEmail)) {
      setError('Acesso negado! Este e-mail não é o Administrador do sistema.');
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

    setLoading(false);
    if (authError) {
      setError(translateAuthError(authError.message));
      return;
    }
    onLoginSuccess('admin');
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
              <span className="font-extrabold text-base tracking-wider gold-text-gradient block">ESCALA SWIPE</span>
              <span className="text-[10px] text-[#f5d77f] block font-mono font-bold tracking-widest uppercase">OFERTAS ESCALADAS & VSLs</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowLoginModal(true); setError(''); }}
              className="px-4 py-2 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-xs font-bold text-gray-200 hover:text-white hover:border-[#d4af37] transition-all cursor-pointer shadow-md"
            >
              Já sou membro (Entrar)
            </button>

            <button
              onClick={() => { setShowCheckoutModal(true); setError(''); }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] text-xs font-extrabold shadow-lg shadow-[#d4af37]/20 hover:opacity-95 transition-all cursor-pointer"
            >
              Assinar (R$ 0,01/mês)
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37] text-xs font-extrabold text-[#f5d77f] uppercase tracking-widest shadow-lg">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            Acesso exclusivo para assinantes
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Assine o <span className="gold-text-gradient">ESCALA SWIPE</span> e veja quais ofertas estão escalando no Meta Ads
          </h1>

          <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            VSLs originais, vídeos dos anúncios da Biblioteca do Meta, site oficial e o gráfico de escala diário de cada oferta — tudo hospedado no Cloudflare R2.
          </p>

          {/* CARD DE PREÇO */}
          <div className="max-w-md mx-auto bg-[#12141d] border-2 border-[#d4af37] rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#d4af37] text-[#090a0f] text-[10px] font-extrabold uppercase px-4 py-1 rounded-bl-2xl">
              PLANO MENSAL
            </div>

            <div>
              <span className="text-xs text-gray-400 uppercase font-extrabold block mb-1">Assinatura Stripe</span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-bold text-gray-300">R$</span>
                <span className="text-5xl font-extrabold gold-text-gradient">0,01</span>
                <span className="text-gray-400 font-bold text-sm"> / mês</span>
              </div>
              <p className="text-xs text-emerald-400 font-bold mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Uma assinatura por conta, vinculada ao seu e-mail
              </p>
            </div>

            <ul className="text-xs text-left space-y-3 border-t border-b border-[#282c3d] py-5 text-gray-200 font-medium">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>VSLs originais em 4K / 1080p para assistir e baixar</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>Vídeos dos anúncios da Biblioteca do Meta Ads</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>Gráfico de escala: anúncios ativos por dia</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>Site oficial, landing page e packs de criativos</span>
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
              QUERO ASSINAR AGORA
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
            <h3 className="font-extrabold text-lg text-white">VSLs e anúncios em vídeo</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              A VSL original e os vídeos que estão rodando na Biblioteca de Anúncios do Meta, prontos para assistir e baixar.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#12141d] border border-[#282c3d] hover:border-[#d4af37]/40 transition-all space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#f5d77f]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-white">Gráfico de escala diário</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Veja dia a dia quantos anúncios ativos cada oferta tem e descubra quais estão escalando de verdade.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#12141d] border border-[#282c3d] hover:border-[#d4af37]/40 transition-all space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-white">Cloudflare R2</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Todos os vídeos e packs ficam no Cloudflare R2, com links temporários liberados só para assinantes.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-8 px-6 border-t border-[#282c3d] bg-[#090a0f] text-center text-xs text-gray-500 space-y-3">
        <p>© 2026 ESCALA SWIPE. Todos os direitos reservados.</p>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => { setShowLoginModal(true); setError(''); }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Acesso do Membro
          </button>
          <span>•</span>
          <button
            onClick={() => { setShowAdminModal(true); setError(''); }}
            className="text-gray-600 hover:text-gray-400 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Lock className="w-3 h-3 text-[#d4af37]" /> Acesso Restrito Administrador
          </button>
        </div>
      </footer>

      {/* MODAL 1: CADASTRO + CHECKOUT STRIPE */}
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
              <h2 className="text-xl font-extrabold text-white">Assinar Escala Swipe</h2>
              <p className="text-xs text-[#f5d77f] font-bold">R$ 0,01 / mês • pagamento seguro pelo Stripe</p>
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
                  placeholder="Seu nome"
                  className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">SEU E-MAIL</label>
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
                  Sua conta é criada com este e-mail e você vai para o pagamento no Stripe. O acesso é liberado assim que o pagamento for confirmado.
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
                    Criando sua conta...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Criar conta e ir para o pagamento
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOGIN DO MEMBRO */}
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
              <h2 className="text-xl font-extrabold text-white">Acesso de Membro</h2>
              <p className="text-xs text-gray-400">Entre com o e-mail e a senha da sua conta</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">E-MAIL</label>
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

      {/* MODAL 3: LOGIN DE ADMINISTRADOR */}
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
              <h2 className="text-xl font-extrabold text-white">Painel Administrativo</h2>
              <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Acesso restrito ao administrador</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">E-MAIL DE ADMINISTRADOR</label>
                <input
                  type="email"
                  required
                  placeholder="admin@dominio.com"
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
