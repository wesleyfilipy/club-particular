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

// Lista de e-mails com permissão de Administrador
export const ADMIN_EMAILS = [
  'wesleyfilipy454@gmail.com',
  'admin@clubparticular.com'
];

/**
 * Consulta a role do usuário no Supabase user_profiles
 */
export async function getUserRoleFromSupabase(email: string): Promise<'admin' | 'member'> {
  const cleanEmail = email.toLowerCase().trim();

  // Verificação direta para e-mails de fundador
  if (ADMIN_EMAILS.includes(cleanEmail)) {
    return 'admin';
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('email', cleanEmail)
      .single();

    if (data && data.role) {
      return data.role === 'admin' ? 'admin' : 'member';
    }
  } catch (err) {
    console.warn('Consulta de role no banco Supabase:', err);
  }

  return 'member';
}
