import React, { useState } from 'react';
import {
  CheckCircle2,
  Film,
  Package,
  TrendingUp,
  Lock,
  Loader2,
  CreditCard,
  X,
  AlertCircle,
  Menu,
  Play,
  Video,
  Globe,
  ArrowRight,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';
import { supabase, ADMIN_EMAILS } from '../services/supabase';
import { openCheckoutPage, PAYMENT_CONFIG } from '../services/payment';
import { ScaleChart } from '../components/ScaleChart';
import { startNewSession } from '../services/session';

interface VipLandingPageProps {
  onLoginSuccess: (role: 'admin' | 'member') => void;
  notice?: string; // aviso exibido no topo (ex.: desconectado por login em outro aparelho)
}

const translateAuthError = (message: string) => {
  const msg = message.toLowerCase();
  if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('email not confirmed')) return 'Confirme seu e-mail pelo link enviado para a sua caixa de entrada antes de entrar.';
  if (msg.includes('rate limit')) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  if (msg.includes('password')) return 'A senha precisa ter pelo menos 6 caracteres.';
  return message;
};

// Dados ilustrativos da prévia (rotulados como exemplo na página)
const PREVIEW_SCALE = [
  { date: '2026-10-09', ads: 12 },
  { date: '2026-10-10', ads: 15 },
  { date: '2026-10-11', ads: 21 },
  { date: '2026-10-12', ads: 19 },
  { date: '2026-10-13', ads: 28 },
  { date: '2026-10-14', ads: 34 },
  { date: '2026-10-15', ads: 41 },
];

