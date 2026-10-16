import React, { useState, useEffect } from 'react';
import {
  Crown,
  Gift,
  LogOut,
  Download,
  ExternalLink,
  ShieldCheck,
  User,
  Sparkles,
  CheckCircle2,
  Film,
  Package,
  Search,
  Flame,
  Share2,
  FileText,
  Check,
  X,
  Maximize2,
  TrendingUp,
  Video,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { getR2SignedUrls, getR2PresignedDownloadUrl, isR2Key } from '../services/r2';
import { openManageSubscriptionPage } from '../services/payment';
import { supabase } from '../services/supabase';
import { OfferItem, fetchOffersFromSupabase, isImageCreative } from '../services/offersService';
import { ScaleChart } from '../components/ScaleChart';

interface MemberDashboardProps {
  userEmail: string;
  userName: string;
  isAdmin?: boolean; // admin vendo a área de membros (sem assinatura)
  onLogout: () => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ userEmail, userName, isAdmin = false, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'offers' | 'profile'>('offers');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<{ current_period_end: string | null; cancel_at_period_end: boolean } | null>(null);

  // Assinatura da conta (vinculada ao e-mail usado na Lastlink)
  useEffect(() => {
    supabase
      .from('es_subscriptions')
      .select('current_period_end, cancel_at_period_end')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle()
      .then(({ data }) => setSubscription(data));
  }, [userEmail]);

  // URLs temporárias do Cloudflare R2 (chave -> URL assinada) para tocar os vídeos e exibir as capas
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadOffers = async () => {
      const data = await fetchOffersFromSupabase();
      setOffers(data);
      setLoadingOffers(false);

      const keys = data.flatMap((o) => [o.vslKey, o.posterKey, ...o.adVideos.map((v) => v.key)]).filter(isR2Key);
      if (keys.length > 0) {
        try {
          setMediaUrls(await getR2SignedUrls(keys));
        } catch (err) {
          console.warn('Erro ao gerar URLs do Cloudflare R2:', err);
        }
      }
    };
    loadOffers();
  }, []);

  // Chave do R2 vira URL assinada; URL externa é usada como está
  const mediaSrc = (value: string) => (isR2Key(value) ? mediaUrls[value] || '' : value);

  const handleDownload = async (value: string) => {
    if (!value) return;
    if (!isR2Key(value)) {
      window.open(value, '_blank');
      return;
    }
    setDownloadingKey(value);
    try {
      const url = await getR2PresignedDownloadUrl(value, true);
      window.location.href = url;
    } catch (err: any) {
      alert(err.message || 'Não foi possível gerar o link de download.');
    } finally {
      setDownloadingKey(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Categorias na ordem em que aparecem (as ofertas já vêm da mais nova para a mais antiga)
  const categories = [...new Set(offers.map((o) => o.category))];

  const filteredOffers = offers.filter(
    (o) =>
      (categoryFilter === 'all' || o.category === categoryFilter) &&
      (o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Selo "Nova" nas ofertas cadastradas nos últimos 7 dias
  const isNew = (offer: OfferItem) =>
    !!offer.createdAt && Date.now() - new Date(offer.createdAt).getTime() < 7 * 86400000;

  const lastAds = (offer: OfferItem) =>
    offer.dailyScale.length > 0 ? offer.dailyScale[offer.dailyScale.length - 1].ads : null;

  // Crescimento de anúncios ativos nos últimos 7 registros do gráfico de escala
  const growthOf = (offer: OfferItem) => {
    const pts = offer.dailyScale.slice(-7);
    return pts.length >= 2 ? pts[pts.length - 1].ads - pts[0].ads : 0;
  };

  const newCount = offers.filter(isNew).length;
  const scalingCount = offers.filter((o) => growthOf(o) > 0).length;
  const trending = offers
    .map((offer) => ({ offer, growth: growthOf(offer) }))
    .filter((t) => t.growth > 0)
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#010013] text-white flex flex-col font-sans selection:bg-[#6b76ff] selection:text-white">
      {/* HEADER PRINCIPAL */}
      <header className="bg-[#0b0a1f]/90 backdrop-blur-md border-b border-[#25244a] px-6 py-4 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#bc060f] to-[#3e4be1] p-0.5 shadow-lg shadow-[#6b76ff]/20">
              <div className="w-full h-full bg-[#010013] rounded-[14px] flex items-center justify-center">
                <Crown className="w-6 h-6 text-[#a8aeff]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-wider gold-text-gradient">ESCALA SWIPE</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#6b76ff]/10 border border-[#6b76ff] text-[10px] font-extrabold text-[#a8aeff] uppercase tracking-widest">
                  ÁREA DE MEMBROS
                </span>
              </div>
              <p className="text-xs text-gray-400">Ofertas escaladas, VSLs e anúncios da Biblioteca do Meta</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#13122b] border border-[#25244a] shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-bold text-gray-200 truncate max-w-[180px]">{userEmail}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#6b76ff]/20 text-[#a8aeff] font-bold uppercase tracking-wider ml-1">
                {isAdmin ? 'ADMINISTRADOR' : 'ASSINATURA ATIVA'}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-xs font-bold shadow-md cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        {/* NAVEGAÇÃO LATERAL */}
        <aside className="w-full md:w-64 bg-[#0b0a1f] border border-[#25244a] rounded-3xl p-4 space-y-3 shrink-0 h-fit shadow-2xl">
          <div className="px-3 py-2 text-xs font-extrabold text-[#a8aeff] uppercase tracking-wider">Navegação</div>

          <button
            onClick={() => setActiveTab('offers')}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'offers'
                ? 'bg-gradient-to-r from-[#bc060f] to-[#3e4be1] text-white shadow-lg shadow-[#6b76ff]/20 font-extrabold scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-[#13122b]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5" />
              Ofertas Escaladas
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'offers' ? 'bg-[#010013] text-[#a8aeff]' : 'bg-[#13122b] text-gray-400'
              }`}
            >
              {offers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-[#bc060f] to-[#3e4be1] text-white shadow-lg shadow-[#6b76ff]/20 font-extrabold scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-[#13122b]'
            }`}
          >
            <User className="w-5 h-5" />
            Minha Conta
          </button>
        </aside>

        <main className="flex-1 min-w-0">
          {/* TAB 1: OFERTAS */}
          {activeTab === 'offers' && (
            <div className="space-y-6">
              {/* RESUMO DAS OFERTAS ESCALADAS */}
              <div className="glass rounded-[30px] p-6 md:p-8 space-y-6 relative overflow-hidden">
                <div className="absolute inset-0 hero-glow opacity-60 pointer-events-none" />
                <div className="relative space-y-2">
                  <span className="section-tag">// ofertas escaladas</span>
                  <h2 className="font-bold text-2xl md:text-3xl text-white">
                    Ofertas que estão <span className="gold-text-gradient">escalando agora</span>
                  </h2>
                  <p className="text-sm text-gray-300 max-w-3xl">
                    Acompanhe quantos anúncios cada oferta tem ativos por dia e modele as que mais crescem.
                  </p>
                </div>

                <div className="relative grid grid-cols-3 gap-3">
                  {[
                    { label: 'Ofertas disponíveis', value: offers.length },
                    { label: 'Novas esta semana', value: newCount },
                    { label: 'Escalando agora', value: scalingCount },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 rounded-2xl bg-black/30 border border-white/10">
                      <span className="block text-2xl md:text-3xl font-bold text-white">{stat.value}</span>
                      <span className="block text-[11px] md:text-xs text-gray-400 mt-1">{stat.label}</span>
                    </div>
                  ))}
                </div>

                {trending.length > 0 && (
                  <div className="relative space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#a8aeff] flex items-center gap-1.5">
                      <Flame className="w-4 h-4" /> Em alta nos últimos 7 dias
                    </h3>
                    {trending.map(({ offer, growth }, i) => (
                      <button
                        key={offer.id}
                        onClick={() => setSelectedOffer(offer)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-black/30 border border-white/10 hover:border-white/25 transition-all text-left cursor-pointer"
                      >
                        <span className="text-lg font-bold gold-text-gradient w-6 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-white truncate">{offer.name}</span>
                          <span className="block text-[11px] text-gray-400 truncate">{offer.category}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block text-sm font-bold text-white">{lastAds(offer)} anúncios</span>
                          <span className="block text-[11px] font-semibold text-emerald-400">+{growth} em 7 dias</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* BUSCA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0b0a1f] p-6 rounded-3xl border border-[#25244a] shadow-xl">
                <div>
                  <h3 className="font-extrabold text-xl text-white">Biblioteca de Ofertas</h3>
                  <p className="text-xs text-gray-400 mt-1">Clique em "Detalhes" para ver os anúncios e o gráfico de escala.</p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Buscar oferta ou nicho..."
                    className="w-full bg-[#13122b] border border-[#25244a] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-[#6b76ff] outline-none shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* FILTRO POR CATEGORIA */}
              {categories.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {[{ id: 'all', label: `Todas (${offers.length})` }, ...categories.map((c) => ({ id: c, label: `${c} (${offers.filter((o) => o.category === c).length})` }))].map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => setCategoryFilter(chip.id)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        categoryFilter === chip.id
                          ? 'bg-gradient-to-r from-[#bc060f] to-[#3e4be1] text-white shadow-lg'
                          : 'bg-white/5 border border-white/10 text-gray-300 hover:text-white'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}

              {loadingOffers && (
                <div className="p-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#6b76ff]" /> Carregando ofertas...
                </div>
              )}
              {!loadingOffers && filteredOffers.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-400 bg-[#0b0a1f] border border-[#25244a] rounded-3xl">
                  Nenhuma oferta encontrada.
                </div>
              )}

              {/* GRID DE OFERTAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-[#0b0a1f] border border-[#25244a] hover:border-[#6b76ff]/60 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative w-full aspect-video bg-black overflow-hidden border-b border-[#25244a]">
                        {mediaSrc(offer.vslKey) ? (
                          <video
                            key={mediaSrc(offer.vslKey)}
                            controls
                            poster={mediaSrc(offer.posterKey) || undefined}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            src={mediaSrc(offer.vslKey)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                            {offer.vslKey ? 'Carregando VSL...' : 'VSL não enviada'}
                          </div>
                        )}

                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#010013]/80 backdrop-blur-md border border-[#6b76ff] text-[#a8aeff] text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                            <Film className="w-3 h-3 text-[#6b76ff]" />
                            {offer.vslResolution}
                          </span>
                          {lastAds(offer) !== null && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-[#010013]/80 backdrop-blur-md text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                              <TrendingUp className="w-3 h-3 text-[#6b76ff]" />
                              {lastAds(offer)} anúncios ativos
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#13122b] border border-[#25244a] text-[10px] font-bold text-[#a8aeff] truncate">
                            {offer.category}
                          </span>
                          {isNew(offer) && (
                            <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#bc060f] to-[#3e4be1] text-[10px] font-extrabold text-white shrink-0">
                              NOVA
                            </span>
                          )}
                        </div>

                        <h3 className="font-extrabold text-base text-white line-clamp-1 tracking-tight group-hover:text-[#a8aeff] transition-colors">
                          {offer.name}
                        </h3>

                        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{offer.description}</p>
                      </div>
                    </div>

                    <div className="p-4 pt-0 space-y-2.5 border-t border-[#25244a]/50 mt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleDownload(offer.vslKey)}
                          disabled={!offer.vslKey || downloadingKey === offer.vslKey}
                          className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#bc060f] to-[#3e4be1] text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-40"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Baixar VSL
                        </button>

                        <button
                          onClick={() => handleDownload(offer.creativeKey)}
                          disabled={!offer.creativeKey || downloadingKey === offer.creativeKey}
                          className="px-3 py-2 rounded-xl bg-[#13122b] border border-[#6b76ff]/40 text-[#a8aeff] hover:bg-[#1c1b3a] font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-40"
                        >
                          <Package className="w-3.5 h-3.5 text-purple-400" />
                          Pack Criativos
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-1">
                        <button
                          onClick={() => copyToClipboard(offer.landingPageUrl || offer.siteUrl, offer.id)}
                          disabled={!offer.landingPageUrl && !offer.siteUrl}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#13122b] border border-[#25244a] text-[10px] font-bold text-gray-300 hover:text-white flex items-center justify-center gap-1 transition-all disabled:opacity-40"
                        >
                          {copiedId === offer.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copiado!
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3 h-3 text-[#6b76ff]" /> Copiar Link
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setSelectedOffer(offer)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#13122b] border border-[#25244a] text-[10px] font-bold text-gray-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3 text-[#6b76ff]" /> Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MINHA CONTA */}
          {activeTab === 'profile' && (
            <div className="bg-[#0b0a1f] border border-[#25244a] rounded-3xl p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-5 border-b border-[#25244a] pb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#bc060f] to-[#3e4be1] p-0.5 shadow-lg">
                  <div className="w-full h-full bg-[#010013] rounded-[14px] flex items-center justify-center text-[#a8aeff] font-extrabold text-xl">
                    {userEmail.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h2 className="font-extrabold text-xl text-white">{userName}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-mono text-gray-300">{userEmail}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Conta vinculada a este e-mail
                    </span>
                  </div>
                </div>
              </div>

              {isAdmin ? (
                <div className="p-5 rounded-2xl bg-[#13122b] border border-[#25244a] shadow-md">
                  <span className="text-xs text-gray-400 block mb-1">Acesso</span>
                  <span className="font-bold text-[#a8aeff] text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#6b76ff]" />
                    Administrador — acesso total, sem assinatura
                  </span>
                  <span className="text-[11px] text-gray-400 block mt-1">
                    Você está vendo a área de membros como os clientes a veem.
                  </span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-[#13122b] border border-[#25244a] shadow-md">
                      <span className="text-xs text-gray-400 block mb-1">Acesso</span>
                      <span className="font-bold text-[#a8aeff] text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#6b76ff]" />
                        Individual — 1 aparelho por vez
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#13122b] border border-[#25244a] shadow-md">
                      <span className="text-xs text-gray-400 block mb-1">Status da assinatura</span>
                      <span className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        {subscription?.cancel_at_period_end ? 'Ativa — renovação cancelada' : 'Ativa'}
                      </span>
                      {subscription?.current_period_end && (
                        <span className="text-[11px] text-gray-400 block mt-1">
                          Acesso pago até {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-[#13122b]/80 border border-[#25244a] space-y-4">
                    <div>
                      <h4 className="font-extrabold text-base text-white">Cancelar ou gerenciar assinatura</h4>
                      <p className="text-xs text-gray-400 mt-1">
                        A assinatura é feita pela Lastlink no e-mail <strong className="text-gray-200">{userEmail}</strong>. Ao cancelar, você continua com acesso até o fim do período já pago.
                      </p>
                    </div>

                    <ol className="text-xs text-gray-300 space-y-1.5 list-decimal list-inside">
                      <li>Entre na Lastlink com o e-mail <strong className="text-gray-100">{userEmail}</strong></li>
                      <li>Abra <strong className="text-gray-100">Minhas compras</strong> e encontre o Escala Swipe</li>
                      <li>Clique em <strong className="text-gray-100">"..."</strong> → <strong className="text-gray-100">Detalhes da compra</strong></li>
                      <li>Clique em <strong className="text-gray-100">Cancelar assinatura</strong></li>
                    </ol>

                    <button
                      onClick={openManageSubscriptionPage}
                      className="px-5 py-2.5 rounded-full bg-[#13122b] border border-[#25244a] text-gray-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#6b76ff]" />
                      Abrir minha conta na Lastlink
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL DETALHES DA OFERTA */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0a1f] border border-[#25244a] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 relative shadow-2xl">
            <button
              onClick={() => setSelectedOffer(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-[#13122b] border border-[#25244a] text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="px-3 py-1 rounded-full bg-[#13122b] border border-[#25244a] text-xs font-bold text-[#a8aeff] inline-block">
              {selectedOffer.category}
            </span>

            <h2 className="font-extrabold text-2xl text-white pr-12">{selectedOffer.name}</h2>

            {mediaSrc(selectedOffer.vslKey) && (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-[#25244a]">
                <video
                  controls
                  poster={mediaSrc(selectedOffer.posterKey) || undefined}
                  className="w-full h-full object-contain"
                  src={mediaSrc(selectedOffer.vslKey)}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleDownload(selectedOffer.vslKey)}
                disabled={!selectedOffer.vslKey}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#bc060f] to-[#3e4be1] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer disabled:opacity-40"
              >
                <Download className="w-4 h-4" /> Baixar VSL ({selectedOffer.vslResolution})
              </button>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">{selectedOffer.description}</p>

            {/* GRÁFICO DE ESCALA */}
            <div className="p-5 rounded-2xl bg-[#13122b] border border-[#25244a] space-y-3">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Escala por dia — anúncios ativos na Biblioteca do Meta</h3>
              <ScaleChart data={selectedOffer.dailyScale} />
            </div>

            {/* CRIATIVOS DOS ANÚNCIOS (VÍDEOS E IMAGENS) */}
            {selectedOffer.adVideos.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#6b76ff]" />
                  Criativos dos anúncios ({selectedOffer.adVideos.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedOffer.adVideos.map((ad) => (
                    <div key={ad.key} className="rounded-2xl overflow-hidden border border-[#25244a] bg-[#13122b]">
                      {!mediaSrc(ad.key) ? (
                        <div className="w-full h-40 bg-black flex items-center justify-center text-xs text-gray-500">Carregando criativo...</div>
                      ) : isImageCreative(ad) ? (
                        <img src={mediaSrc(ad.key)} alt={ad.name} loading="lazy" className="w-full max-h-80 bg-black object-contain" />
                      ) : (
                        <video controls preload="metadata" className="w-full aspect-[9/16] max-h-80 bg-black object-contain" src={mediaSrc(ad.key)} />
                      )}
                      <div className="p-3 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-gray-300 truncate flex items-center gap-1.5">
                          {isImageCreative(ad) ? <ImageIcon className="w-3.5 h-3.5 shrink-0 text-[#a8aeff]" /> : <Video className="w-3.5 h-3.5 shrink-0 text-[#a8aeff]" />}
                          {ad.name}
                        </span>
                        <button
                          onClick={() => handleDownload(ad.key)}
                          disabled={downloadingKey === ad.key}
                          className="p-1.5 rounded-lg bg-[#0b0a1f] border border-[#25244a] text-[#a8aeff] hover:bg-[#1c1b3a] cursor-pointer disabled:opacity-40"
                          title={isImageCreative(ad) ? 'Baixar imagem' : 'Baixar vídeo'}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#25244a]">
              {selectedOffer.siteUrl && (
                <a
                  href={selectedOffer.siteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#13122b] border border-[#25244a] text-xs text-gray-200 font-semibold hover:text-[#a8aeff] flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4 text-[#6b76ff]" /> Site Oficial
                </a>
              )}

              {selectedOffer.landingPageUrl && (
                <a
                  href={selectedOffer.landingPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#13122b] border border-[#25244a] text-xs text-gray-200 font-semibold hover:text-[#a8aeff] flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-blue-400" /> Landing Page
                </a>
              )}

              {selectedOffer.adsLibraryUrl && (
                <a
                  href={selectedOffer.adsLibraryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#13122b] border border-[#25244a] text-xs text-gray-200 font-semibold hover:text-[#a8aeff] flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-purple-400" /> Biblioteca de Anúncios (Meta)
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
