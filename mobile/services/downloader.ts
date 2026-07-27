import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { supabase } from './supabase';

export interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  progressPercent: number; // 0 - 100
  isFinished: boolean;
  error?: string;
}

let activeDownloadResumable: FileSystem.DownloadResumable | null = null;

/**
 * Calls Edge Function / Supabase to generate a Cloudflare R2 Presigned URL after checking Stripe subscription
 */
export async function getSignedDownloadUrl(bucket: string, keyPath: string): Promise<string> {
  try {
    if (keyPath.startsWith('http://') || keyPath.startsWith('https://')) {
      return keyPath;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co'}/functions/v1/get-download-url`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ keyPath }),
      }
    );

    if (response.ok) {
      const json = await response.json();
      if (json.url) return json.url;
    }

    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error || 'Acesso negado: Falha ao obter URL de download segura.');
  } catch (err: any) {
    console.error('Erro ao obter Signed URL:', err);
    throw new Error(err.message || 'Não foi possível autorizar o download do arquivo.');
  }
}

/**
 * Downloads file from Cloudflare R2 with real-time progress tracking & resumable download support
 */
export async function downloadFileWithProgress(
  fileUrl: string,
  fileName: string,
  onProgress: (progress: DownloadProgress) => void
): Promise<string> {
  try {
    const fileUri = `${FileSystem.documentDirectory}${Date.now()}_${fileName}`;

    activeDownloadResumable = FileSystem.createDownloadResumable(
      fileUrl,
      fileUri,
      {},
      (downloadProgressData) => {
        const progressPercent = Math.min(
          100,
          Math.round(
            (downloadProgressData.totalBytesWritten / downloadProgressData.totalBytesExpectedToWrite) * 100
          )
        );

        onProgress({
          totalBytesWritten: downloadProgressData.totalBytesWritten,
          totalBytesExpectedToWrite: downloadProgressData.totalBytesExpectedToWrite,
          progressPercent: isNaN(progressPercent) ? 50 : progressPercent,
          isFinished: false,
        });
      }
    );

    const result = await activeDownloadResumable.downloadAsync();
    activeDownloadResumable = null;

    if (result && result.uri) {
      onProgress({
        totalBytesWritten: 100,
        totalBytesExpectedToWrite: 100,
        progressPercent: 100,
        isFinished: true,
      });

      try {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (permission.granted && (fileName.endsWith('.mp4') || fileName.endsWith('.png') || fileName.endsWith('.jpg'))) {
          await MediaLibrary.saveToLibraryAsync(result.uri);
        }
      } catch (mediaErr) {
        console.warn('Media Library save skipped:', mediaErr);
      }

      return result.uri;
    } else {
      throw new Error('Falha ao concluir o download do Cloudflare R2.');
    }
  } catch (error: any) {
    activeDownloadResumable = null;
    onProgress({
      totalBytesWritten: 0,
      totalBytesExpectedToWrite: 0,
      progressPercent: 0,
      isFinished: false,
      error: error.message || 'Erro durante o download do Cloudflare R2.',
    });
    throw error;
  }
}

/**
 * Pause active resumable download
 */
export async function pauseActiveDownload() {
  if (activeDownloadResumable) {
    await activeDownloadResumable.pauseAsync();
  }
}

/**
 * Resume active paused download
 */
export async function resumeActiveDownload() {
  if (activeDownloadResumable) {
    await activeDownloadResumable.resumeAsync();
  }
}
