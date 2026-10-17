// Verifica, no navegador e antes do upload, se o vídeo vai tocar bem na área de membros.
// Lê só o começo e o fim do arquivo (não carrega o vídeo inteiro).

const HEAD_BYTES = 512 * 1024;
const TAIL_BYTES = 4 * 1024 * 1024;

const MAX_MBPS = 12;

const asText = async (blob: Blob) => new TextDecoder('latin1').decode(await blob.arrayBuffer());

/** Duração do vídeo em segundos (lida pelo próprio navegador, sem carregar o arquivo todo) */
const videoDuration = (file: File): Promise<number> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    const done = (value: number) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.preload = 'metadata';
    video.onloadedmetadata = () => done(isFinite(video.duration) ? video.duration : 0);
    video.onerror = () => done(0);
    setTimeout(() => done(0), 15000);
    video.src = url;
  });

export async function checkVideoFile(file: File): Promise<string[]> {
  const warnings: string[] = [];
  try {
    const head = await asText(file.slice(0, HEAD_BYTES));
    const tail = file.size > HEAD_BYTES ? await asText(file.slice(Math.max(HEAD_BYTES, file.size - TAIL_BYTES))) : '';
    const all = head + tail;

    // H.265/HEVC (comum em vídeos de iPhone): o Chrome e o Firefox no Windows geralmente não tocam
    if (/hvc1|hev1/.test(all) && !/avc1/.test(all)) {
      warnings.push(
        'Vídeo em H.265 (HEVC): muitos navegadores não conseguem tocar. Converta para H.264 antes de enviar (HandBrake → preset "Fast 1080p30").'
      );
    }

    // Índice "moov" no fim: o navegador precisa buscar o fim do arquivo antes de começar a tocar
    if (head.includes('ftyp') && !head.includes('moov') && tail.includes('moov')) {
      warnings.push(
        'Vídeo não otimizado para web: vai demorar para começar a tocar. No HandBrake, marque "Web Optimized" ao converter.'
      );
    }

    // Peso por segundo (bitrate): acima de ~12 Mbps a VSL fica carregando para quem tem internet comum
    const duration = await videoDuration(file);
    const mbps = duration ? (file.size * 8) / duration / 1_000_000 : 0;
    if (mbps > MAX_MBPS) {
      warnings.push(
        `Vídeo pesado demais para tocar online (${Math.round(mbps)} Mbps): vai ficar carregando para a maioria dos clientes. Comprima no HandBrake (preset "Fast 1080p30") antes de enviar.`
      );
    } else if (file.size > 1024 * 1024 * 1024) {
      warnings.push(`Arquivo muito grande (${(file.size / 1024 / 1024 / 1024).toFixed(1)} GB): pode demorar para carregar. Comprimir no HandBrake costuma reduzir bastante.`);
    }
  } catch {
    // Não conseguiu ler: não bloqueia o upload
  }
  return warnings;
}
