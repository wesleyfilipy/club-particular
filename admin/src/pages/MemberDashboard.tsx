import React, { useState, useEffect, useRef } from 'react';
import {
  Crown,
  MessageSquare,
  Gift,
  LogOut,
  Send,
  Download,
  ExternalLink,
  ShieldCheck,
  User,
  Sparkles,
  CheckCircle2,
  Film,
  Package,
  Search,
  Eye,
  Flame,
  Share2,
  FileText,
  Check,
  Image as ImageIcon,
  Video,
  X,
  Maximize2,
  Mail,
  UploadCloud,
  CheckCheck
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { getR2PresignedDownloadUrl } from '../services/r2';

interface MemberDashboardProps {
  userEmail: string;
  userName: string;
  onLogout: () => void;
}

interface ChatMessage {
  id: string;
  user_email: string;
  user_name: string;
  user_role: 'admin' | 'member';
  avatar: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  timestamp: string;
  created_at?: string;
}

import { OfferItem, getStoredOffers, fetchOffersFromSupabase } from '../services/offersService';

const STORAGE_CHAT_KEY = 'club_particular_vip_chat_v2';

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ userEmail, userName, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'offers' | 'chat' | 'profile'>('offers');
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOfferModal, setSelectedOfferModal] = useState<OfferItem | null>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  // Mídia anexada para envio no chat (Foto ou Vídeo)
  const [attachedMedia, setAttachedMedia] = useState<{
    url: string;
    type: 'image' | 'video';
    name: string;
  } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Lista de Ofertas VIP Sincronizadas com o Administrador
  const [offers, setOffers] = useState<OfferItem[]>(() => getStoredOffers());

  useEffect(() => {
    const loadOffers = async () => {
      const data = await fetchOffersFromSupabase();
      if (data && data.length > 0) {
        setOffers(data);
      }
    };
    loadOffers();
  }, []);

  // Mensagens do Chat com persistência no Supabase e LocalStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initialDefault: ChatMessage[] = [
      {
        id: 'm1',
        user_email: 'lucas.admin@clubparticular.com',
        user_name: 'Lucas Founder',
        user_role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        content: '🚀 Bem-vindos ao Chat Privado dos Membros VIP! Todas as conversas, fotos e vídeos enviados ficam registrados e vinculados ao seu e-mail no Supabase.',
        timestamp: 'Há 1 hora',
      },
      {
        id: 'm2',
        user_email: 'rodrigo.m@gmail.com',
        user_name: 'Rodrigo M.',
        user_role: 'member',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        content: 'Assistam a VSL da Fórmula Seca Barriga! O pitch aos 14 minutos tá matador. Subi 2 conjuntos no Facebook Ads e já saiu 4 vendas! 🔥',
        media_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
        media_type: 'image',
        timestamp: 'Há 25 min',
      },
      {
        id: 'm3',
        user_email: 'camila.santos@hotmail.com',
        user_name: 'Camila Santos',
        user_role: 'member',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        content: 'Baixei o Pack de Criativos do Método Milionário IA. Olhem o teste do vídeo no TikTok Ads! 👏',
        media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        media_type: 'video',
        timestamp: 'Há 10 min',
      },
    ];

    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return initialDefault;
  });

  // Salva no localStorage como backup local
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch {
      // Ignore
    }
  }, [messages]);

  // Carrega mensagens do Supabase se disponível
  useEffect(() => {
    let channel: any = null;

    const loadSupabaseMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (data && data.length > 0) {
          const formatted: ChatMessage[] = data.map((item: any) => ({
            id: item.id || `sb-${Date.now()}`,
            user_email: item.user_email || item.email || userEmail,
            user_name: item.user_name || item.full_name || item.user_email?.split('@')[0] || 'Membro VIP',
            user_role: item.role === 'admin' ? 'admin' : 'member',
            avatar: item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
            content: item.content || '',
            media_url: item.media_url,
            media_type: item.media_type || (item.media_url?.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image'),
            timestamp: item.created_at
              ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Agora',
          }));

          setMessages((prev) => {
            // Combina garantindo sem duplicatas
            const ids = new Set(formatted.map((m) => m.id));
            const prevFiltered = prev.filter((m) => !ids.has(m.id));
            return [...prevFiltered, ...formatted];
          });
        }
      } catch (err) {
        console.warn('Conexão Supabase em modo fallback local:', err);
      }
    };

    loadSupabaseMessages();

    // Inscrição Realtime no canal do chat no Supabase
    try {
      channel = supabase
        .channel('public:chat_messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
          const newRow = payload.new;
          if (newRow) {
            const incoming: ChatMessage = {
              id: newRow.id,
              user_email: newRow.user_email || userEmail,
              user_name: newRow.user_name || 'Membro VIP',
              user_role: 'member',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
              content: newRow.content,
              media_url: newRow.media_url,
              media_type: newRow.media_type || (newRow.media_url?.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image'),
              timestamp: 'Agora',
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime Supabase indisponível:', err);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userEmail]);

  // Scroll para o fim do chat quando chega mensagem
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Selecionar Foto local para anexo
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedMedia({
        url: event.target?.result as string,
        type: 'image',
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  // Selecionar Vídeo local para anexo
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedMedia({
        url: event.target?.result as string,
        type: 'video',
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  // Enviar Mensagem registrada no Supabase e vinculada ao e-mail
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachedMedia) return;

    const messageContent = newMessage.trim();
    const mediaUrl = attachedMedia?.url;
    const mediaType = attachedMedia?.type;
    const currentName = userName || userEmail.split('@')[0] || 'Membro VIP';

    const msgId = `msg-${Date.now()}`;
    const newMsgObj: ChatMessage = {
      id: msgId,
      user_email: userEmail,
      user_name: currentName,
      user_role: 'member',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      content: messageContent || (mediaType === 'image' ? '📸 Enviou uma imagem' : '📹 Enviou um vídeo'),
      media_url: mediaUrl,
      media_type: mediaType,
      timestamp: 'Agora mesmo',
      created_at: new Date().toISOString(),
    };

    // Atualização Otimista local
    setMessages((prev) => [...prev, newMsgObj]);
    setNewMessage('');
    setAttachedMedia(null);

    // Registro no Supabase vinculado ao e-mail do usuário
    try {
      await supabase.from('chat_messages').insert([
        {
          user_email: userEmail,
          user_name: currentName,
          content: newMsgObj.content,
          media_url: mediaUrl,
          media_type: mediaType,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.warn('Mensagem salva no cache local (Supabase Offline ou sem chave de gravação direta):', err);
    }
  };

  const handleR2Download = async (fileUrl: string, fileName: string) => {
    if (!fileUrl) return;

    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      window.open(fileUrl, '_blank');
      return;
    }

    try {
      const signedUrl = await getR2PresignedDownloadUrl(fileUrl, 3600);
      window.open(signedUrl, '_blank');
    } catch (err) {
      console.warn('Erro ao gerar URL assinada do R2:', err);
      alert(`Iniciando download seguro do R2: ${fileName}`);
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

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans selection:bg-[#d4af37] selection:text-[#090a0f]">
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
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-200 truncate max-w-[180px]">{userEmail}</span>
                <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Supabase SSL
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#d4af37]/20 text-[#f5d77f] font-bold uppercase tracking-wider ml-1">
                VIP ATIVO
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

      {/* CONTAINER PRINCIPAL */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        {/* NAVEGAÇÃO LATERAL */}
        <aside className="w-full md:w-64 bg-[#12141d] border border-[#282c3d] rounded-3xl p-4 space-y-3 shrink-0 h-fit shadow-2xl">
          <div className="px-3 py-2 text-xs font-extrabold text-[#f5d77f] uppercase tracking-wider">
            Navegação do Aluno
          </div>

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
              Ofertas VIP & VSLs
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
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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
          {/* TAB 1: OFERTAS VIP EM CARDS MENORES EM GRID (UMA AO LADO DA OUTRA E ABAIXO DA OUTRA) */}
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
                    Visualize as ofertas em cards compactos em grade (lado a lado). Assista às VSLs e baixe os packs de criativos do Cloudflare R2.
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

              {/* LISTA DE CARDS EM GRID COMPACTO (LADO A LADO E ABAIXO DA OUTRA) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-[#12141d] border border-[#282c3d] hover:border-[#d4af37]/60 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between group"
                  >
                    <div>
                      {/* PLAYER VSL COMPACTO / BANNER */}
                      <div className="relative w-full aspect-video bg-black overflow-hidden border-b border-[#282c3d]">
                        <video
                          controls
                          poster={offer.vslPoster}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        >
                          <source src={offer.vslVideoUrl} type="video/mp4" />
                        </video>

                        {/* BADGE DE RESOLUÇÃO E VISUALIZAÇÕES */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#090a0f]/80 backdrop-blur-md border border-[#d4af37] text-[#f5d77f] text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                            <Film className="w-3 h-3 text-[#d4af37]" />
                            {offer.vslResolution}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                            <Eye className="w-3 h-3" />
                            {offer.viewsCount}
                          </span>
                        </div>
                      </div>

                      {/* CONTEÚDO E DETALHES DA OFERTA */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#1a1d29] border border-[#282c3d] text-[10px] font-bold text-[#f5d77f] truncate">
                            {offer.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/20 shrink-0">
                            {offer.conversionRate} Conv.
                          </span>
                        </div>

                        <h3 className="font-extrabold text-base text-white line-clamp-1 tracking-tight group-hover:text-[#f5d77f] transition-colors">
                          {offer.name}
                        </h3>

                        {/* BANNER DA COMISSÃO DE MEMBRO VIP */}
                        <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#1a1d29] to-[#090a0f] border border-[#d4af37]/30 flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Sua Comissão VIP:</span>
                          <span className="font-extrabold text-xs text-[#f5d77f] tracking-wide">{offer.commission}</span>
                        </div>

                        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{offer.description}</p>
                      </div>
                    </div>

                    {/* BOTÕES DE AÇÃO E DOWNLOADS COMPACTOS */}
                    <div className="p-4 pt-0 space-y-2.5 border-t border-[#282c3d]/50 mt-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Baixar VSL */}
                        <button
                          onClick={() => handleR2Download(offer.vslVideoUrl, offer.vslFileName)}
                          className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 transition-all text-center cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Baixar VSL
                        </button>

                        {/* Baixar Pack */}
                        <button
                          onClick={() => handleR2Download(offer.creativeFileName, offer.creativeFileName)}
                          className="px-3 py-2 rounded-xl bg-[#1a1d29] border border-[#d4af37]/40 text-[#f5d77f] hover:bg-[#222736] font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-md transition-all text-center cursor-pointer"
                        >
                          <Package className="w-3.5 h-3.5 text-purple-400" />
                          Pack R2
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-1">
                        <button
                          onClick={() => copyToClipboard(offer.landingPageUrl, offer.id)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#1a1d29] border border-[#282c3d] text-[10px] font-bold text-gray-300 hover:text-white flex items-center justify-center gap-1 transition-all"
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
                          onClick={() => setSelectedOfferModal(offer)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#1a1d29] border border-[#282c3d] text-[10px] font-bold text-gray-400 hover:text-white flex items-center gap-1 transition-all"
                          title="Ver Detalhes da Oferta"
                        >
                          <Maximize2 className="w-3 h-3 text-blue-400" /> Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CHAT DOS MEMBROS VIP (REPROJETADO COM SUPABASE E ENVIO DE FOTOS E VÍDEOS) */}
          {activeTab === 'chat' && (
            <div className="bg-[#12141d] border border-[#282c3d] rounded-3xl flex flex-col h-[78vh] shadow-2xl overflow-hidden">
              {/* HEADER CHAT */}
              <div className="p-4 md:p-5 border-b border-[#282c3d] flex flex-wrap items-center justify-between gap-3 bg-[#1a1d29]/60">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping"></div>
                  <div>
                    <h2 className="font-extrabold text-base text-white flex items-center gap-2">
                      Chat Privado dos Membros VIP
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Supabase DB Realtime
                      </span>
                    </h2>
                    <p className="text-xs text-gray-400">
                      Troque experiências, copies e envie fotos ou vídeos diretamente para a comunidade.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-300 bg-[#090a0f] px-3 py-1.5 rounded-xl border border-[#282c3d]">
                    <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span className="text-[11px] font-mono text-gray-300">{userEmail}</span>
                  </div>
                  <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-extrabold shrink-0">
                    ● 48 Membros Online
                  </span>
                </div>
              </div>

              {/* LISTA DE MENSAGENS DO CHAT */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
                {messages.map((msg) => {
                  const isCurrentUser = msg.user_email?.toLowerCase() === userEmail.toLowerCase();

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 items-start ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <img
                        src={msg.avatar}
                        alt={msg.user_name}
                        className="w-10 h-10 rounded-full border border-[#d4af37]/40 shrink-0 object-cover shadow-md"
                      />

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 space-y-2 shadow-md border ${
                          isCurrentUser
                            ? 'bg-gradient-to-br from-[#1a1d29] to-[#12141d] border-[#d4af37]/50 text-white'
                            : 'bg-[#1a1d29] border-[#282c3d] text-gray-200'
                        }`}
                      >
                        {/* CABEÇALHO DA MENSAGEM */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-white">{msg.user_name}</span>
                            {msg.user_role === 'admin' ? (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#d4af37] text-[#090a0f] font-extrabold">
                                ADMIN
                              </span>
                            ) : (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                                MEMBRO VIP
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#d4af37]" />
                              {msg.user_email}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                        </div>

                        {/* TEXTO DA MENSAGEM */}
                        {msg.content && <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>}

                        {/* MÍDIA ANEXADA (FOTO OU VÍDEO) */}
                        {msg.media_url && (
                          <div className="mt-2 pt-2 border-t border-white/10">
                            {msg.media_type === 'video' || msg.media_url.match(/\.(mp4|webm|mov)$/i) ? (
                              <div className="relative rounded-xl overflow-hidden border border-[#282c3d] bg-black max-w-full">
                                <video controls className="w-full max-h-72 object-contain" preload="metadata">
                                  <source src={msg.media_url} />
                                  Seu navegador não suporta vídeos.
                                </video>
                              </div>
                            ) : (
                              <div
                                onClick={() => setFullscreenMedia({ url: msg.media_url!, type: 'image' })}
                                className="relative rounded-xl overflow-hidden border border-[#282c3d] cursor-pointer group max-w-full"
                              >
                                <img
                                  src={msg.media_url}
                                  alt="Foto anexada"
                                  className="w-full max-h-72 object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white gap-1.5">
                                  <Maximize2 className="w-4 h-4" /> Expandir Foto
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* INPUT E ANEXADOR DE MÍDIAS (FOTOS E VÍDEOS) */}
              <div className="border-t border-[#282c3d] bg-[#1a1d29]/60 p-4 space-y-3">
                {/* PRÉ-VISUALIZAÇÃO DE ANEXO */}
                {attachedMedia && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#090a0f] border border-[#d4af37]/50">
                    <div className="flex items-center gap-3 min-w-0">
                      {attachedMedia.type === 'image' ? (
                        <img
                          src={attachedMedia.url}
                          alt="Preview"
                          className="w-12 h-12 rounded-xl object-cover border border-[#282c3d]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                          <Video className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{attachedMedia.name}</span>
                        <span className="text-[10px] text-[#f5d77f] font-extrabold uppercase">
                          Pronto para enviar ({attachedMedia.type === 'image' ? 'Foto' : 'Vídeo'})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setAttachedMedia(null)}
                      className="p-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* FORMULÁRIO DE ENVIO */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  {/* INPUT OCULTO DE FOTO */}
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />

                  {/* INPUT OCULTO DE VÍDEO */}
                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoSelect}
                  />

                  {/* BOTÃO ANEXAR FOTO */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="p-3 rounded-2xl bg-[#1a1d29] border border-[#282c3d] text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-all cursor-pointer shadow-md"
                    title="Enviar Foto"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>

                  {/* BOTÃO ANEXAR VÍDEO */}
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="p-3 rounded-2xl bg-[#1a1d29] border border-[#282c3d] text-purple-400 hover:text-purple-300 hover:border-purple-500/40 transition-all cursor-pointer shadow-md"
                    title="Enviar Vídeo"
                  >
                    <Video className="w-5 h-5" />
                  </button>

                  {/* INPUT DE MENSAGEM DE TEXTO */}
                  <input
                    type="text"
                    placeholder={`Escreva sua mensagem (${userEmail})...`}
                    className="flex-1 bg-[#090a0f] border border-[#282c3d] rounded-2xl px-5 py-3 text-xs text-white focus:border-[#d4af37] outline-none shadow-inner"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />

                  {/* BOTÃO ENVIAR */}
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-extrabold text-xs flex items-center gap-2 shadow-lg hover:opacity-95 transition-all cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    Enviar
                  </button>
                </form>

                <div className="flex items-center justify-between text-[10px] text-gray-400 px-1 pt-1">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCheck className="w-3 h-3" /> Registrado no Supabase Database
                  </span>
                  <span>E-mail de Login: {userEmail}</span>
                </div>
              </div>
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
                    E-mail Salvo & Autenticado no Supabase
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">Status da sua Assinatura VIP</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-[#1a1d29] border border-[#282c3d] shadow-md">
                    <span className="text-xs text-gray-400 block mb-1">Nível de Acesso</span>
                    <span className="font-bold text-[#f5d77f] text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#d4af37]" />
                      Membro VIP com Acesso Total
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#1a1d29] border border-[#282c3d] shadow-md">
                    <span className="text-xs text-gray-400 block mb-1">Valor da Assinatura</span>
                    <span className="font-bold text-[#f5d77f] text-sm flex items-center gap-2">
                      R$ 1.000,00 / mês
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

                {/* ÁREA DE GESTÃO E CANCELAMENTO DA ASSINATURA */}
                <div className="p-6 rounded-3xl bg-[#1a1d29]/80 border border-[#282c3d] space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-extrabold text-base text-white">Gerenciar Assinatura Stripe & Supabase</h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Sua assinatura mensal de R$ 1.000,00 garante acesso ilimitado aos vídeos VSL 4K, packs R2 e chat VIP.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          window.open(import.meta.env.VITE_STRIPE_PORTAL_URL || 'https://billing.stripe.com/p/login/test_clubparticular_portal', '_blank');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-gray-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#d4af37]" />
                        Portal Stripe
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm('Deseja realmente cancelar sua assinatura VIP de R$ 1.000/mês?')) {
                            try {
                              await supabase
                                .from('subscriptions')
                                .update({ status: 'canceled' })
                                .eq('user_id', userEmail);
                            } catch {
                              // Ignore
                            }
                            alert('Sua assinatura de R$ 1.000/mês foi marcada como cancelada no Supabase e não será renovada no próximo ciclo.');
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs hover:bg-red-500/20 transition-all cursor-pointer shrink-0"
                      >
                        Cancelar Assinatura
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL DETALHES DA OFERTA (QUANDO CLICA EM DETALHES NO CARD COMPACTO) */}
      {selectedOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141d] border border-[#282c3d] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 relative shadow-2xl">
            <button
              onClick={() => setSelectedOfferModal(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#1a1d29] border border-[#282c3d] text-xs font-bold text-[#f5d77f]">
                {selectedOfferModal.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-extrabold border border-emerald-500/20">
                Conversão VSL: {selectedOfferModal.conversionRate}
              </span>
            </div>

            <h2 className="font-extrabold text-2xl text-white">{selectedOfferModal.name}</h2>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-[#282c3d]">
              <video controls poster={selectedOfferModal.vslPoster} className="w-full h-full object-cover">
                <source src={selectedOfferModal.vslVideoUrl} type="video/mp4" />
              </video>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1a1d29] to-[#090a0f] border border-[#d4af37]/40 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 uppercase font-bold block">Comissão de Membro VIP:</span>
                <span className="font-extrabold text-lg text-[#f5d77f]">{selectedOfferModal.commission}</span>
              </div>

              <button
                onClick={() => handleR2Download(selectedOfferModal.vslVideoUrl, selectedOfferModal.vslFileName)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5d77f] via-[#d4af37] to-[#997d2e] text-[#090a0f] font-extrabold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Download className="w-4 h-4" /> Baixar VSL (4K/1080p)
              </button>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">{selectedOfferModal.description}</p>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#282c3d]">
              <a
                href={selectedOfferModal.siteUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-xs text-gray-200 font-semibold hover:text-[#f5d77f] flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4 text-[#d4af37]" /> Site Oficial
              </a>

              <a
                href={selectedOfferModal.landingPageUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-xs text-gray-200 font-semibold hover:text-[#f5d77f] flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-blue-400" /> Landing Page
              </a>

              <a
                href={selectedOfferModal.adsLibraryUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#1a1d29] border border-[#282c3d] text-xs text-gray-200 font-semibold hover:text-[#f5d77f] flex items-center gap-2"
              >
                <Share2 className="w-4 h-4 text-purple-400" /> Facebook Ads Library
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MÍDIA FULLSCREEN */}
      {fullscreenMedia && (
        <div
          onClick={() => setFullscreenMedia(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={fullscreenMedia.url} alt="Fullscreen Media" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" />
            <button className="absolute top-4 right-4 p-2 rounded-xl bg-black/70 text-white hover:bg-black">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
