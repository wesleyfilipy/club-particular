import { OfferItem } from '../../services/offersService';

/** Anúncios ativos no último dia registrado no gráfico de escala */
export const lastAds = (offer: OfferItem): number =>
  offer.dailyScale.length > 0 ? offer.dailyScale[offer.dailyScale.length - 1].ads : 0;

/** Crescimento de anúncios ativos nos últimos 7 registros */
export const growthOf = (offer: OfferItem): number => {
  const pts = offer.dailyScale.slice(-7);
  return pts.length >= 2 ? pts[pts.length - 1].ads - pts[0].ads : 0;
};

/** Está escalando = mais anúncios ativos agora do que no início da semana */
export const isScaling = (offer: OfferItem) => growthOf(offer) > 0;

/** Desde quando a oferta roda: data informada pelo admin, 1º dia do gráfico ou data de cadastro */
export const sinceDate = (offer: OfferItem): Date | null => {
  const raw = offer.startedAt || offer.dailyScale[0]?.date || offer.createdAt;
  if (!raw) return null;
  const d = new Date(raw.length === 10 ? `${raw}T12:00:00` : raw);
  return isNaN(d.getTime()) ? null : d;
};

/** "18 dias", "um mês", "3 meses" */
export const formatAge = (date: Date | null): string => {
  if (!date) return '—';
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (days < 1) return 'hoje';
  if (days < 30) return `${days} dia${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'um mês' : `${months} meses`;
};

/** "27 de mai" */
export const formatShortDate = (date: Date | null): string =>
  date ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') : '';

export const isNewOffer = (offer: OfferItem) =>
  !!offer.createdAt && Date.now() - new Date(offer.createdAt).getTime() < 7 * 86400000;

// ---------------- Filtros ----------------

export interface OfferFilters {
  scalingOnly: boolean;
  minAds: string;
  maxAds: string;
  from: string; // AAAA-MM-DD (rodando desde)
  to: string;
  languages: string[];
  networks: string[];
  structures: string[];
  productTypes: string[];
  niches: string[];
}

export const emptyFilters = (): OfferFilters => ({
  scalingOnly: false,
  minAds: '',
  maxAds: '',
  from: '',
  to: '',
  languages: [],
  networks: [],
  structures: [],
  productTypes: [],
  niches: [],
});

export const activeFilterCount = (f: OfferFilters) =>
  (f.scalingOnly ? 1 : 0) +
  (f.minAds || f.maxAds ? 1 : 0) +
  (f.from || f.to ? 1 : 0) +
  [f.languages, f.networks, f.structures, f.productTypes, f.niches].filter((l) => l.length > 0).length;

export const applyFilters = (offers: OfferItem[], f: OfferFilters, search: string): OfferItem[] => {
  const q = search.trim().toLowerCase();
  const min = f.minAds === '' ? null : Number(f.minAds);
  const max = f.maxAds === '' ? null : Number(f.maxAds);
  return offers.filter((o) => {
    if (q && !`${o.name} ${o.category} ${o.description}`.toLowerCase().includes(q)) return false;
    if (f.scalingOnly && !isScaling(o)) return false;
    const ads = lastAds(o);
    if (min !== null && ads < min) return false;
    if (max !== null && ads > max) return false;
    const since = sinceDate(o);
    if (f.from && (!since || since < new Date(`${f.from}T00:00:00`))) return false;
    if (f.to && (!since || since > new Date(`${f.to}T23:59:59`))) return false;
    if (f.languages.length && !f.languages.includes(o.language)) return false;
    if (f.networks.length && !f.networks.includes(o.network)) return false;
    if (f.structures.length && !f.structures.includes(o.structure)) return false;
    if (f.productTypes.length && !f.productTypes.includes(o.productType)) return false;
    if (f.niches.length && !f.niches.includes(o.category)) return false;
    return true;
  });
};

export type SortMode = 'ads' | 'growth' | 'recent' | 'oldest';

export const SORT_LABELS: Record<SortMode, string> = {
  ads: 'Mais anúncios ativos',
  growth: 'Maior crescimento (7 dias)',
  recent: 'Adicionadas recentemente',
  oldest: 'Rodando há mais tempo',
};

export const sortOffers = (offers: OfferItem[], mode: SortMode): OfferItem[] => {
  const list = [...offers];
  const time = (d: Date | null) => (d ? d.getTime() : Number.MAX_SAFE_INTEGER); // sem data vai para o fim
  if (mode === 'ads') list.sort((a, b) => lastAds(b) - lastAds(a));
  if (mode === 'growth') list.sort((a, b) => growthOf(b) - growthOf(a));
  if (mode === 'recent') list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  if (mode === 'oldest') list.sort((a, b) => time(sinceDate(a)) - time(sinceDate(b)));
  return list;
};
