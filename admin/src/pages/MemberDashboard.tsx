import React, { useState } from 'react';
import { Crown, MessageSquare, Gift, LogOut, Send, Download, ExternalLink, ShieldCheck, User, Sparkles, CheckCircle2, Film, Package, Search, Play, Eye, Flame, Share2, FileText, Check } from 'lucide-react';

interface MemberDashboardProps {
  userEmail: string;
  userName: string;
  onLogout: () => void;
}

interface ChatMessage {
  id: string;
  user_name: string;
  user_role: 'admin' | 'member';
  avatar: string;
  content: string;
  timestamp: string;
}

interface OfferItem {
  id: string;
  name: string;
  category: string;
  commission: string;
  description: string;
  vslVideoUrl: string;
  vslPoster: string;
  vslFileName: string;
  vslResolution: string;
  creativeFileName: string;
  creativeFileSize: string;
  siteUrl: string;
  landingPageUrl: string;
  adsLibraryUrl: string;
  conversionRate: string;
  viewsCount: string;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ userEmail, userName, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'offers' | 'chat' | 'profile'>('offers');
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lista de Ofertas VIP com Player de Vídeo VSL GRANDE em destaque no topo
  const [offers] = useState<OfferItem[]>([
    {
      id: 'oferta-001',
      name: 'Fórmula Seca Barriga Natural 3.0',
      category: 'Saúde & Emagrecimento',
      commission: '80% (R$ 157,60 por venda)',
      description: 'Oferta Black campeã de vendas no nicho de emagrecimento. Inclui VSL de alta retenção gravada em 4K e pack completo de anúncios prontos para rodar no Facebook, Instagram e TikTok Ads.',
      vslVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      vslPoster: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=1200',
      vslFileName: 'vsl_formula_seca_barriga_4k.mp4',
      vslResolution: '4K Ultra HD',
      creativeFileName: 'pack_criativos_anuncios_canva_hd.zip',
      creativeFileSize: '145 MB',
      siteUrl: 'https://formulaseca.com.br',
      landingPageUrl: 'https://formulaseca.com.br/pv-oficial',
      adsLibraryUrl: 'https://facebook.com/ads/library',
      conversionRate: '8.4%',
      viewsCount: '12.450',
    },
    {
      id: 'oferta-002',
      name: 'Método Milionário com IA (MMIA)',
      category: 'Renda Extra & Finanças',
      commission: '75% (R$ 222,75 por venda)',
      description: 'O treinamento mais vendido de automação e vendas com inteligência artificial. VSL cinematográfica com robô 3D, prova social de alunos faturando em dólar e scripts de vendas automática.',
      vslVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      vslPoster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
      vslFileName: 'vsl_metodo_milionario_ia_master.mp4',
      vslResolution: '1080p Full HD',
      creativeFileName: 'video_ads_tiktok_facebook_pack.zip',
      creativeFileSize: '320 MB',
      siteUrl: 'https://metodomilionarioia.com',
      landingPageUrl: 'https://metodomilionarioia.com/vsl-full',
      adsLibraryUrl: 'https://facebook.com/ads/library',
      conversionRate: '9.1%',
      viewsCount: '18.900',
    },
    {
      id: 'oferta-003',
      name: 'Código Secreto da Sedução Suprema',
      category: 'Relacionamento & Conquista',
      commission: '85% (R$ 167,45 por venda)',
      description: 'Ebook + Áudios Guia sobre desenvolvimento pessoal e atração masculina. Pitch validado nos EUA adaptado para o público brasileiro com retenção monstruosa.',
      vslVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      vslPoster: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200',
      vslFileName: 'vsl_codigo_seduicao_suprema.mp4',
      vslResolution: '1080p Full HD',
      creativeFileName: 'pack_banners_copy_criativos.zip',
      creativeFileSize: '98 MB',
      siteUrl: 'https://seducaosuprema.com.br',
      landingPageUrl: 'https://seducaosuprema.com.br/pv-membros',
      adsLibraryUrl: 'https://facebook.com/ads/library',
      conversionRate: '7.8%',
      viewsCount: '8.720',
    },
  ]);

