// "Otimizar para web" (faststart) no navegador, antes do upload.
//
// Vídeos MP4/MOV guardam um índice (caixa "moov"). Quando ele fica no FIM do arquivo,
// o navegador precisa buscar o fim antes de começar a tocar, e a VSL parece travada.
// Aqui movemos o "moov" para antes dos dados do vídeo ("mdat") e corrigimos as posições
// que ele aponta (tabelas stco/co64). O vídeo não é reprocessado: a qualidade é idêntica,
// e o arquivo novo é montado com fatias do original (não carrega gigabytes na memória).

interface Box {
  type: string;
  start: number;
  size: number;
}

const MAX_MOOV_BYTES = 200 * 1024 * 1024;
const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl']);

const readView = async (blob: Blob, start: number, length: number) =>
  new DataView(await blob.slice(start, start + length).arrayBuffer());

const typeAt = (view: DataView, offset: number) =>
  String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));

/** Lista as caixas do nível principal do arquivo (ftyp, mdat, moov...) */
async function topLevelBoxes(file: Blob): Promise<Box[] | null> {
  const boxes: Box[] = [];
  let pos = 0;
  while (pos < file.size) {
    if (file.size - pos < 8 || boxes.length > 10000) return null;
    const header = await readView(file, pos, Math.min(16, file.size - pos));
    let size = header.getUint32(0);
    const type = typeAt(header, 4);
    if (size === 1) {
      if (header.byteLength < 16) return null;
      size = Number(header.getBigUint64(8));
    } else if (size === 0) {
      size = file.size - pos; // vai até o fim do arquivo
    }
    if (size < 8 || pos + size > file.size) return null;
    boxes.push({ type, start: pos, size });
    pos += size;
  }
  return boxes;
}

/**
 * Soma `delta` às posições de dados que ficam antes do antigo lugar do moov.
 * Retorna false se uma posição de 32 bits estourar (aí não mexemos no arquivo).
 */
function patchChunkOffsets(moov: Uint8Array, delta: number, oldMoovStart: number): boolean {
  const view = new DataView(moov.buffer, moov.byteOffset, moov.byteLength);

  const walk = (start: number, end: number): boolean => {
    let pos = start;
    while (pos + 8 <= end) {
      let size = view.getUint32(pos);
      const type = typeAt(view, pos + 4);
      let header = 8;
      if (size === 1) {
        size = Number(view.getBigUint64(pos + 8));
        header = 16;
      } else if (size === 0) {
        size = end - pos;
      }
      if (size < header || pos + size > end) return false;

      if (CONTAINERS.has(type)) {
        if (!walk(pos + header, pos + size)) return false;
      } else if (type === 'stco' || type === 'co64') {
        const count = view.getUint32(pos + header + 4);
        let entry = pos + header + 8;
        for (let i = 0; i < count; i++) {
          if (type === 'stco') {
            const offset = view.getUint32(entry);
            if (offset < oldMoovStart) {
              const moved = offset + delta;
              if (moved > 0xffffffff) return false;
              view.setUint32(entry, moved);
            }
            entry += 4;
          } else {
            const offset = view.getBigUint64(entry);
            if (offset < BigInt(oldMoovStart)) view.setBigUint64(entry, offset + BigInt(delta));
            entry += 8;
          }
        }
      }
      pos += size;
    }
    return true;
  };

  return walk(8, moov.byteLength) || false;
}

/**
 * Devolve o vídeo otimizado para web, ou null quando já está otimizado
 * (ou quando o formato não permite a correção com segurança).
 */
export async function optimizeForWeb(file: File): Promise<File | null> {
  try {
    const boxes = await topLevelBoxes(file);
    if (!boxes) return null;
    const moov = boxes.find((b) => b.type === 'moov');
    const firstMdat = boxes.find((b) => b.type === 'mdat');
    if (!moov || !firstMdat || moov.start < firstMdat.start) return null; // já está no começo
    if (moov.size > MAX_MOOV_BYTES) return null;

    const moovBytes = new Uint8Array(await file.slice(moov.start, moov.start + moov.size).arrayBuffer());
    // moov com cabeçalho de 64 bits: o conteúdo começa depois de 16 bytes
    const headerSize = new DataView(moovBytes.buffer).getUint32(0) === 1 ? 16 : 8;
    if (headerSize === 16 || !patchChunkOffsets(moovBytes, moov.size, moov.start)) return null;

    const parts: BlobPart[] = [];
    for (const box of boxes) {
      if (box === moov) continue;
      if (box === firstMdat) parts.push(moovBytes);
      parts.push(file.slice(box.start, box.start + box.size));
    }
    const optimized = new File(parts, file.name, { type: file.type || 'video/mp4', lastModified: file.lastModified });
    return optimized.size === file.size ? optimized : null;
  } catch {
    return null;
  }
}
