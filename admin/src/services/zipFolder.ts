// Compacta, no navegador, a pasta do site baixado escolhida pelo admin em um único .zip
import { zip, type Zippable } from 'fflate';

// Formatos que já são comprimidos: guardar sem recomprimir deixa o ZIP pronto bem mais rápido
const STORED = /\.(jpe?g|png|gif|webp|avif|mp4|webm|mov|mp3|zip|rar|7z|gz|woff2?)$/i;

/** Monta um .zip com todos os arquivos da pasta (mantendo as subpastas) */
export async function zipFolder(files: FileList | File[]): Promise<File> {
  const list = Array.from(files);
  if (list.length === 0) throw new Error('A pasta está vazia.');

  // "minha-pasta/css/estilo.css" -> o nome da pasta vira o nome do .zip
  const rootName = (list[0].webkitRelativePath || list[0].name).split('/')[0] || 'site';

  const tree: Zippable = {};
  for (const file of list) {
    const path = file.webkitRelativePath || file.name;
    const data = new Uint8Array(await file.arrayBuffer());
    tree[path] = [data, { level: STORED.test(path) ? 0 : 6 }];
  }

  const bytes = await new Promise<Uint8Array>((resolve, reject) =>
    zip(tree, (err, out) => (err ? reject(err) : resolve(out)))
  );
  return new File([bytes as BlobPart], `${rootName}.zip`, { type: 'application/zip' });
}