  // Mensagens em tempo real do Chat dos Membros VIP
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      user_name: 'Lucas Founder (Admin)',
      user_role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      content: '🚀 Bem-vindos ao Chat Privado dos Membros VIP! Todos os vídeos de VSL e packs de anúncios disponibilizados nas ofertas estão hospedados diretamente no Cloudflare R2.',
      timestamp: 'Há 1 hora',
    },
    {
      id: 'm2',
      user_name: 'Rodrigo M.',
      user_role: 'member',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      content: 'Assistam a VSL da Fórmula Seca Barriga! O pitch aos 14 minutos tá matador. Subi 2 conjuntos no Facebook Ads e já saiu 4 vendas! 🔥',
      timestamp: 'Há 25 min',
    },
    {
      id: 'm3',
      user_name: 'Camila Santos',
      user_role: 'member',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      content: 'Baixei o Pack de Criativos do Método Milionário IA. Os vídeos pra TikTok Ads já vêm no formato 9:16 perfeito pra rodar! 👏',
      timestamp: 'Há 10 min',
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      user_name: userName || userEmail.split('@')[0],
      user_role: 'member',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      content: newMessage,
      timestamp: 'Agora mesmo',
    };

    setMessages([...messages, msg]);
    setNewMessage('');
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

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans">
      {/* HEADER PRINCIPAL VIP */}
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
                <h1 className="font-extrabold text-lg tracking-wider gold-text-gradient">CLUB PARTICULAR</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37] text-[10px] font-extrabold text-[#f5d77f] uppercase tracking-widest">
                  VIP MEMBER PORTAL
                </span>
              </div>
              <p className="text-xs text-gray-400">Plataforma Oficial de Mídias VSL & Ofertas Exclusivas</p>
            </div>
          </div>

          {/* USER PROFILE & LOGOUT */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#1a1d29] border border-[#282c3d] shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-gray-200 truncate max-w-[200px]">{userEmail}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#d4af37]/20 text-[#f5d77f] font-bold uppercase tracking-wider">
                VIP ATIVO
              </span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-xs font-bold shadow-md"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* CONTAINER PRINCIPAL */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        {/* NAVEGAÇÃO LATERAL */}
        <aside className="w-full md:w-64 bg-[#12141d] border border-[#282c3d] rounded-3xl p-4 space-y-3 shrink-0 h-fit shadow-2xl">
          <div className="px-3 py-2 text-xs font-extrabold text-[#f5d77f] uppercase tracking-wider">
            Navegação do Aluno
          </div>

          <button
            onClick={() => setActiveTab('offers')}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'offers'
                ? 'bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] shadow-lg shadow-[#d4af37]/20 font-extrabold scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1d29]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5" />
              Ofertas VIP & VSLs
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'offers' ? 'bg-[#090a0f] text-[#f5d77f]' : 'bg-[#1a1d29] text-gray-400'}`}>
              {offers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] shadow-lg shadow-[#d4af37]/20 font-extrabold scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1d29]'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5" />
              Chat dos Membros
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] shadow-lg shadow-[#d4af37]/20 font-extrabold scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1d29]'
            }`}
          >
            <User className="w-5 h-5" />
            Minha Conta Supabase
          </button>

          <div className="p-4 rounded-2xl bg-[#1a1d29]/60 border border-[#282c3d] mt-6 text-xs space-y-2">
            <div className="flex items-center gap-2 text-[#f5d77f] font-extrabold">
              <Sparkles className="w-4 h-4" />
              Cloudflare R2 S3
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Vídeos VSL 4K e pacotes de mídia prontos para download com alta velocidade sem limite de dados.
            </p>
          </div>
        </aside>

        {/* CONTEÚDO PRINCIPAL DA ABA */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: OFERTAS VIP COM VSL GRANDE EM DESTAQUE NO TOPO */}
          {activeTab === 'offers' && (
            <div className="space-y-6">
              {/* HEADER DE BUSCA E TÍTULO */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#12141d] p-6 rounded-3xl border border-[#282c3d] shadow-xl">
                <div>
                  <h2 className="font-extrabold text-xl text-white flex items-center gap-2">
                    Ofertas VIP Liberadas pelo Administrador
                    <Flame className="w-5 h-5 text-[#d4af37]" />
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Assista a cada vídeo VSL em alta definição diretamente no player e baixe os pacotes completos de anúncios do Cloudflare R2.
                  </p>
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

              {/* LISTA DE CARDS DE OFERTAS */}
              <div className="space-y-8">
                {filteredOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-[#12141d] border border-[#282c3d] hover:border-[#d4af37]/60 rounded-3xl overflow-hidden transition-all shadow-2xl space-y-6"
                  >
                    {/* VIDEO PLAYER VSL GRANDE EM DESTAQUE NO TOPO DO CARD */}
                    <div className="relative w-full bg-black aspect-video rounded-t-3xl overflow-hidden border-b border-[#282c3d] group">
                      <video
                        controls
                        poster={offer.vslPoster}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      >
                        <source src={offer.vslVideoUrl} type="video/mp4" />
                        Seu navegador não suporta a exibição de vídeos HTML5.
                      </video>

                      {/* BADGE DE RESOLUÇÃO VSL NO VÍDEO */}
                      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
                        <span className="px-3 py-1 rounded-xl bg-[#090a0f]/80 backdrop-blur-md border border-[#d4af37] text-[#f5d77f] text-xs font-extrabold flex items-center gap-1.5 shadow-lg">
                          <Film className="w-4 h-4 text-[#d4af37]" />
                          VSL {offer.vslResolution}
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-emerald-500/80 backdrop-blur-md text-white text-xs font-extrabold flex items-center gap-1 shadow-lg">
                          <Eye className="w-4 h-4" />
                          {offer.viewsCount} visualizações
                        </span>
                      </div>
                    </div>

                    {/* DETALHES DA OFERTA LOGO ABAIXO DO VÍDEO VSL */}
                    <div className="p-6 md:p-8 space-y-6">
                      {/* TÍTULO, CATEGORIA E COMISSÃO */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#282c3d] pb-6">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-[#1a1d29] border border-[#282c3d] text-xs font-bold text-[#f5d77f]">
                              {offer.category}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                              Conversão VSL: {offer.conversionRate}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-2xl text-white mt-2 tracking-tight">{offer.name}</h3>
                        </div>

                        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1a1d29] to-[#090a0f] border border-[#d4af37]/40 text-right shrink-0 shadow-lg">
                          <span className="text-[11px] text-gray-400 uppercase font-bold block">Sua Comissão de Membro VIP</span>
                          <span className="font-extrabold text-xl text-[#f5d77f] tracking-wide block mt-0.5">{offer.commission}</span>
                        </div>
                      </div>

                      {/* DESCRIÇÃO DO PRODUTO */}
                      <div>
                        <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Sobre esta Oferta</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">{offer.description}</p>
                      </div>

                      {/* ÁREA DE DOWNLOADS DO CLOUDFLARE R2 */}
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-extrabold text-[#f5d77f] uppercase tracking-wider flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Central de Downloads da Oferta (Cloudflare R2 Storage)
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* BOTÃO DOWNLOAD VSL */}
                          <div className="p-4 rounded-2xl bg-[#1a1d29] border border-[#282c3d] hover:border-[#d4af37]/40 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                <Film className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-bold text-xs text-white block">Vídeo VSL Completo</span>
                                <span className="text-[11px] text-gray-400 font-mono block truncate max-w-[160px]">{offer.vslFileName}</span>
                              </div>
                            </div>

                            <a
                              href={offer.vslVideoUrl}
                              download={offer.vslFileName}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-[#d4af37]/20 hover:opacity-95 transition-all"
                            >
                              <Download className="w-4 h-4" />
                              Baixar VSL
                            </a>
                          </div>

                          {/* BOTÃO DOWNLOAD CRIATIVOS */}
                          <div className="p-4 rounded-2xl bg-[#1a1d29] border border-[#282c3d] hover:border-[#d4af37]/40 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                                <Package className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-bold text-xs text-white block">Pack Criativos & Anúncios</span>
                                <span className="text-[11px] text-gray-400 font-mono block truncate max-w-[160px]">
                                  {offer.creativeFileName} ({offer.creativeFileSize})
                                </span>
                              </div>
                            </div>

                            <a
                              href={`#download-${offer.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                alert(`Iniciando download seguro do R2: ${offer.creativeFileName}`);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-[#d4af37]/20 hover:opacity-95 transition-all"
                            >
                              <Download className="w-4 h-4" />
                              Baixar Pack
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* LINKS ÚTEIS E BIBLIOTECA DE ANÚNCIOS */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#282c3d]">
                        <div className="flex flex-wrap items-center gap-4">
                          <a
                            href={offer.siteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-xs font-semibold text-gray-200 hover:text-[#f5d77f] hover:border-[#d4af37] flex items-center gap-2 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#d4af37]" />
                            Site Oficial
                          </a>

                          <a
                            href={offer.landingPageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-xs font-semibold text-gray-200 hover:text-[#f5d77f] hover:border-[#d4af37] flex items-center gap-2 transition-all"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            Landing Page
                          </a>

                          <a
                            href={offer.adsLibraryUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-xs font-semibold text-gray-200 hover:text-[#f5d77f] hover:border-[#d4af37] flex items-center gap-2 transition-all"
                          >
                            <Share2 className="w-3.5 h-3.5 text-purple-400" />
                            Ads Library Facebook
                          </a>
                        </div>

                        <button
                          onClick={() => copyToClipboard(offer.landingPageUrl, offer.id)}
                          className="px-4 py-2 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-xs font-bold text-gray-300 hover:text-white flex items-center gap-2 transition-all"
                        >
                          {copiedId === offer.id ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400" />
                              Link de Vendas Copiado!
                            </>
                          ) : (
                            <>
                              <Share2 className="w-4 h-4" />
                              Copiar Link de Divulgação
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CHAT DOS MEMBROS VIP */}
          {activeTab === 'chat' && (
            <div className="bg-[#12141d] border border-[#282c3d] rounded-3xl flex flex-col h-[78vh] shadow-2xl overflow-hidden">
              {/* HEADER CHAT */}
              <div className="p-5 border-b border-[#282c3d] flex items-center justify-between bg-[#1a1d29]/60">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping"></div>
                  <div>
                    <h2 className="font-extrabold text-base text-white">Chat Privado dos Membros VIP</h2>
                    <p className="text-xs text-gray-400">Troque experiências, copies validadas e métricas de anúncios</p>
                  </div>
                </div>
                <span className="text-xs px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-extrabold">
                  ● 48 Membros Online
                </span>
              </div>

              {/* LISTA DE MENSAGENS */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3 items-start">
                    <img src={msg.avatar} alt={msg.user_name} className="w-10 h-10 rounded-full border border-[#d4af37]/40 shrink-0" />
                    <div className="flex-1 bg-[#1a1d29] border border-[#282c3d] rounded-2xl p-4 space-y-1 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-white">{msg.user_name}</span>
                          {msg.user_role === 'admin' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4af37] text-[#090a0f] font-extrabold">ADMIN</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                              MEMBRO VIP
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* INPUT DE MENSAGEM */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-[#282c3d] bg-[#1a1d29]/40 flex gap-3">
                <input
                  type="text"
                  placeholder="Escreva sua mensagem para a comunidade VIP..."
                  className="flex-1 bg-[#1a1d29] border border-[#282c3d] rounded-2xl px-5 py-3 text-xs text-white focus:border-[#d4af37] outline-none shadow-inner"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-extrabold text-xs flex items-center gap-2 shadow-lg hover:opacity-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                  Enviar
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: MINHA CONTA SUPABASE */}
          {activeTab === 'profile' && (
            <div className="bg-[#12141d] border border-[#282c3d] rounded-3xl p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-5 border-b border-[#282c3d] pb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5d77f] via-[#d4af37] to-[#997d2e] p-0.5 shadow-lg">
                  <div className="w-full h-full bg-[#090a0f] rounded-[14px] flex items-center justify-center text-[#f5d77f] font-extrabold text-xl">
                    {userEmail.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h2 className="font-extrabold text-xl text-white">{userName || 'Aluno VIP Club Particular'}</h2>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{userEmail}</p>
                  <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    E-mail Salvo no Supabase Auth SSL
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">Status da sua Assinatura VIP</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-[#1a1d29] border border-[#282c3d] shadow-md">
                    <span className="text-xs text-gray-400 block mb-1">Nível de Acesso</span>
                    <span className="font-bold text-[#f5d77f] text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#d4af37]" />
                      Membro VIP com Acesso Total
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#1a1d29] border border-[#282c3d] shadow-md">
                    <span className="text-xs text-gray-400 block mb-1">Status no Supabase</span>
                    <span className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Ativo & Autenticado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
