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

export const ADMIN_EMAILS = [
  'inteligenciaartificial558@gmail.com'
];

/**
 * Consulta a role oficial do usuário no Supabase user_profiles ou e-mails autorizados de fundador
 */
export async function getUserRoleFromSupabase(userIdOrEmail?: string, emailParam?: string): Promise<'admin' | 'member'> {
  try {
    let emailToTest = emailParam;
    let userIdToTest = userIdOrEmail;

    if (userIdOrEmail && userIdOrEmail.includes('@')) {
      emailToTest = userIdOrEmail;
      userIdToTest = undefined;
    }

    const cleanEmail = emailToTest?.toLowerCase().trim();
    if (cleanEmail && ADMIN_EMAILS.includes(cleanEmail)) {
      return 'admin';
    }

    const { data: { session } } = await supabase.auth.getSession();
    const activeEmail = session?.user?.email?.toLowerCase().trim();
    if (activeEmail && ADMIN_EMAILS.includes(activeEmail)) {
      return 'admin';
    }

    let targetId = userIdToTest || session?.user?.id;
    const isUUID = targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

    if (isUUID) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', targetId)
        .single();

      if (error) {
        console.warn('Erro ao consultar role do usuário:', error.message);
      }

      if (data && data.role === 'admin') {
        return 'admin';
      }
    } else if (cleanEmail) {
      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('email', cleanEmail)
        .single();

      if (data && data.role === 'admin') {
        return 'admin';
      }
    }
  } catch (err) {
    console.warn('Consulta de role no Supabase:', err);
  }

  return 'member';
}