const NAV_LINKS = [
  { href: '#inicio', label: 'Início' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#planos', label: 'Planos' },
];

const FEATURES = [
  {
    tag: '// escala',
    icon: TrendingUp,
    title: 'Saiba quais ofertas estão escalando',
    text: 'Cada oferta tem um gráfico com a quantidade de anúncios ativos por dia na Biblioteca do Meta. Se a linha sobe, o anunciante está investindo mais.',
  },
  {
    tag: '// anúncios',
    icon: Video,
    title: 'Os vídeos que estão rodando no Meta Ads',
    text: 'Assista e baixe os criativos em vídeo das ofertas direto da plataforma, sem precisar garimpar a biblioteca de anúncios.',
  },
  {
    tag: '// vsl',
    icon: Film,
    title: 'VSL original para assistir e baixar',
    text: 'A VSL de cada oferta em Full HD ou 4K, com download direto, junto do site oficial e da página de vendas.',
  },
  {
    tag: '// arquivos',
    icon: Package,
    title: 'Packs de criativos prontos',
    text: 'Packs completos guardados no Cloudflare R2 com links protegidos, liberados só para assinantes.',
  },
];

const PLAN_ITEMS = [
  'Gráfico de escala diário de cada oferta',
  'Vídeos dos anúncios da Biblioteca do Meta',
  'VSLs originais para assistir e baixar',
  'Site oficial, landing page e packs de criativos',
  'Cancele quando quiser pelo seu painel',
];

const inputClass =
  'w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#6b76ff] outline-none transition-colors';

const ctaClass =
  'rounded-full bg-gradient-to-r from-[#bc060f] to-[#3e4be1] text-white font-bold uppercase tracking-wide shadow-lg shadow-[#3e4be1]/30 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50';

interface ModalProps {
  title: string;
  subtitle?: string;
  error: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, subtitle, error, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-[#0b0a1f] border border-white/10 rounded-[30px] max-w-md w-full p-6 md:p-8 space-y-6 relative shadow-2xl">
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2 rounded-full bg-white/5 text-gray-400 hover:text-white cursor-pointer"
        aria-label="Fechar"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="space-y-1 pr-10">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {children}
    </div>
  </div>
);

export const VipLandingPage: React.FC<VipLandingPageProps> = ({ onLoginSuccess, notice }) => {
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openCheckout = () => { setShowCheckoutModal(true); setError(''); setMobileMenuOpen(false); };
  const openLogin = () => { setShowLoginModal(true); setError(''); setMobileMenuOpen(false); };

  // Login do membro: só autentica. O App verifica a assinatura paga e mostra a tela de pagamento se precisar.
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    startNewSession();
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
  // O acesso só é liberado quando a Lastlink confirma o pagamento deste e-mail (webhook).
  const handleSubscribeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = email.trim().toLowerCase();

    startNewSession();
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

    openCheckoutPage();
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

    startNewSession();
    const { error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

    setLoading(false);
    if (authError) {
      setError(translateAuthError(authError.message));
      return;
    }
    onLoginSuccess('admin');
  };

  return (
    <div className="min-h-screen bg-[#010013] text-white flex flex-col font-sans selection:bg-[#6b76ff] selection:text-white">
      {/* MENU */}
      <header className="sticky top-0 z-40 bg-[#010013]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#inicio" className="font-extrabold text-lg tracking-wide gold-text-gradient">ESCALA SWIPE</a>

          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white transition-colors">{link.label}</a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={openLogin} className="px-5 py-2 rounded-full border border-white/15 text-sm text-gray-200 hover:text-white hover:border-white/30 transition-all cursor-pointer">
              Entrar
            </button>
            <button onClick={openCheckout} className={`px-5 py-2 text-xs ${ctaClass}`}>
              Começar agora
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-full bg-white/5 text-gray-200 cursor-pointer"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 px-4 py-4 space-y-3 bg-[#010013]">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-300 py-1">
                {link.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={openLogin} className="flex-1 py-2.5 rounded-full border border-white/15 text-sm cursor-pointer">Entrar</button>
              <button onClick={openCheckout} className={`flex-1 py-2.5 text-xs ${ctaClass}`}>Começar agora</button>
            </div>
          </div>
        )}
      </header>

      {notice && (
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
        </div>
      )}

      {/* HERO */}
      <section id="inicio" className="relative overflow-hidden px-4 sm:px-6 pt-16 md:pt-24 pb-16">
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center space-y-7">
          <span className="section-tag">// escala swipe</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight">
            Descubra quais ofertas estão <span className="gold-text-gradient">escalando agora</span>
          </h1>
          <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Ofertas mineradas com VSL original, vídeos dos anúncios da Biblioteca do Meta e o gráfico de anúncios ativos por dia. Tudo num só lugar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#planos" className={`px-8 py-4 text-sm inline-flex items-center gap-2 ${ctaClass}`}>
              Começar agora <ArrowRight className="w-4 h-4" />
            </a>
            <button onClick={openLogin} className="px-8 py-4 rounded-full border border-white/15 text-sm text-gray-200 hover:text-white hover:border-white/30 transition-all cursor-pointer">
              Já sou membro
            </button>
          </div>
        </div>

        {/* PRÉVIA DA PLATAFORMA */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="glass rounded-[30px] p-4 sm:p-6 shadow-2xl shadow-[#3e4be1]/10">
            <div className="flex items-center gap-1.5 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#bc060f]" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#3e4be1]" />
              <span className="ml-3 text-[11px] text-gray-400">Prévia da área de membros · dados de exemplo</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2 rounded-3xl bg-black/40 border border-white/10 overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-[#bc060f]/30 to-[#3e4be1]/30 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-[#a8aeff]">Saúde & Emagrecimento</span>
                  <p className="text-sm font-semibold">VSL original · 1080p</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <span className="text-[11px] text-center py-2 rounded-full bg-gradient-to-r from-[#bc060f] to-[#3e4be1] font-semibold">Baixar VSL</span>
                    <span className="text-[11px] text-center py-2 rounded-full bg-white/5 border border-white/10">Pack criativos</span>
                  </div>
                </div>
              </div>
              <div className="md:col-span-3 rounded-3xl bg-black/40 border border-white/10 p-4 sm:p-5">
                <p className="text-xs font-semibold text-gray-300 mb-3">Anúncios ativos por dia na Biblioteca do Meta</p>
                <ScaleChart data={PREVIEW_SCALE} height={190} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="section-tag">// recursos</span>
            <h2 className="text-3xl md:text-4xl font-bold">Tudo o que você precisa para modelar uma oferta</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.tag} className="glass rounded-[30px] p-7 space-y-4 hover:border-white/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="section-tag">{feature.tag}</span>
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#bc060f] to-[#3e4be1] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="px-4 sm:px-6 py-16 md:py-24 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="section-tag">// como funciona</span>
            <h2 className="text-3xl md:text-4xl font-bold">Acesso em 3 passos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: UserPlus, title: 'Crie sua conta', text: 'Uma conta por e-mail, com a sua senha de acesso.' },
              { icon: CreditCard, title: 'Assine pela Lastlink', text: 'Pague com o mesmo e-mail da sua conta. A assinatura fica vinculada a ele.' },
              { icon: Globe, title: 'Acesse as ofertas', text: 'Assim que o pagamento é confirmado, a área de membros é liberada.' },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="glass rounded-[30px] p-7 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold gold-text-gradient">0{i + 1}</span>
                    <Icon className="w-5 h-5 text-[#a8aeff]" />
                  </div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-gray-300">{step.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="section-tag">// planos</span>
            <h2 className="text-3xl md:text-4xl font-bold">Escolha seu acesso</h2>
          </div>

          <div className="max-w-md mx-auto rounded-[30px] p-[1px] bg-gradient-to-br from-[#bc060f] to-[#3e4be1] shadow-2xl shadow-[#3e4be1]/20">
            <div className="rounded-[29px] bg-[#0b0a1f] p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Escala Swipe</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-[#a8aeff]">Mensal</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg text-gray-400">R$</span>
                <span className="text-5xl font-bold">{PAYMENT_CONFIG.priceFormatted.replace('R$', '').split('/')[0].trim()}</span>
                <span className="text-sm text-gray-400">/ mês</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-200">
                {PLAN_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#a8aeff] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button onClick={openCheckout} className={`w-full py-4 text-sm ${ctaClass}`}>
                Começar agora
              </button>
              <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Uma assinatura por conta, vinculada ao seu e-mail
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="mt-auto px-4 sm:px-6 py-10 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-400">
          <div className="text-center md:text-left space-y-1">
            <span className="font-extrabold tracking-wide gold-text-gradient">ESCALA SWIPE</span>
            <p className="text-xs">© 2026 Escala Swipe. Todos os direitos reservados.</p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-5 text-xs">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white transition-colors">{link.label}</a>
            ))}
            <button onClick={openLogin} className="hover:text-white transition-colors cursor-pointer">Área de membros</button>
            <button
              onClick={() => { setShowAdminModal(true); setError(''); }}
              className="text-gray-600 hover:text-gray-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Lock className="w-3 h-3" /> Admin
            </button>
          </nav>
        </div>
      </footer>

      {/* MODAL: CADASTRO + CHECKOUT STRIPE */}
      {showCheckoutModal && (
        <Modal
          title="Criar conta e assinar"
          subtitle={`${PAYMENT_CONFIG.priceFormatted} · pagamento seguro pela Lastlink`}
          error={error}
          onClose={() => setShowCheckoutModal(false)}
        >
          <form onSubmit={handleSubscribeCheckout} className="space-y-3">
            <input type="text" required placeholder="Seu nome" className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <input type="email" required placeholder="Seu e-mail" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" required minLength={6} placeholder="Crie uma senha (mín. 6 caracteres)" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-[11px] text-gray-400 px-1">
              Sua conta é criada e você vai para o pagamento na Lastlink. <strong className="text-white">Use este mesmo e-mail no pagamento</strong>: o acesso é liberado para ele assim que a compra for confirmada.
            </p>
            <button type="submit" disabled={loading} className={`w-full py-3.5 text-sm flex items-center justify-center gap-2 ${ctaClass}`}>
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Criando sua conta...</> : <>Ir para o pagamento <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL: LOGIN DO MEMBRO */}
      {showLoginModal && (
        <Modal title="Entrar" subtitle="Use o e-mail e a senha da sua conta" error={error} onClose={() => setShowLoginModal(false)}>
          <form onSubmit={handleStudentLogin} className="space-y-3">
            <input type="email" required placeholder="Seu e-mail" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" required placeholder="Sua senha" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" disabled={loading} className={`w-full py-3.5 text-sm flex items-center justify-center ${ctaClass}`}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar na área de membros'}
            </button>
            <button type="button" onClick={() => { setShowLoginModal(false); openCheckout(); }} className="w-full text-xs text-gray-400 hover:text-white cursor-pointer pt-1">
              Ainda não tem conta? <span className="text-[#a8aeff]">Criar conta</span>
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL: LOGIN DE ADMINISTRADOR */}
      {showAdminModal && (
        <Modal title="Painel administrativo" subtitle="Acesso restrito ao administrador" error={error} onClose={() => setShowAdminModal(false)}>
          <form onSubmit={handleAdminLogin} className="space-y-3">
            <input type="email" required placeholder="E-mail de administrador" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" required placeholder="Senha" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" disabled={loading} className={`w-full py-3.5 text-sm flex items-center justify-center ${ctaClass}`}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Acessar painel'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};
