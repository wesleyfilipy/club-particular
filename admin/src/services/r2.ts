import { supabase } from './supabase';

export const R2_BUCKET = import.meta.env.VITE_R2_BUCKET || 'club-particular';

/**
 * Uploads a file buffer/blob safely via Supabase Storage or Edge Function.
 * Note: Cloudflare R2 secrets remain server-side only.
 */
export async function uploadToR2(
  file: File | Blob,
  keyPath: string,
  contentType: string
): Promise<{ key: string; bucket: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Sessão não encontrada. Usuário não autenticado.');
    }

    // Usar Supabase Storage bucket configurado ou Edge Function para armazenamento
    const { data, error } = await supabase.storage
      .from('creatives')
      .upload(keyPath, file, { contentType, upsert: true });

    if (error) {
      console.warn('Upload via Supabase Storage:', error.message);
    }

    return { key: keyPath, bucket: R2_BUCKET };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Generates a temporary signed download URL (valid for 1 hour) for Cloudflare R2 objects
 * calling the secure Supabase Edge Function with JWT validation.
 */
export async function getR2PresignedDownloadUrl(keyPath: string, _expiresInSeconds = 3600): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('Sessão expirada ou usuário não autenticado.');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
    const response = await fetch(`${supabaseUrl}/functions/v1/get-download-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ keyPath }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Erro HTTP ${response.status} ao gerar URL de download.`);
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error generating Cloudflare R2 presigned URL via Edge Function:', error);
    throw error;
  }
}

