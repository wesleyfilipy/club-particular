import { supabase } from './supabase';

export const R2_BUCKET = import.meta.env.VITE_R2_BUCKET || 'club-particular';

/** Chave do R2 (offers/...) em vez de uma URL http(s) completa */
export const isR2Key = (value?: string): value is string => !!value && value.startsWith('offers/');

/** Normaliza nomes para usar em caminhos do bucket */
export const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Lê a mensagem real de erro da Edge Function (o supabase-js só diz "non-2xx status code").
 */
export async function functionErrorMessage(error: any, data?: any): Promise<string> {
  if (data?.error) return data.error;
  try {
    const body = await error?.context?.json?.();
    if (body?.error) return body.error;
  } catch {
    // resposta sem JSON
  }
  return error?.message || '';
}

/**
 * Envia um arquivo direto para o Cloudflare R2.
 * A Edge Function get-upload-url (somente admin) gera uma URL PUT temporária;
 * os segredos do R2 nunca chegam ao navegador.
 */
export async function uploadToR2(
  file: File | Blob,
  keyPath: string,
  contentType: string,
  onProgress?: (percent: number) => void
): Promise<{ key: string; bucket: string }> {
  const { data, error } = await supabase.functions.invoke('get-upload-url', {
    body: { keyPath, contentType },
  });

  if (error || !data?.uploadUrl) {
    const message = await functionErrorMessage(error, data);
    throw new Error(
      /administradores/i.test(message)
        ? 'Upload bloqueado: confirme o login de administrador com o código do app autenticador. Recarregue a página (Ctrl+F5) e entre de novo.'
        : message || 'Não foi possível gerar a URL de upload do Cloudflare R2.'
    );
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', data.uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Cloudflare R2 recusou o upload (HTTP ${xhr.status}). Verifique o CORS do bucket.`));
    xhr.onerror = () => reject(new Error('Falha de rede no upload para o Cloudflare R2. Verifique o CORS do bucket.'));
    xhr.send(file);
  });

  return { key: keyPath, bucket: R2_BUCKET };
}

/**
 * Gera URLs temporárias (3h) para várias chaves do R2 de uma vez.
 * Usado para assistir VSLs/vídeos de anúncios e para downloads (download = true).
 */
export async function getR2SignedUrls(keyPaths: string[], download = false): Promise<Record<string, string>> {
  const keys = keyPaths.filter(isR2Key);
  if (keys.length === 0) return {};

  const { data, error } = await supabase.functions.invoke('get-download-url', {
    body: { keyPaths: keys, download },
  });

  if (error || !data?.urls) {
    throw new Error((await functionErrorMessage(error, data)) || 'Não foi possível gerar as URLs do Cloudflare R2.');
  }

  return data.urls as Record<string, string>;
}

/** URL temporária para um único arquivo */
export async function getR2PresignedDownloadUrl(keyPath: string, download = true): Promise<string> {
  const urls = await getR2SignedUrls([keyPath], download);
  const url = urls[keyPath];
  if (!url) throw new Error('Arquivo não encontrado no Cloudflare R2.');
  return url;
}
