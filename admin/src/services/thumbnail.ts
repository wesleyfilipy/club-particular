// Gera a capa (imagem JPG) a partir de um quadro do vídeo da VSL, direto no navegador.

const FRAME_AT_SECONDS = 2; // pega um quadro do começo, depois da tela preta inicial
const MAX_WIDTH = 1280;

/**
 * Captura um quadro de um vídeo (arquivo local ou URL com CORS liberado) e devolve um JPG.
 */
export function captureVideoFrame(source: File | string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = typeof source === 'string' ? null : URL.createObjectURL(source);
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = objectUrl || (source as string);

    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
    };

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Não foi possível ler o vídeo para gerar a capa.'));
    }, 30000);

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(FRAME_AT_SECONDS, (video.duration || FRAME_AT_SECONDS) / 2);
    };

    video.onseeked = () => {
      const scale = Math.min(1, MAX_WIDTH / (video.videoWidth || MAX_WIDTH));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round((video.videoWidth || 1280) * scale);
      canvas.height = Math.round((video.videoHeight || 720) * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        window.clearTimeout(timeout);
        cleanup();
        reject(new Error('Navegador sem suporte para gerar a capa.'));
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          window.clearTimeout(timeout);
          cleanup();
          blob ? resolve(blob) : reject(new Error('Falha ao gerar a imagem da capa.'));
        },
        'image/jpeg',
        0.85
      );
    };

    video.onerror = () => {
      window.clearTimeout(timeout);
      cleanup();
      reject(new Error('Formato de vídeo não suportado para gerar a capa.'));
    };
  });
}
