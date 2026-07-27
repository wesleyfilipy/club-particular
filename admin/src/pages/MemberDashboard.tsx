import React, { useState, useEffect } from 'react';
import { Crown, MessageSquare, Gift, LogOut, Send, Download, ExternalLink, ShieldCheck, User, Sparkles, CheckCircle2, Film, Package, Search } from 'lucide-react';
import { supabase } from '../services/supabase';

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

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ userEmail, userName, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'offers' | 'profile'>('chat');
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Initial active chat messages for members
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      user_name: 'Lucas Founder (Admin)',
      user_role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      content: '🚀 Bem-vindos ao Chat Exclusivo de Membros VIP do Club Particular! Todas as mídias VSL e pacotes de criativos postados no painel já foram validados.',
      timestamp: 'Há 1 hora',
    },
    {
      id: 'm2',
      user_name: 'Rodrigo M.',
      user_role: 'member',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      content: 'Pessoal, a VSL 4K da oferta Fórmula Seca Barriga tá convertendo MUITO! Subi R$ 300 de orçamento hoje e o ROI bateu 3.8x 🔥',
      timestamp: 'Há 35 min',
    },
    {
      id: 'm3',
      user_name: 'Camila Santos',
      user_role: 'member',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      content: 'Alguém mais baixou o Pack de Criativos Canva do Método Milionário IA? Os vídeos de anúncios pro TikTok Ads tão sensacionais 👏',
      timestamp: 'Há 12 min',
    },
  ]);

  // Offers added by admin for members to use
  const [offers] = useState([
    {
      id: 'oferta-001',
      name: 'Fórmula Seca Barriga Natural 3.0',
      category: 'Saúde & Emagrecimento',
      commission: '80% (R$ 157,60)',
      description: 'Oferta campeã de vendas no nicho de saúde. Inclui VSL de alta conversão em 4K e pack completo de anúncios para Facebook Ads.',
      siteUrl: 'https://formulaseca.com.br',
      landingPageUrl: 'https://formulaseca.com.br/pv-oficial',
      adsLibraryUrl: 'https://facebook.com/ads/library',
      vslFileName: 'vsl_formula_seca_4k.mp4',
      vslFileKey: 'offers/oferta-001/vsl/vsl_formula_seca_4k.mp4',
      creativeFileName: 'pack_anuncios_criativos_canva.zip',
      creativeFileKey: 'offers/oferta-001/creatives/pack_anuncios_criativos_canva.zip',
      conversionRate: '8.4%',
    },
    {
      id: 'oferta-002',
      name: 'Método Milionário com IA (MMIA)',
      category: 'Renda Extra & Finanças',
      commission: '75% (R$ 222,75)',
      description: 'Treinamento completo mostrando como criar renda extra usando inteligência artificial. VSL com narração profissional e 15 criativos.',
      siteUrl: 'https://metodomilionarioia.com',
      landingPageUrl: 'https://metodomilionarioia.com/vsl-full',
      adsLibraryUrl: 'https://facebook.com/ads/library',
      vslFileName: 'vsl_mmia_master_1080p.mp4',
      vslFileKey: 'offers/oferta-002/vsl/vsl_mmia_master_1080p.mp4',
      creativeFileName: 'video_ad_facebook_tiktok_pack.zip',
      creativeFileKey: 'offers/oferta-002/creatives/video_ad_facebook_tiktok_pack.zip',
      conversionRate: '9.1%',
    },
    {
      id: 'oferta-003',
      name: 'Código Secreto da Sedução Suprema',
      category: 'Relacionamento & Conquista',
      commission: '80% (R$ 140,00)',
      description: 'Ebook + Áudios Guia sobre desenvolvimento pessoal e atração masculina. VSL engajante com alto retenção de audiência.',
      siteUrl: 'https://codigoseducao.com.br',
      landingPageUrl: 'https://codigoseducao.com.br/vsl-pv',
      adsLibraryUrl: 'https://facebook.com/ads/library',
      vslFileName: 'vsl_seduction_master.mp4',
      vslFileKey: 'offers/oferta-003/vsl/vsl_seduction_master.mp4',
      creativeFileName: 'criativos_banners_pack.zip',
      creativeFileKey: 'offers/oferta-003/creatives/criativos_banners_pack.zip',
      conversionRate: '7.8%',
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

  const filteredOffers = offers.filter(
    (o) =>
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col">
      {/* Top Header Aluno */}
      <header className="bg-[#12141d] border-b border-[#282c3d] px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 border border-[#d4af37] flex items-center justify-center">
            <Crown className="w-5 h-5 text-[#d4af37]" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wider gold-text-gradient">CLUB PARTICULAR</h1>
            <p className="text-xs text-gray-400">Área de Membros VIP & Alunos</p>
          </div>
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1d29] border border-[#282c3d]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-gray-300 truncate max-w-[180px]">{userEmail}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#d4af37]/20 text-[#f5d77f] font-bold uppercase">VIP</span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        {/* Navigation Sidebar / Tabs */}
        <aside className="w-full md:w-64 bg-[#12141d] border border-[#282c3d] rounded-2xl p-4 space-y-2 shrink-0 h-fit">
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] shadow-lg font-bold'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1d29]'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Chat dos Membros VIP
          </button>

          <button
            onClick={() => setActiveTab('offers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'offers'
                ? 'bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] shadow-lg font-bold'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1d29]'
            }`}
          >
            <Gift className="w-5 h-5" />
            Ofertas VIP Adicionadas ({offers.length})
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] shadow-lg font-bold'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1d29]'
            }`}
          >
            <User className="w-5 h-5" />
            Minha Conta no Supabase
          </button>
        </aside>

        {/* Tab Body */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: CHAT DOS MEMBROS */}
          {activeTab === 'chat' && (
            <div className="bg-[#12141d] border border-[#282c3d] rounded-2xl flex flex-col h-[75vh]">
              {/* Chat Title */}
              <div className="p-4 border-b border-[#282c3d] flex items-center justify-between bg-[#1a1d29]/50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                  <div>
                    <h2 className="font-extrabold text-base text-white">Chat Privado dos Membros VIP</h2>
                    <p className="text-xs text-gray-400">Troque experiências, métricas de anúncios e dúvidas sobre as ofertas</p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  ● 48 Membros Online
                </span>
              </div>

              {/* Messages Container */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3 items-start">
                    <img src={msg.avatar} alt={msg.user_name} className="w-10 h-10 rounded-full border border-[#d4af37]/40 shrink-0" />
                    <div className="flex-1 bg-[#1a1d29] border border-[#282c3d] rounded-2xl p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{msg.user_name}</span>
                          {msg.user_role === 'admin' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4af37] text-[#090a0f] font-extrabold">ADMIN</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">MEMBRO VIP</span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Form Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-[#282c3d] bg-[#1a1d29]/40 flex gap-2 rounded-b-2xl">
                <input
                  type="text"
                  placeholder="Escreva sua mensagem para a comunidade VIP..."
                  className="flex-1 bg-[#1a1d29] border border-[#282c3d] rounded-xl px-4 py-3 text-xs text-white focus:border-[#d4af37] outline-none"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-bold text-xs flex items-center gap-2 shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  Enviar
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: OFERTAS ADICIONADAS PELO ADMINISTRADOR */}
          {activeTab === 'offers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#12141d] p-4 rounded-2xl border border-[#282c3d]">
                <div>
                  <h2 className="font-extrabold text-lg text-white">Ofertas VIP Liberadas pelo Administrador</h2>
                  <p className="text-xs text-gray-400">Baixe os vídeos de VSL em 4K e os pacotes de criativos prontos para rodar no Facebook & TikTok Ads.</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar oferta..."
                    className="w-full bg-[#1a1d29] border border-[#282c3d] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-[#d4af37] outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Offers Grid */}
              <div className="grid grid-cols-1 gap-4">
                {filteredOffers.map((offer) => (
                  <div key={offer.id} className="bg-[#12141d] border border-[#282c3d] rounded-2xl p-6 space-y-4 hover:border-[#d4af37]/40 transition-all">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#282c3d] pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#1a1d29] border border-[#282c3d] text-[10px] font-semibold text-[#f5d77f]">
                            {offer.category}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                            Taxa Média Conv: {offer.conversionRate}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-base text-white mt-1">{offer.name}</h3>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-gray-400 block">Sua Comissão de Membro</span>
                        <span className="font-extrabold text-base text-[#d4af37]">{offer.commission}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">{offer.description}</p>

                    {/* MÍDIAS DA OFERTA PARA DOWNLOAD */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-[#1a1d29] border border-[#282c3d] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <Film className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-white block">Vídeo de VSL (4K)</span>
                            <span className="text-[10px] text-gray-400 truncate block max-w-[150px]">{offer.vslFileName}</span>
                          </div>
                        </div>

                        <a
                          href={`#download-${offer.id}`}
                          onClick={(e) => { e.preventDefault(); alert(`Iniciando download do Cloudflare R2: ${offer.vslFileName}`); }}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-bold text-[11px] flex items-center gap-1 shadow"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Baixar VSL
                        </a>
                      </div>

                      <div className="p-3 rounded-xl bg-[#1a1d29] border border-[#282c3d] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-white block">Pack de Criativos</span>
                            <span className="text-[10px] text-gray-400 truncate block max-w-[150px]">{offer.creativeFileName}</span>
                          </div>
                        </div>

                        <a
                          href={`#download-creatives-${offer.id}`}
                          onClick={(e) => { e.preventDefault(); alert(`Iniciando download do Cloudflare R2: ${offer.creativeFileName}`); }}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-bold text-[11px] flex items-center gap-1 shadow"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Baixar Pack
                        </a>
                      </div>
                    </div>

                    {/* LINKS DA OFERTA */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <a
                        href={offer.siteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-gray-300 hover:text-[#d4af37] flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Site Oficial
                      </a>
                      <a
                        href={offer.landingPageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-gray-300 hover:text-[#d4af37] flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Landing Page
                      </a>
                      <a
                        href={offer.adsLibraryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-gray-300 hover:text-[#d4af37] flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Biblioteca de Anúncios FB
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MINHA CONTA SUPABASE */}
          {activeTab === 'profile' && (
            <div className="bg-[#12141d] border border-[#282c3d] rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-4 border-b border-[#282c3d] pb-6">
                <div className="w-16 h-16 rounded-full bg-[#d4af37]/10 border border-[#d4af37] flex items-center justify-center text-[#d4af37] font-extrabold text-xl">
                  {userEmail.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-extrabold text-lg text-white">{userName || 'Aluno VIP Club Particular'}</h2>
                  <p className="text-xs text-gray-400 font-mono">{userEmail}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    E-mail Salvo no Supabase Auth
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <h3 className="font-extrabold text-white text-sm">Status da sua Assinatura VIP</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#282c3d]">
                    <span className="text-gray-400 block mb-1">Nível de Acesso</span>
                    <span className="font-bold text-[#f5d77f] text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#d4af37]" />
                      Membro VIP com Acesso Total
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#282c3d]">
                    <span className="text-gray-400 block mb-1">Status da Conta</span>
                    <span className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Ativo & Autenticado no Supabase
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
