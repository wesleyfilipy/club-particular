import { supabase } from './supabase';

export interface AdVideo {
  key: string; // chave no Cloudflare R2
  name: string;
}

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
}

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
});

const toRow = (offer: OfferInput) => ({
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
  const { data, error } = await supabase.from('es_offers').insert([toRow(offer)]).select('*').single();
  if (error) throw new Error(error.message);
  return fromRow(data);
};

export const updateOffer = async (id: string, offer: OfferInput): Promise<OfferItem> => {
  const { data, error } = await supabase.from('es_offers').update(toRow(offer)).eq('id', id).select('*').single();
  if (error) throw new Error(error.message);
  return fromRow(data);
};

export const deleteOffer = async (id: string): Promise<void> => {
  const { error } = await supabase.from('es_offers').delete().eq('id', id);
  if (error) throw new Error(error.message);
};
