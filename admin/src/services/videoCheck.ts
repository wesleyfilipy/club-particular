// Verifica, no navegador e antes do upload, se o vídeo vai tocar bem na área de membros.
// Lê só o começo e o fim do arquivo (não carrega o vídeo inteiro).

const HEAD_BYTES = 512 * 1024;
const TAIL_BYTES = 4 * 1024 * 1024;

const asText = async (blob: Blob) => new TextDecoder('latin1').decode(await blob.arrayBuffer());

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

    if (file.size > 1024 * 1024 * 1024) {
      warnings.push(`Arquivo muito grande (${(file.size / 1024 / 1024 / 1024).toFixed(1)} GB): pode demorar para carregar. Comprimir no HandBrake costuma reduzir bastante.`);
    }
  } catch {
    // Não conseguiu ler: não bloqueia o upload
  }
  return warnings;
}
