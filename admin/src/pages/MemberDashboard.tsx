import React, { useState, useEffect, useMemo } from 'react';
import {
  LogOut,
  Download,
  ExternalLink,
  ShieldCheck,
  User,
  Sparkles,
  CheckCircle2,
  Package,
  Search,
  Flame,
  Share2,
  FileText,
  Check,
  X,
  Video,
  Image as ImageIcon,
  Loader2,
  Star,
  Menu,
  SlidersHorizontal,
  ArrowUpDown,
  Facebook,
  Globe,
  Layers,
  Languages,
} from 'lucide-react';
import { getR2SignedUrls, getR2PresignedDownloadUrl, isR2Key } from '../services/r2';
import { openManageSubscriptionPage } from '../services/payment';
import { supabase } from '../services/supabase';
import { OfferItem, fetchOffersFromSupabase, isImageCreative, fetchFavoriteIds, setFavorite } from '../services/offersService';
import { ScaleChart } from '../components/ScaleChart';
import { Logo } from '../components/Logo';
import { OfferCard } from '../components/member/OfferCard';
import { FiltersPanel } from '../components/member/FiltersPanel';
import {
  OfferFilters,
  emptyFilters,
  activeFilterCount,
  applyFilters,
  sortOffers,
  SortMode,
  SORT_LABELS,
  sinceDate,
  formatAge,
} from '../components/member/offerUtils';

interface MemberDashboardProps {
  userEmail: string;
  userName: string;
  isAdmin?: boolean; // admin vendo a área de membros (sem assinatura)
  onLogout: () => void;
}

type Tab = 'offers' | 'favorites' | 'profile';

