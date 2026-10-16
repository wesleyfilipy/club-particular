import React, { useState } from 'react';
import { OfferItem, isImageCreative } from '../../services/offersService';

type Cover = { type: 'image' | 'video'; src: string; label: string };

// Foto automática da página do site (serviço público de captura de tela do WordPress.com)
const siteShot = (url: string) => `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=800&h=450`;

/**
 * Escolhe a capa da oferta, na ordem: capa enviada → criativo em imagem →
 * quadro de um criativo em vídeo → quadro da VSL → foto da página do site.
 */
export const coverCandidates = (offer: OfferItem, mediaSrc: (key: string) => string): Cover[] => {
  const list: Cover[] = [];
  const poster = offer.posterKey && mediaSrc(offer.posterKey);
  if (poster) list.push({ type: 'image', src: poster, label: 'Capa da VSL' });

  const imageAd = offer.adVideos.find((a) => isImageCreative(a) && mediaSrc(a.key));
  if (imageAd) list.push({ type: 'image', src: mediaSrc(imageAd.key), label: 'Criativo' });

  const videoAd = offer.adVideos.find((a) => !isImageCreative(a) && mediaSrc(a.key));
  if (videoAd) list.push({ type: 'video', src: mediaSrc(videoAd.key), label: 'Criativo' });

  const vsl = offer.vslKey && mediaSrc(offer.vslKey);
  if (vsl) list.push({ type: 'video', src: vsl, label: 'VSL' });

  const site = offer.siteUrl || offer.landingPageUrl;
  if (site) list.push({ type: 'image', src: siteShot(site), label: 'Página do site' });

  return list;
};

interface OfferCoverProps {
  offer: OfferItem;
  mediaSrc: (key: string) => string;
  className?: string;
}

/** Mostra a melhor capa disponível; se uma falhar ao carregar, tenta a próxima */
export const OfferCover: React.FC<OfferCoverProps> = ({ offer, mediaSrc, className = '' }) => {
  const [failed, setFailed] = useState(0);
  const cover = coverCandidates(offer, mediaSrc)[failed];
  if (!cover) return null;

  const next = () => setFailed((n) => n + 1);
  const common = `absolute inset-0 w-full h-full object-cover ${className}`;

  return cover.type === 'image' ? (
    <img key={cover.src} src={cover.src} alt={`${cover.label} — ${offer.name}`} loading="lazy" className={common} onError={next} />
  ) : (
    // #t=1 faz o navegador mostrar um quadro do 1º segundo como imagem
    <video key={cover.src} src={`${cover.src}#t=1`} preload="metadata" muted playsInline className={`${common} pointer-events-none`} onError={next} />
  );
};
