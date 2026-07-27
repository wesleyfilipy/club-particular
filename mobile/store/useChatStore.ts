import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  media_url?: string;
  created_at: string;
  deleted_at?: string;
  user_profile?: {
    full_name: string;
    avatar_url: string;
    role: string;
  };
}

interface ChatState {
  messages: ChatMessage[];
  unreadCount: number;
  typingUsers: string[];
  isLoading: boolean;
  activeChannel: any | null;
  fetchMessages: () => Promise<void>;
  sendMessage: (userId: string, content: string, mediaUrl?: string) => Promise<boolean>;
  deleteMessage: (messageId: string, currentUserId: string) => Promise<boolean>;
  setTyping: (userName: string, isTyping: boolean) => void;
  markAsRead: () => void;
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

// Fallback initial chat messages
const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    user_id: 'admin-1',
    content: '🚀 Bem-vindos ao Chat Privado de Membros do Club Particular! Aqui compartilhamos testes de criativos, métricas e copys validadas.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    user_profile: {
      full_name: 'Lucas Founder (Admin)',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      role: 'admin',
    },
  },
  {
    id: 'm2',
    user_id: 'user-2',
    content: 'Galera, acabei de colocar R$ 500 no criativo da VSL do Método Milionário IA e o ROI bateu 3.4x! Impressionante 🔥',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    user_profile: {
      full_name: 'Rodrigo M.',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      role: 'member',
    },
  },
  {
    id: 'm3',
    user_id: 'user-3',
    content: 'Sensacional! Alguém baixou os vídeos para Facebook Ads da oferta de emagrecimento? Qual resolution indicam?',
    created_at: new Date(Date.now() - 600000).toISOString(),
    user_profile: {
      full_name: 'Camila Santos',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
      role: 'member',
    },
  },
];

export const useChatStore = create<ChatState>((set, get) => ({
  messages: INITIAL_CHAT_MESSAGES,
  unreadCount: 0,
  typingUsers: [],
  isLoading: false,
  activeChannel: null,

  fetchMessages: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          user_profile:user_profiles(full_name, avatar_url, role)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        set({ messages: data });
      }
    } catch (err) {
      console.warn('Chat fetch fallback to mock messages:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (userId, content, mediaUrl) => {
    try {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        user_id: userId,
        content,
        media_url: mediaUrl,
        created_at: new Date().toISOString(),
        user_profile: {
          full_name: 'Você',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300',
          role: 'member',
        },
      };

      // Optimistic update
      set((state) => ({ messages: [...state.messages, newMessage] }));

      // Supabase Insert
      await supabase.from('chat_messages').insert({
        user_id: userId,
        content,
        media_url: mediaUrl,
      });

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    }
  },

  deleteMessage: async (messageId, currentUserId) => {
    try {
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      }));

      await supabase
        .from('chat_messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId);

      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      return false;
    }
  },

  setTyping: (userName, isTyping) => {
    set((state) => {
      const existing = state.typingUsers.filter((u) => u !== userName);
      return {
        typingUsers: isTyping ? [...existing, userName] : existing,
      };
    });
  },

  markAsRead: () => set({ unreadCount: 0 }),

  subscribeRealtime: () => {
    const channel = supabase
      .channel('chat_room')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name, avatar_url, role')
            .eq('id', payload.new.user_id)
            .single();

          const incomingMsg: ChatMessage = {
            id: payload.new.id,
            user_id: payload.new.user_id,
            content: payload.new.content,
            media_url: payload.new.media_url,
            created_at: payload.new.created_at,
            user_profile: profile || {
              full_name: 'Membro VIP',
              avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300',
              role: 'member',
            },
          };

          set((state) => ({
            messages: [...state.messages, incomingMsg],
            unreadCount: state.unreadCount + 1,
          }));
        }
      )
      .subscribe();

    set({ activeChannel: channel });
  },

  unsubscribeRealtime: () => {
    const { activeChannel } = get();
    if (activeChannel) {
      supabase.removeChannel(activeChannel);
      set({ activeChannel: null });
    }
  },
}));
