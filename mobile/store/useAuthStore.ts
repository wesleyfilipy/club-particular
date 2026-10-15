import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { checkSubscriptionStatus } from '../services/stripe';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: 'member' | 'moderator' | 'admin';
}

interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isSubscribed: boolean;
  subscriptionStatus: 'active' | 'canceled' | 'expired' | 'checking';
  initializeAuth: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (fullName: string, email: string, pass: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  verifySubscription: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isSubscribed: false,
  subscriptionStatus: 'expired',

  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch User Profile
        const { data: profile } = await supabase
          .from('es_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const userProfile: UserProfile = profile || {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || 'Membro VIP',
          role: 'member',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        };

        set({ user: userProfile, session });
        await get().verifySubscription();
      } else {
        set({
          user: null,
          session: null,
          isSubscribed: false,
          subscriptionStatus: 'expired',
        });
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      set({ user: null, session: null, isSubscribed: false, subscriptionStatus: 'expired' });
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };

      if (data.session && data.user) {
        const { data: profile } = await supabase
          .from('es_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({
          session: data.session,
          user: profile || {
            id: data.user.id,
            email: data.user.email || email,
            full_name: 'Membro VIP',
            role: 'member',
          },
        });
        await get().verifySubscription();
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Falha ao realizar login' };
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (fullName, email, password) => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'member' },
        },
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Falha ao cadastrar conta' };
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isSubscribed: false, subscriptionStatus: 'expired' });
  },

  verifySubscription: async () => {
    const user = get().user;
    if (!user) return false;

    set({ subscriptionStatus: 'checking' });
    const isActive = await checkSubscriptionStatus(user.id);
    set({
      isSubscribed: isActive,
      subscriptionStatus: isActive ? 'active' : 'expired',
    });
    return isActive;
  },
}));
