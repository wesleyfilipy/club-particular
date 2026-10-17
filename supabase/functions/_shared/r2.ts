import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import { S3Client } from 'https://esm.sh/@aws-sdk/client-s3@3.587.0';

// Segredos do Cloudflare R2 ficam apenas aqui (Supabase Edge Function secrets).
// trim(): um Enter/espaço colado junto do valor no painel invalida a assinatura do R2.
const env = (name: string) => (Deno.env.get(name) || '').trim();

// (nome padrão mantido para não quebrar o bucket já existente)
export const r2Bucket = env('R2_BUCKET') || 'club-particular';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: env('R2_ENDPOINT'),
  credentials: {
    accessKeyId: env('R2_ACCESS_KEY_ID'),
    secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
  },
});

export const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

export interface AccessInfo {
  userId: string;
  email: string;
  isAdmin: boolean; // admin com o código do autenticador (pode editar/enviar)
  hasAdminRole: boolean; // conta admin, mesmo sem o código (só ver/baixar)
  isActiveMember: boolean;
}

/**
 * Login confirmado em 2 etapas: código do app autenticador (sessão "aal2")
 * ou código enviado ao e-mail (método "otp"/"magiclink"). Só a senha não basta.
 */
const ADMIN_VERIFIED_METHODS = ['totp', 'otp', 'magiclink'];
const tokenVerified = (token: string): boolean => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=')));
    const methods: string[] = (claims.amr || []).map((m: { method?: string }) => m?.method || '');
    return claims.aal === 'aal2' || methods.some((m) => ADMIN_VERIFIED_METHODS.includes(m));
  } catch {
    return false;
  }
};

/**
 * Valida o JWT do Supabase e retorna se o usuário é admin e/ou assinante ativo.
 * Retorna null quando o token é inválido.
 */
export async function getAccess(req: Request): Promise<AccessInfo | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin
    .from('es_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  // Admin só com login confirmado em 2 etapas (código do e-mail ou do app autenticador).
  // O token já foi validado pelo getUser acima; aqui só lemos como o login foi confirmado.
  const isAdmin = profile?.role === 'admin' && tokenVerified(token);

  const { data: isActiveMember } = await supabaseAdmin.rpc('es_is_active_member', { user_uuid: user.id });

  return {
    userId: user.id,
    email: (user.email || '').toLowerCase(),
    isAdmin,
    hasAdminRole: profile?.role === 'admin',
    isActiveMember: isActiveMember === true,
  };
}

/** Só aceita chaves dentro de offers/ e sem "..", para não expor outros objetos do bucket */
export const isValidKey = (key: unknown): key is string =>
  typeof key === 'string' && key.startsWith('offers/') && !key.includes('..');
