import { supabase } from './supabase';

// Criativo de anúncio da Biblioteca do Meta (vídeo ou imagem)
export interface AdVideo {
  key: string; // chave no Cloudflare R2
  name: string;
  type?: 'video' | 'image';
}

/** Criativos antigos não têm "type": nesse caso decide pela extensão do arquivo */
export const isImageCreative = (ad: AdVideo) =>
  ad.type === 'image' || (!ad.type && /\.(jpe?g|png|webp|gif|avif|heic)$/i.test(ad.name));

export interface ScalePoint {
  date: string; // AAAA-MM-DD
  ads: number; // anúncios ativos na Biblioteca do Meta nesse dia
}

export interface OfferItem {
  id: string;
  name: string;
  category: string;
  commission: string;
  description: string;
  vslKey: string; // chave R2 (offers/...) ou URL externa
  vslFileName: string;
  vslResolution: string;
  posterKey: string; // chave R2 da capa ou URL externa
  creativeKey: string;
  creativeFileName: string;
  creativeFileSize: string;
  adVideos: AdVideo[];
  dailyScale: ScalePoint[];
  siteUrl: string;
  landingPageUrl: string;
  adsLibraryUrl: string;
  // Dados usados nos filtros da área de membros
  network: string; // rede de tráfego (Facebook, TikTok...)
  structure: string; // VSL, TSL, Quiz...
  productType: string; // Infoproduto, Nutracêutico...
  language: string; // idioma da oferta
  startedAt: string; // AAAA-MM-DD: desde quando a oferta está rodando
  ticketType: string; // Low Ticket, Mid Ticket, High Ticket
  transcript: string; // transcrição da VSL (texto colado pelo admin)
  siteFilesKey: string; // chave R2 do arquivo do site baixado (ZIP), vazio quando não tem
  siteFilesName: string;
  siteFilesSize: string;
  createdAt?: string; // data de cadastro (preenchida pelo Supabase)
  updatedAt?: string; // última atualização
}

export const NETWORKS = ['Facebook', 'Instagram', 'TikTok', 'Google', 'YouTube', 'Kwai'];
export const STRUCTURES = ['VSL', 'TSL', 'Quiz', 'Advertorial', 'Lead', 'Webinar'];
export const PRODUCT_TYPES = ['Infoproduto', 'Nutracêutico', 'Físico', 'Software', 'Serviço'];
export const TICKET_TYPES = ['Low Ticket', 'Mid Ticket', 'High Ticket'];
export const NICHES = [
  'Saúde & Emagrecimento',
  'Renda Extra & Finanças',
  'Desenvolvimento Pessoal',
  'Relacionamento & Conquista',
  'Investimentos & Cripto',
  'E-commerce & Dropshipping',
  'Disfunção Erétil',
  'Rejuvenescimento',
  'Visão',
  'Memória & Alzheimer',
  'Diabetes',
  'Dores & Articulações',
  'Beleza & Cabelo',
  'Lei da Atração & Prosperidade',
  'Espiritualidade',
  'Pets',
  'Outros',
];
export const LANGUAGES = ['Português', 'English', 'Español', 'Français', 'Deutsch', 'Italiano'];

export type OfferInput = Omit<OfferItem, 'id'>;

const sortScale = (points: ScalePoint[]) => [...points].sort((a, b) => a.date.localeCompare(b.date));

