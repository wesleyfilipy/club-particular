import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummykeyforclubparticular';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'member' | 'moderator';
  avatar_url?: string;
}

/**
 * Consulta a role oficial do usuário autenticado no Supabase user_profiles
 */
export async function getUserRoleFromSupabase(userId?: string): Promise<'admin' | 'member'> {
  try {
    let targetId = userId;
    if (!targetId) {
      const { data: { session } } = await supabase.auth.getSession();
      targetId = session?.user?.id;
    }

    if (!targetId) return 'member';

    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', targetId)
      .single();

    if (error) {
      console.warn('Erro ao consultar role do usuário:', error.message);
      return 'member';
    }

    if (data && data.role === 'admin') {
      return 'admin';
    }
  } catch (err) {
    console.warn('Consulta de role no Supabase:', err);
  }

  return 'member';
}
