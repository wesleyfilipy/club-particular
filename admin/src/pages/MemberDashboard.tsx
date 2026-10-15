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
  Loader2,
} from 'lucide-react';
import { getR2SignedUrls, getR2PresignedDownloadUrl, isR2Key } from '../services/r2';
import { openStripeCustomerPortalPage, cancelStripeSubscriptionApi } from '../services/stripe';
import { OfferItem, fetchOffersFromSupabase } from '../services/offersService';
import { ScaleChart } from '../components/ScaleChart';

interface MemberDashboardProps {
  userEmail: string;
  userName: string;
  onLogout: () => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ userEmail, userName, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'offers' | 'profile'>('offers');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

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

  const filteredOffers = offers.filter(
    (o) =>
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lastAds = (offer: OfferItem) =>
    offer.dailyScale.length > 0 ? offer.dailyScale[offer.dailyScale.length - 1].ads : null;

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans selection:bg-[#d4af37] selection:text-[#090a0f]">
      {/* HEADER PRINCIPAL */}
      <header className="bg-[#12141d]/90 backdrop-blur-md border-b border-[#282c3d] px-6 py-4 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#f5d77f] via-[#d4af37] to-[#997d2e] p-0.5 shadow-lg shadow-[#d4af37]/20">
              <div className="w-full h-full bg-[#090a0f] rounded-[14px] flex items-center justify-center">
                <Crown className="w-6 h-6 text-[#f5d77f]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-wider gold-text-gradient">ESCALA SWIPE</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37] text-[10px] font-extrabold text-[#f5d77f] uppercase tracking-widest">
                  ÁREA DE MEMBROS
                </span>
              </div>
              <p className="text-xs text-gray-400">Ofertas escaladas, VSLs e anúncios da Biblioteca do Meta</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#1a1d29] border border-[#282c3d] shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-bold text-gray-200 truncate max-w-[180px]">{userEmail}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#d4af37]/20 text-[#f5d77f] font-bold uppercase tracking-wider ml-1">
                ASSINATURA ATIVA
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
        <aside className="w-full md:w-64 bg-[#12141d] border border-[#282c3d] rounded-3xl p-4 space-y-3 shrink-0 h-fit shadow-2xl">
          <div className="px-3 py-2 text-xs font-extrabold text-[#f5d77f] uppercase tracking-wider">Navegação</div>

          <button
            onClick={() => setActiveTab('offers')}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'offers'
                ? 'bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] shadow-lg shadow-[#d4af37]/20 font-extrabold scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1d29]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5" />
              Ofertas Escaladas
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'offers' ? 'bg-[#090a0f] text-[#f5d77f]' : 'bg-[#1a1d29] text-gray-400'
              }`}
            >
              {offers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] shadow-lg shadow-[#d4af37]/20 font-extrabold scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1d29]'
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
              <div className="bg-gradient-to-br from-[#12141d] via-[#1a1d29] to-[#12141d] border border-[#d4af37]/50 p-6 md:p-8 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden">
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37] text-[10px] font-extrabold text-[#f5d77f] uppercase tracking-widest inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                    Portal de Alta Performance
                  </span>
                  <h2 className="font-extrabold text-2xl md:text-3xl text-white gold-text-gradient">Ofertas Escaladas</h2>
                </div>

                <p className="text-sm text-gray-300 leading-relaxed max-w-4xl">
                  Ofertas analisadas com VSL original, vídeos dos anúncios da Biblioteca do Meta, site oficial e o gráfico de escala diário — tudo num só lugar.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {[
                    'Vídeo VSL original (Full HD / 4K)',
                    'Vídeos dos anúncios da Biblioteca do Meta',
                    'Gráfico de escala por dia',
                    'Packs completos de criativos',
                    'Site oficial e landing page',
                    'Arquivos no Cloudflare R2',
                  ].map((item) => (
                    <div key={item} className="p-3 rounded-2xl bg-[#090a0f]/60 border border-[#282c3d] text-xs text-gray-200 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold text-[#f5d77f] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span>Escolha a oferta, veja se ela está escalando, assista à VSL e baixe os materiais para começar suas campanhas.</span>
                </div>
              </div>

              {/* BUSCA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#12141d] p-6 rounded-3xl border border-[#282c3d] shadow-xl">
                <div>
                  <h3 className="font-extrabold text-xl text-white">Biblioteca de Ofertas</h3>
                  <p className="text-xs text-gray-400 mt-1">Clique em "Detalhes" para ver os anúncios e o gráfico de escala.</p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Buscar oferta ou nicho..."
                    className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-[#d4af37] outline-none shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {loadingOffers && (
                <div className="p-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" /> Carregando ofertas...
                </div>
              )}
              {!loadingOffers && filteredOffers.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-400 bg-[#12141d] border border-[#282c3d] rounded-3xl">
                  Nenhuma oferta encontrada.
                </div>
              )}

              {/* GRID DE OFERTAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-[#12141d] border border-[#282c3d] hover:border-[#d4af37]/60 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative w-full aspect-video bg-black overflow-hidden border-b border-[#282c3d]">
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
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#090a0f]/80 backdrop-blur-md border border-[#d4af37] text-[#f5d77f] text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                            <Film className="w-3 h-3 text-[#d4af37]" />
                            {offer.vslResolution}
                          </span>
                          {lastAds(offer) !== null && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-[#090a0f]/80 backdrop-blur-md text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                              <TrendingUp className="w-3 h-3 text-[#d4af37]" />
                              {lastAds(offer)} anúncios ativos
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#1a1d29] border border-[#282c3d] text-[10px] font-bold text-[#f5d77f] inline-block truncate max-w-full">
                          {offer.category}
                        </span>

                        <h3 className="font-extrabold text-base text-white line-clamp-1 tracking-tight group-hover:text-[#f5d77f] transition-colors">
                          {offer.name}
                        </h3>

                        {offer.commission && (
                          <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#1a1d29] to-[#090a0f] border border-[#d4af37]/30 flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Comissão:</span>
                            <span className="font-extrabold text-xs text-[#f5d77f] tracking-wide">{offer.commission}</span>
                          </div>
                        )}

                        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{offer.description}</p>
                      </div>
                    </div>

                    <div className="p-4 pt-0 space-y-2.5 border-t border-[#282c3d]/50 mt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleDownload(offer.vslKey)}
                          disabled={!offer.vslKey || downloadingKey === offer.vslKey}
                          className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-40"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Baixar VSL
                        </button>

                        <button
                          onClick={() => handleDownload(offer.creativeKey)}
                          disabled={!offer.creativeKey || downloadingKey === offer.creativeKey}
                          className="px-3 py-2 rounded-xl bg-[#1a1d29] border border-[#d4af37]/40 text-[#f5d77f] hover:bg-[#222736] font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-40"
                        >
                          <Package className="w-3.5 h-3.5 text-purple-400" />
                          Pack Criativos
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-1">
                        <button
                          onClick={() => copyToClipboard(offer.landingPageUrl || offer.siteUrl, offer.id)}
                          disabled={!offer.landingPageUrl && !offer.siteUrl}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#1a1d29] border border-[#282c3d] text-[10px] font-bold text-gray-300 hover:text-white flex items-center justify-center gap-1 transition-all disabled:opacity-40"
                        >
                          {copiedId === offer.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copiado!
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3 h-3 text-[#d4af37]" /> Copiar Link
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setSelectedOffer(offer)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#1a1d29] border border-[#282c3d] text-[10px] font-bold text-gray-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3 text-[#d4af37]" /> Detalhes
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
            <div className="bg-[#12141d] border border-[#282c3d] rounded-3xl p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-5 border-b border-[#282c3d] pb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5d77f] via-[#d4af37] to-[#997d2e] p-0.5 shadow-lg">
                  <div className="w-full h-full bg-[#090a0f] rounded-[14px] flex items-center justify-center text-[#f5d77f] font-extrabold text-xl">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#1a1d29] border border-[#282c3d] shadow-md">
                  <span className="text-xs text-gray-400 block mb-1">Acesso</span>
                  <span className="font-bold text-[#f5d77f] text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#d4af37]" />
                    Individual — 1 assinatura por conta
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#1a1d29] border border-[#282c3d] shadow-md">
                  <span className="text-xs text-gray-400 block mb-1">Status da assinatura</span>
                  <span className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Ativa
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#1a1d29]/80 border border-[#282c3d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-base text-white">Gerenciar Assinatura</h4>
                  <p className="text-xs text-gray-400 mt-1">Atualize o cartão ou cancele quando quiser.</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openStripeCustomerPortalPage(userEmail)}
                    className="px-4 py-2.5 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-gray-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#d4af37]" />
                    Portal Stripe
                  </button>

                  <button
                    onClick={async () => {
                      if (confirm(`Tem certeza que deseja cancelar a assinatura de ${userEmail}?`)) {
                        const res = await cancelStripeSubscriptionApi();
                        alert(res.message);
                        if (res.success) onLogout();
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs hover:bg-red-500/20 transition-all cursor-pointer shrink-0"
                  >
                    Cancelar Minha Assinatura
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL DETALHES DA OFERTA */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141d] border border-[#282c3d] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 relative shadow-2xl">
            <button
              onClick={() => setSelectedOffer(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="px-3 py-1 rounded-full bg-[#1a1d29] border border-[#282c3d] text-xs font-bold text-[#f5d77f] inline-block">
              {selectedOffer.category}
            </span>

            <h2 className="font-extrabold text-2xl text-white pr-12">{selectedOffer.name}</h2>

            {mediaSrc(selectedOffer.vslKey) && (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-[#282c3d]">
                <video
                  controls
                  poster={mediaSrc(selectedOffer.posterKey) || undefined}
                  className="w-full h-full object-contain"
                  src={mediaSrc(selectedOffer.vslKey)}
                />
              </div>
            )}

            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1a1d29] to-[#090a0f] border border-[#d4af37]/40 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gray-400 uppercase font-bold block">Comissão:</span>
                <span className="font-extrabold text-lg text-[#f5d77f]">{selectedOffer.commission || '—'}</span>
              </div>

              <button
                onClick={() => handleDownload(selectedOffer.vslKey)}
                disabled={!selectedOffer.vslKey}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-extrabold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer disabled:opacity-40"
              >
                <Download className="w-4 h-4" /> Baixar VSL ({selectedOffer.vslResolution})
              </button>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">{selectedOffer.description}</p>

            {/* GRÁFICO DE ESCALA */}
            <div className="p-5 rounded-2xl bg-[#1a1d29] border border-[#282c3d] space-y-3">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Escala por dia — anúncios ativos na Biblioteca do Meta</h3>
              <ScaleChart data={selectedOffer.dailyScale} />
            </div>

            {/* VÍDEOS DOS ANÚNCIOS */}
            {selectedOffer.adVideos.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#d4af37]" />
                  Vídeos dos anúncios ({selectedOffer.adVideos.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedOffer.adVideos.map((ad) => (
                    <div key={ad.key} className="rounded-2xl overflow-hidden border border-[#282c3d] bg-[#1a1d29]">
                      {mediaSrc(ad.key) ? (
                        <video controls preload="metadata" className="w-full aspect-[9/16] max-h-80 bg-black object-contain" src={mediaSrc(ad.key)} />
                      ) : (
                        <div className="w-full h-40 bg-black flex items-center justify-center text-xs text-gray-500">Carregando vídeo...</div>
                      )}
                      <div className="p-3 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-gray-300 truncate">{ad.name}</span>
                        <button
                          onClick={() => handleDownload(ad.key)}
                          disabled={downloadingKey === ad.key}
                          className="p-1.5 rounded-lg bg-[#12141d] border border-[#282c3d] text-[#f5d77f] hover:bg-[#222736] cursor-pointer disabled:opacity-40"
                          title="Baixar vídeo"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#282c3d]">
              {selectedOffer.siteUrl && (
                <a
                  href={selectedOffer.siteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-xs text-gray-200 font-semibold hover:text-[#f5d77f] flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4 text-[#d4af37]" /> Site Oficial
                </a>
              )}

              {selectedOffer.landingPageUrl && (
                <a
                  href={selectedOffer.landingPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-xs text-gray-200 font-semibold hover:text-[#f5d77f] flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-blue-400" /> Landing Page
                </a>
              )}

              {selectedOffer.adsLibraryUrl && (
                <a
                  href={selectedOffer.adsLibraryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-xs text-gray-200 font-semibold hover:text-[#f5d77f] flex items-center gap-2"
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