const fromRow = (item: any): OfferItem => ({
  id: item.id,
  name: item.name || 'Oferta',
  category: item.category || 'Geral',
  commission: item.commission || '',
  description: item.description || '',
  vslKey: item.vsl_key || '',
  vslFileName: item.vsl_file_name || '',
  vslResolution: item.vsl_resolution || '1080p Full HD',
  posterKey: item.poster_key || item.logo_url || item.image_url || '',
  creativeKey: item.creative_key || '',
  creativeFileName: item.creative_file_name || '',
  creativeFileSize: item.creative_file_size || '',
  adVideos: Array.isArray(item.ad_videos) ? item.ad_videos : [],
  dailyScale: Array.isArray(item.daily_scale) ? sortScale(item.daily_scale) : [],
  siteUrl: item.official_site_url || '',
  landingPageUrl: item.landing_page_url || '',
  adsLibraryUrl: item.facebook_ads_library_url || '',
  network: item.traffic_network || 'Facebook',
  structure: item.structure || 'VSL',
  productType: item.product_type || 'Infoproduto',
  language: item.language || 'Português',
  startedAt: item.started_at || '',
  ticketType: item.ticket_type || '',
  transcript: item.transcript || '',
  siteFilesKey: item.site_files_key || '',
  siteFilesName: item.site_files_name || '',
  siteFilesSize: item.site_files_size || '',
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const toLegacyRow = (offer: OfferInput) => ({
  name: offer.name,
  category: offer.category,
  commission: offer.commission,
  description: offer.description,
  vsl_key: offer.vslKey || null,
  vsl_file_name: offer.vslFileName || null,
  vsl_resolution: offer.vslResolution,
  poster_key: offer.posterKey || null,
  creative_key: offer.creativeKey || null,
  creative_file_name: offer.creativeFileName || null,
  creative_file_size: offer.creativeFileSize || null,
  ad_videos: offer.adVideos,
  daily_scale: sortScale(offer.dailyScale),
  official_site_url: offer.siteUrl || null,
  landing_page_url: offer.landingPageUrl || null,
  facebook_ads_library_url: offer.adsLibraryUrl || null,
});

const toFilterRow = (offer: OfferInput) => ({
  ...toLegacyRow(offer),
  traffic_network: offer.network,
  structure: offer.structure,
  product_type: offer.productType,
  language: offer.language,
  started_at: offer.startedAt || null,
});

const toRow = (offer: OfferInput) => ({
  ...toFilterRow(offer),
  ticket_type: offer.ticketType || null,
  transcript: offer.transcript || null,
});

const toFullRow = (offer: OfferInput) => ({
  ...toRow(offer),
  site_files_key: offer.siteFilesKey || null,
  site_files_name: offer.siteFilesName || null,
  site_files_size: offer.siteFilesSize || null,
});

// Tenta salvar com todos os campos; se algum SQL ainda não foi rodado, salva com o que o banco já tem
const ROW_VERSIONS = [toFullRow, toRow, toFilterRow, toLegacyRow];

// Arquivo do site enviado mas o SQL arquivo_site.sql ainda não foi rodado: avisa em vez de perder o arquivo
const SITE_FILES_SQL_MISSING =
  'Para salvar o arquivo do site, rode antes o arquivo supabase/arquivo_site.sql no SQL Editor do Supabase.';

// Coluna inexistente: o SQL painel_ofertas.sql ainda não foi rodado -> salva sem os campos novos
const isMissingColumn = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === 'PGRST204' || /column/i.test(error.message || ''));

/** Ofertas salvas no Supabase (o RLS só libera para assinantes ativos e admins) */
export const fetchOffersFromSupabase = async (): Promise<OfferItem[]> => {
  const { data, error } = await supabase.from('es_offers').select('*').order('created_at', { ascending: false });
  if (error) {
    console.warn('Erro ao carregar ofertas do Supabase:', error.message);
    return [];
  }
  return (data || []).map(fromRow);
};

export const createOffer = async (offer: OfferInput): Promise<OfferItem> => {
  let data: any = null;
  let error: any = null;
  for (const version of ROW_VERSIONS) {
    ({ data, error } = await supabase.from('es_offers').insert([version(offer)]).select('*').single());
    if (version === toFullRow && isMissingColumn(error) && offer.siteFilesKey) throw new Error(SITE_FILES_SQL_MISSING);
    if (!isMissingColumn(error)) break;
  }
  if (error) throw new Error(error.message);
  return fromRow(data);
};

export const updateOffer = async (id: string, offer: OfferInput): Promise<OfferItem> => {
  let data: any = null;
  let error: any = null;
  for (const version of ROW_VERSIONS) {
    ({ data, error } = await supabase.from('es_offers').update(version(offer)).eq('id', id).select('*').single());
    if (version === toFullRow && isMissingColumn(error) && offer.siteFilesKey) throw new Error(SITE_FILES_SQL_MISSING);
    if (!isMissingColumn(error)) break;
  }
  if (error) throw new Error(error.message);
  return fromRow(data);
};

export const deleteOffer = async (id: string): Promise<void> => {
  const { error } = await supabase.from('es_offers').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// ---------------- Favoritos do membro ----------------

export const fetchFavoriteIds = async (): Promise<Set<string>> => {
  const { data, error } = await supabase.from('es_favorites').select('offer_id');
  if (error) return new Set();
  return new Set((data || []).map((f: any) => f.offer_id));
};

export const setFavorite = async (offerId: string, favorite: boolean): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return;
  const { error } = favorite
    ? await supabase.from('es_favorites').upsert({ user_id: userId, offer_id: offerId })
    : await supabase.from('es_favorites').delete().eq('user_id', userId).eq('offer_id', offerId);
  if (error) throw new Error(error.message);
};
