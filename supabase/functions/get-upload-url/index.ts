import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { PutObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3@3.587.0';
import { getSignedUrl } from 'https://esm.sh/@aws-sdk/s3-request-presigner@3.587.0';
import { r2, r2Bucket, corsHeaders, jsonResponse, getAccess, isValidKey } from '../_shared/r2.ts';

// Gera uma URL temporária (PUT) para o painel admin enviar o arquivo direto ao Cloudflare R2
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const access = await getAccess(req);
    if (!access) {
      return jsonResponse({ error: 'Sessão expirada ou token inválido (HTTP 401).' }, 401);
    }
    if (!access.isAdmin) {
      return jsonResponse({ error: 'Apenas administradores podem enviar arquivos (HTTP 403).' }, 403);
    }

    const { keyPath, contentType } = await req.json();
    if (!isValidKey(keyPath)) {
      return jsonResponse({ error: 'Caminho do arquivo inválido. Use offers/<oferta>/<pasta>/<arquivo>.' }, 400);
    }

    const command = new PutObjectCommand({
      Bucket: r2Bucket,
      Key: keyPath,
      ContentType: contentType || 'application/octet-stream',
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    return jsonResponse({ uploadUrl, key: keyPath, bucket: r2Bucket });
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Erro ao gerar URL de upload do Cloudflare R2.' }, 500);
  }
});
