import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import { S3Client, GetObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3@3.587.0';
import { getSignedUrl } from 'https://esm.sh/@aws-sdk/s3-request-presigner@3.587.0';

const r2Endpoint = Deno.env.get('R2_ENDPOINT') || '';
const r2AccessKey = Deno.env.get('R2_ACCESS_KEY_ID') || '';
const r2SecretKey = Deno.env.get('R2_SECRET_ACCESS_KEY') || '';
const r2Bucket = Deno.env.get('R2_BUCKET') || 'club-particular';

const r2 = new S3Client({
  region: 'auto',
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: r2AccessKey,
    secretAccessKey: r2SecretKey,
  },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Cabeçalho de autorização não fornecido (HTTP 401).' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Sessão expirada ou token de usuário inválido (HTTP 401).' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Verify if user is Admin / Moderator or has Active Stripe Subscription
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdminOrMod = profile?.role === 'admin' || profile?.role === 'moderator';

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single();

    const isSubscribed = subscription?.status === 'active';

    if (!isAdminOrMod && !isSubscribed) {
      return new Response(
        JSON.stringify({ error: 'Acesso Negado (HTTP 403): Sua assinatura Stripe está inativa ou expirada.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { keyPath } = await req.json();
    if (!keyPath) {
      return new Response(
        JSON.stringify({ error: 'O caminho do arquivo no bucket R2 é obrigatório.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Generate Cloudflare R2 Presigned Temporary URL (1 Hour Expiration)
    const command = new GetObjectCommand({
      Bucket: r2Bucket,
      Key: keyPath,
    });

    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    return new Response(
      JSON.stringify({
        url: presignedUrl,
        expiresInSeconds: 3600,
        bucket: r2Bucket,
        key: keyPath,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Erro interno ao gerar URL temporária do Cloudflare R2.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
