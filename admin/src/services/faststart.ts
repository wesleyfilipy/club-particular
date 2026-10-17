// "Otimizar para web" no navegador, antes do upload. Corrige dois formatos de MP4/MOV
// que fazem a VSL travar ou nunca começar a tocar no navegador:
//
// 1. Índice ("moov") no FIM do arquivo: o navegador precisa buscar o fim antes de tocar.
// 2. Dados do vídeo em MILHARES de blocos "mdat" separados (alguns editores/gravadores de
//    tela salvam assim): o navegador percorre bloco por bloco, um pedido de rede por bloco,
//    e a VSL nunca começa.
//
// O arquivo é remontado como ftyp → moov → um único mdat, corrigindo as posições que o
// índice aponta (tabelas stco/co64). O vídeo não é reprocessado: a qualidade é idêntica, e o
// arquivo novo é montado com fatias do original (não carrega gigabytes na memória).

interface Box {
  type: string;
  start: number; // posição da caixa no arquivo
  size: number; // tamanho total (cabeçalho + conteúdo)
  header: number; // tamanho do cabeçalho (8 ou 16 bytes)
}

const MAX_MOOV_BYTES = 200 * 1024 * 1024;
const MAX_BOXES = 1_000_000;
const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl']);

const typeAt = (view: DataView, offset: number) =>
  String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));

/** Lista as caixas do nível principal do arquivo (ftyp, moov, mdat...) lendo só os cabeçalhos */
async function topLevelBoxes(file: Blob): Promise<Box[] | null> {
  const boxes: Box[] = [];
  let pos = 0;
  // Lê os cabeçalhos em blocos de 1 MB para não fazer uma leitura por caixa
  let windowStart = -1;
  let windowView: DataView | null = null;
  const WINDOW = 1024 * 1024;

  const header = async (at: number) => {
    if (!windowView || at < windowStart || at + 16 > windowStart + windowView.byteLength) {
      windowStart = at;
      windowView = new DataView(await file.slice(at, Math.min(file.size, at + WINDOW)).arrayBuffer());
    }
    return { view: windowView, offset: at - windowStart };
  };

  while (pos < file.size) {
    if (file.size - pos < 8 || boxes.length > MAX_BOXES) return null;
    const { view, offset } = await header(pos);
    if (offset + 8 > view.byteLength) return null;
    let size = view.getUint32(offset);
    const type = typeAt(view, offset + 4);
    let headerSize = 8;
    if (size === 1) {
      if (offset + 16 > view.byteLength) return null;
      size = Number(view.getBigUint64(offset + 8));
      headerSize = 16;
    } else if (size === 0) {
      size = file.size - pos; // vai até o fim do arquivo
    }
    if (size < headerSize || pos + size > file.size) return null;
    boxes.push({ type, start: pos, size, header: headerSize });
    pos += size;
  }
  return boxes;
}

/** Aplica `remap` a cada posição de dados das tabelas stco/co64. False se não couber em 32 bits. */
function patchChunkOffsets(moov: Uint8Array, remap: (offset: number) => number): boolean {
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
            const moved = remap(view.getUint32(entry));
            if (moved < 0 || moved > 0xffffffff) return false;
            view.setUint32(entry, moved);
            entry += 4;
          } else {
            const moved = remap(Number(view.getBigUint64(entry)));
            if (moved < 0) return false;
            view.setBigUint64(entry, BigInt(moved));
            entry += 8;
          }
        }
      }
      pos += size;
    }
    return true;
  };

  return walk(8, moov.byteLength);
}

/**
 * Devolve o vídeo otimizado para web, ou null quando já está otimizado
 * (ou quando o formato não permite a correção com segurança).
 */
export async function optimizeForWeb(file: File): Promise<File | null> {
  try {
    const boxes = await topLevelBoxes(file);
    if (!boxes) return null;
    const moovs = boxes.filter((b) => b.type === 'moov');
    const mdats = boxes.filter((b) => b.type === 'mdat');
    if (moovs.length !== 1 || mdats.length === 0 || boxes.some((b) => b.type === 'moof')) return null; // vídeo fragmentado: não mexe
    const moov = moovs[0];
    if (moov.header !== 8 || moov.size > MAX_MOOV_BYTES) return null;

    const moovFirst = moov.start < mdats[0].start;
    if (moovFirst && mdats.length === 1) return null; // já está otimizado

    // Arquivo novo: caixas que não são moov/mdat (ftyp, free...) → moov → um único mdat
    const others = boxes.filter((b) => b.type !== 'moov' && b.type !== 'mdat');
    const prefixSize = others.reduce((sum, b) => sum + b.size, 0);
    const payload = mdats.reduce((sum, b) => sum + b.size - b.header, 0);
    const mdatHeader = payload + 8 > 0xffffffff ? 16 : 8;
    const newPayloadStart = prefixSize + moov.size + mdatHeader;

    // Onde cada byte de dados vai parar no arquivo novo
    const starts: number[] = [];
    let acc = 0;
    for (const m of mdats) {
      starts.push(acc);
      acc += m.size - m.header;
    }
    const remap = (offset: number) => {
      for (let i = 0; i < mdats.length; i++) {
        const m = mdats[i];
        const dataStart = m.start + m.header;
        if (offset >= dataStart && offset <= m.start + m.size) return newPayloadStart + starts[i] + (offset - dataStart);
      }
      return -1; // posição fora dos dados: não é seguro mexer
    };

    const moovBytes = new Uint8Array(await file.slice(moov.start, moov.start + moov.size).arrayBuffer());
    if (!patchChunkOffsets(moovBytes, remap)) return null;

    const header = new Uint8Array(mdatHeader);
    const hv = new DataView(header.buffer);
    if (mdatHeader === 16) {
      hv.setUint32(0, 1);
      hv.setUint32(4, 0x6d646174); // "mdat"
      hv.setBigUint64(8, BigInt(payload + 16));
    } else {
      hv.setUint32(0, payload + 8);
      hv.setUint32(4, 0x6d646174);
    }

    const parts: BlobPart[] = [
      ...others.map((b) => file.slice(b.start, b.start + b.size)),
      moovBytes,
      header,
      ...mdats.map((m) => file.slice(m.start + m.header, m.start + m.size)),
    ];
    const optimized = new File(parts, file.name, { type: file.type || 'video/mp4', lastModified: file.lastModified });
    return optimized.size === prefixSize + moov.size + mdatHeader + payload ? optimized : null;
  } catch {
    return null;
  }
}