const PAGE_TITLES: Record<Tab, { title: string; icon: React.ElementType }> = {
  offers: { title: 'Escalando agora', icon: Flame },
  favorites: { title: 'Favoritos', icon: Star },
  profile: { title: 'Minha conta', icon: User },
};

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ userEmail, userName, isAdmin = false, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('offers');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<OfferFilters>(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('ads');
  const [showSort, setShowSort] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
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
      const [data, favs] = await Promise.all([fetchOffersFromSupabase(), fetchFavoriteIds()]);
      setOffers(data);
      setFavorites(favs);
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

  const toggleFavorite = async (offerId: string) => {
    const willFavorite = !favorites.has(offerId);
    const next = new Set(favorites);
    willFavorite ? next.add(offerId) : next.delete(offerId);
    setFavorites(next);
    try {
      await setFavorite(offerId, willFavorite);
    } catch {
      setFavorites(favorites); // desfaz se não salvou
      alert('Não foi possível salvar o favorito agora. Tente novamente.');
    }
  };

  const goTo = (tab: Tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
    setShowFilters(false);
    setShowSort(false);
  };

  const baseList = activeTab === 'favorites' ? offers.filter((o) => favorites.has(o.id)) : offers;
  const visibleOffers = useMemo(
    () => sortOffers(applyFilters(baseList, filters, searchTerm), sortMode),
    [baseList, filters, searchTerm, sortMode]
  );
  const filterCount = activeFilterCount(filters);
  const PageIcon = PAGE_TITLES[activeTab].icon;

  const navButton = (tab: Tab, label: string, Icon: React.ElementType, count?: number) => (
    <button
      onClick={() => goTo(tab)}
      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
        activeTab === tab ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${activeTab === tab ? 'text-[#a8aeff]' : ''}`} />
        {label}
      </span>
      {count !== undefined && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">{count}</span>}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#010013] text-white font-sans selection:bg-[#6b76ff] selection:text-white">
      {/* MENU LATERAL (gaveta no celular) */}
      {menuOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMenuOpen(false)} />}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 w-64 h-screen shrink-0 bg-[#0b0a1f] border-r border-[#25244a] flex flex-col transition-transform md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 flex items-center justify-between">
          <h1 className="sr-only">Escala Swipe</h1>
          <Logo className="h-9" />
          <button onClick={() => setMenuOpen(false)} className="md:hidden p-2 rounded-full bg-white/5 text-gray-300 cursor-pointer" aria-label="Fechar menu">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mx-4 mb-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#bc060f] to-[#3e4be1] flex items-center justify-center text-xs font-bold shrink-0">
            {(userName || userEmail).substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-semibold truncate">{userName}</span>
            <span className="block text-[11px] text-gray-400">{isAdmin ? 'Administrador' : 'Assinante'}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-5">
          <div className="space-y-1">
            <span className="px-3 text-[11px] font-semibold text-gray-500">Geral</span>
            {navButton('offers', 'Escalando agora', Flame, offers.length)}
            {navButton('favorites', 'Favoritos', Star, favorites.size)}
          </div>
          <div className="space-y-1">
            <span className="px-3 text-[11px] font-semibold text-gray-500">Conta</span>
            {navButton('profile', 'Minha conta', User)}
          </div>
        </nav>

        <div className="p-3 border-t border-[#25244a]">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 cursor-pointer">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* CABEÇALHO */}
        <header className="sticky top-0 z-30 h-16 bg-[#010013]/90 backdrop-blur-md border-b border-[#25244a] px-4 md:px-6 flex items-center gap-3">
          <button onClick={() => setMenuOpen(true)} className="md:hidden p-2 rounded-full bg-white/5 text-gray-200 cursor-pointer" aria-label="Abrir menu">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
            <PageIcon className="w-4 h-4 text-[#a8aeff]" />
            {PAGE_TITLES[activeTab].title}
          </h2>
        </header>

        <main className="flex-1 p-4 md:p-6 space-y-5">
          {/* OFERTAS / FAVORITOS */}
          {activeTab !== 'profile' && (
            <>
              {/* BARRA DE FERRAMENTAS */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="relative flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => { setShowFilters((v) => !v); setShowSort(false); }}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      showFilters || filterCount ? 'bg-[#3e4be1]/20 border-[#3e4be1]/60 text-white' : 'bg-white/5 border-white/10 text-gray-200 hover:text-white'
                    }`}
                    aria-expanded={showFilters}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Filtros
                    {filterCount > 0 && <span className="px-1.5 rounded-full bg-[#3e4be1] text-[10px]">{filterCount}</span>}
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => { setShowSort((v) => !v); setShowFilters(false); }}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-gray-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
                      aria-expanded={showSort}
                      title="Ordenar"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{SORT_LABELS[sortMode]}</span>
                    </button>
                    {showSort && (
                      <div className="absolute left-0 top-full mt-2 z-40 w-60 rounded-xl bg-[#0b0a1f] border border-[#25244a] shadow-2xl p-1.5">
                        {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => { setSortMode(mode); setShowSort(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer ${sortMode === mode ? 'bg-[#3e4be1]/25 text-white' : 'text-gray-300 hover:bg-white/5'}`}
                          >
                            {SORT_LABELS[mode]}
                            {sortMode === mode && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setFilters({ ...filters, scalingOnly: !filters.scalingOnly })}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      filters.scalingOnly ? 'bg-[#bc060f]/25 border-[#bc060f]/60 text-white' : 'bg-white/5 border-white/10 text-gray-200 hover:text-white'
                    }`}
                    aria-pressed={filters.scalingOnly}
                  >
                    <Flame className="w-3.5 h-3.5 text-[#ff6b6b]" /> Escalando agora
                  </button>

                  {filterCount > 0 && (
                    <button onClick={() => setFilters(emptyFilters())} className="px-2 py-2 text-xs text-gray-400 hover:text-white cursor-pointer">
                      Limpar filtros
                    </button>
                  )}

                  {showFilters && (
                    <FiltersPanel offers={baseList} filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-xs text-gray-400 shrink-0">
                    {visibleOffers.length} oferta{visibleOffers.length === 1 ? '' : 's'}
                  </span>
                  <div className="relative w-full lg:w-72">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Pesquisar oferta ou nicho..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-[#6b76ff] outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {loadingOffers && (
                <div className="p-10 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#6b76ff]" /> Carregando ofertas...
                </div>
              )}

              {!loadingOffers && visibleOffers.length === 0 && (
                <div className="p-10 text-center text-sm text-gray-400 bg-[#0b0a1f] border border-[#25244a] rounded-2xl space-y-2">
                  {activeTab === 'favorites' && favorites.size === 0 ? (
                    <>
                      <Star className="w-6 h-6 mx-auto text-gray-500" />
                      <p>Você ainda não favoritou nenhuma oferta. Toque na ⭐ de uma oferta para salvá-la aqui.</p>
                    </>
                  ) : (
                    <p>Nenhuma oferta encontrada com esses filtros.</p>
                  )}
                </div>
              )}

              {/* GRADE DE OFERTAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-5 gap-4">
                {visibleOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    posterSrc={mediaSrc(offer.posterKey)}
                    favorite={favorites.has(offer.id)}
                    onToggleFavorite={() => toggleFavorite(offer.id)}
                    onOpen={() => setSelectedOffer(offer)}
                  />
                ))}
              </div>
            </>
          )}

          {/* MINHA CONTA */}
          {activeTab === 'profile' && (
            <div className="max-w-3xl bg-[#0b0a1f] border border-[#25244a] rounded-3xl p-5 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-4 sm:gap-5 border-b border-[#25244a] pb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-gradient-to-br from-[#bc060f] to-[#3e4be1] p-0.5 shadow-lg">
                  <div className="w-full h-full bg-[#010013] rounded-[14px] flex items-center justify-center text-[#a8aeff] font-extrabold text-xl">
                    {userEmail.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="min-w-0">
                  <h2 className="font-extrabold text-lg sm:text-xl text-white break-words">{userName}</h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="text-xs font-mono text-gray-300 break-all">{userEmail}</span>
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
                  <span className="text-[11px] text-gray-400 block mt-1">Você está vendo a área de membros como os clientes a veem.</span>
                </div>
              ) : (
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
              )}

              {/* CANCELAR / GERENCIAR (o admin vê como prévia do que o cliente vê) */}
              <div className="p-6 rounded-3xl bg-[#13122b]/80 border border-[#25244a] space-y-4">
                {isAdmin && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#6b76ff]/15 text-[#a8aeff]">
                    Prévia — é assim que o cliente vê
                  </span>
                )}
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
            </div>
          )}
        </main>
      </div>

      {/* MODAL DETALHES DA OFERTA */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" onClick={() => setSelectedOffer(null)}>
          <div
            className="bg-[#0b0a1f] border border-[#25244a] rounded-3xl max-w-3xl w-full max-h-[94vh] overflow-y-auto p-5 md:p-8 space-y-6 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedOffer(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#13122b] border border-[#25244a] text-gray-400 hover:text-white transition-all cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 pr-12">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {selectedOffer.category}
              </span>
              <h2 className="font-extrabold text-xl md:text-2xl text-white">{selectedOffer.name}</h2>
              <div className="flex flex-wrap gap-1.5 text-[11px] text-gray-300">
                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 flex items-center gap-1">
                  {selectedOffer.network === 'Facebook' ? <Facebook className="w-3 h-3 text-[#4f8cff]" /> : <Globe className="w-3 h-3" />} {selectedOffer.network}
                </span>
                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 flex items-center gap-1"><Layers className="w-3 h-3" /> {selectedOffer.structure}</span>
                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 flex items-center gap-1"><Package className="w-3 h-3" /> {selectedOffer.productType}</span>
                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 flex items-center gap-1"><Languages className="w-3 h-3" /> {selectedOffer.language}</span>
                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">Rodando há {formatAge(sinceDate(selectedOffer))}</span>
              </div>
            </div>

            {mediaSrc(selectedOffer.vslKey) && (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-[#25244a]">
                <video controls poster={mediaSrc(selectedOffer.posterKey) || undefined} className="w-full h-full object-contain" src={mediaSrc(selectedOffer.vslKey)} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDownload(selectedOffer.vslKey)}
                disabled={!selectedOffer.vslKey || downloadingKey === selectedOffer.vslKey}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#bc060f] to-[#3e4be1] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer disabled:opacity-40"
              >
                <Download className="w-4 h-4" /> Baixar VSL ({selectedOffer.vslResolution})
              </button>
              {selectedOffer.creativeKey && (
                <button
                  onClick={() => handleDownload(selectedOffer.creativeKey)}
                  disabled={downloadingKey === selectedOffer.creativeKey}
                  className="px-5 py-2.5 rounded-full bg-white/5 border border-white/15 text-gray-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Package className="w-4 h-4" /> Baixar pack de criativos
                </button>
              )}
              {(selectedOffer.landingPageUrl || selectedOffer.siteUrl) && (
                <button
                  onClick={() => copyToClipboard(selectedOffer.landingPageUrl || selectedOffer.siteUrl, selectedOffer.id)}
                  className="px-4 py-2.5 rounded-full bg-white/5 border border-white/15 text-gray-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === selectedOffer.id ? <><Check className="w-4 h-4 text-emerald-400" /> Copiado!</> : <><Share2 className="w-4 h-4" /> Copiar link</>}
                </button>
              )}
              <button
                onClick={() => toggleFavorite(selectedOffer.id)}
                className={`px-4 py-2.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  favorites.has(selectedOffer.id) ? 'bg-amber-400/15 border-amber-400/40 text-amber-200' : 'bg-white/5 border-white/15 text-gray-200'
                }`}
              >
                <Star className="w-4 h-4" fill={favorites.has(selectedOffer.id) ? 'currentColor' : 'none'} />
                {favorites.has(selectedOffer.id) ? 'Favoritada' : 'Favoritar'}
              </button>
            </div>

            {selectedOffer.description && <p className="text-sm text-gray-300 leading-relaxed">{selectedOffer.description}</p>}

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
                <a href={selectedOffer.siteUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-[#13122b] border border-[#25244a] text-xs text-gray-200 font-semibold hover:text-[#a8aeff] flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-[#6b76ff]" /> Site Oficial
                </a>
              )}
              {selectedOffer.landingPageUrl && (
                <a href={selectedOffer.landingPageUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-[#13122b] border border-[#25244a] text-xs text-gray-200 font-semibold hover:text-[#a8aeff] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" /> Landing Page
                </a>
              )}
              {selectedOffer.adsLibraryUrl && (
                <a href={selectedOffer.adsLibraryUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-[#13122b] border border-[#25244a] text-xs text-gray-200 font-semibold hover:text-[#a8aeff] flex items-center gap-2">
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
