import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GetObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3@3.587.0';
import { getSignedUrl } from 'https://esm.sh/@aws-sdk/s3-request-presigner@3.587.0';
import { r2, r2Bucket, supabaseAdmin, corsHeaders, jsonResponse, isValidKey } from '../_shared/r2.ts';

// Pública (sem login): entrega SOMENTE a capa da VSL de uma oferta sorteada, para a
// prévia da página de vendas. Não expõe VSL, criativos, links nem o nome da oferta.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { data: offers } = await supabaseAdmin
      .from('es_offers')
      .select('poster_key, category, vsl_resolution')
      .not('poster_key', 'is', null)
      .neq('poster_key', '')
      .limit(50);

    if (!offers || offers.length === 0) {
      return jsonResponse({ posterUrl: null });
    }

    const offer = offers[Math.floor(Math.random() * offers.length)];
    let posterUrl: string | null = null;

    if (isValidKey(offer.poster_key)) {
      posterUrl = await getSignedUrl(r2, new GetObjectCommand({ Bucket: r2Bucket, Key: offer.poster_key }), { expiresIn: 3600 });
    } else if (/^https:\/\//.test(offer.poster_key)) {
      posterUrl = offer.poster_key;
    }

    return jsonResponse({
      posterUrl,
      category: offer.category || null,
      resolution: offer.vsl_resolution || null,
    });
  } catch (err: any) {
    return jsonResponse({ posterUrl: null, error: err.message }, 200);
  }
});
