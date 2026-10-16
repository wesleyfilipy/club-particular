import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GetObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3@3.587.0';
import { getSignedUrl } from 'https://esm.sh/@aws-sdk/s3-request-presigner@3.587.0';
import { r2, r2Bucket, corsHeaders, jsonResponse, getAccess, isValidKey } from '../_shared/r2.ts';

const EXPIRES_IN_SECONDS = 3 * 3600;

// Gera URLs temporárias (GET) do Cloudflare R2 para assistir ou baixar VSLs, vídeos de anúncios e packs.
// Body: { keyPaths: string[], download?: boolean }  (ou { keyPath } para um único arquivo)
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const access = await getAccess(req);
    if (!access) {
      return jsonResponse({ error: 'Sessão expirada ou token inválido (HTTP 401).' }, 401);
    }
    // Assistir/baixar: assinante ativo ou a conta do dono (mesmo sem o código)
    if (!access.hasAdminRole && !access.isActiveMember) {
      return jsonResponse({ error: 'Acesso negado (HTTP 403): sua assinatura está inativa ou expirada.' }, 403);
    }

    const body = await req.json();
    const keys: unknown[] = Array.isArray(body.keyPaths) ? body.keyPaths : [body.keyPath];
    const validKeys = [...new Set(keys.filter(isValidKey))].slice(0, 200);

    if (validKeys.length === 0) {
      return jsonResponse({ error: 'Nenhum caminho de arquivo válido foi informado.' }, 400);
    }

    const urls: Record<string, string> = {};
    for (const key of validKeys) {
      const fileName = key.split('/').pop() || 'arquivo';
      const command = new GetObjectCommand({
        Bucket: r2Bucket,
        Key: key,
        ResponseContentDisposition: body.download ? `attachment; filename="${fileName.replace(/"/g, '')}"` : undefined,
      });
      urls[key] = await getSignedUrl(r2, command, { expiresIn: EXPIRES_IN_SECONDS });
    }

    return jsonResponse({
      urls,
      url: urls[validKeys[0]],
      expiresInSeconds: EXPIRES_IN_SECONDS,
    });
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Erro interno ao gerar URL temporária do Cloudflare R2.' }, 500);
  }
});
