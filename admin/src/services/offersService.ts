import { supabase } from './supabase';

export interface OfferItem {
  id: string;
  name: string;
  category: string;
  commission: string;
  description: string;
  vslVideoUrl: string;
  vslPoster: string;
  vslFileName: string;
  vslResolution: string;
  creativeFileName: string;
  creativeFileSize: string;
  siteUrl: string;
  landingPageUrl: string;
  adsLibraryUrl: string;
  conversionRate: string;
  viewsCount: string;
}

export const INITIAL_OFFERS: OfferItem[] = [
  {
    id: 'oferta-001',
    name: 'Fórmula Seca Barriga Natural 3.0',
    category: 'Saúde & Emagrecimento',
    commission: '80% (R$ 157,60 por venda)',
    description: 'Oferta Black campeã de vendas no nicho de emagrecimento. Inclui VSL de alta retenção gravada em 4K e pack completo de anúncios prontos para rodar no Facebook, Instagram e TikTok Ads.',
    vslVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    vslPoster: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600',
    vslFileName: 'vsl_formula_seca_barriga_4k.mp4',
    vslResolution: '4K Ultra HD',
    creativeFileName: 'pack_criativos_anuncios_canva_hd.zip',
    creativeFileSize: '145 MB',
    siteUrl: 'https://formulaseca.com.br',
    landingPageUrl: 'https://formulaseca.com.br/pv-oficial',
    adsLibraryUrl: 'https://facebook.com/ads/library',
    conversionRate: '8.4%',
    viewsCount: '12.450',
  },
  {
    id: 'oferta-002',
    name: 'Método Milionário com IA (MMIA)',
    category: 'Renda Extra & Finanças',
    commission: '75% (R$ 222,75 por venda)',
    description: 'O treinamento mais vendido de automação e vendas com inteligência artificial. VSL cinematográfica com robô 3D, prova social de alunos faturando em dólar e scripts de vendas automática.',
    vslVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    vslPoster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
    vslFileName: 'vsl_metodo_milionario_ia_master.mp4',
    vslResolution: '1080p Full HD',
    creativeFileName: 'video_ads_tiktok_facebook_pack.zip',
    creativeFileSize: '320 MB',
    siteUrl: 'https://metodomilionarioia.com',
    landingPageUrl: 'https://metodomilionarioia.com/vsl-full',
    adsLibraryUrl: 'https://facebook.com/ads/library',
    conversionRate: '9.1%',
    viewsCount: '18.900',
  },
  {
    id: 'oferta-003',
    name: 'Código Secreto da Sedução Suprema',
    category: 'Relacionamento & Conquista',
    commission: '85% (R$ 167,45 por venda)',
    description: 'Ebook + Áudios Guia sobre desenvolvimento pessoal e atração masculina. Pitch validado nos EUA adaptado para o público brasileiro com retenção monstruosa.',
    vslVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    vslPoster: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600',
    vslFileName: 'vsl_codigo_seduicao_suprema.mp4',
    vslResolution: '1080p Full HD',
    creativeFileName: 'pack_banners_copy_criativos.zip',
    creativeFileSize: '98 MB',
    siteUrl: 'https://seducaosuprema.com.br',
    landingPageUrl: 'https://seducaosuprema.com.br/pv-membros',
    adsLibraryUrl: 'https://facebook.com/ads/library',
    conversionRate: '7.8%',
    viewsCount: '8.720',
  },
];

const STORAGE_OFFERS_KEY = 'club_particular_vip_offers_sync_v2';

export const getStoredOffers = (): OfferItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_OFFERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback
  }
  return INITIAL_OFFERS;
};

export const saveStoredOffers = (offers: OfferItem[]) => {
  try {
    localStorage.setItem(STORAGE_OFFERS_KEY, JSON.stringify(offers));
  } catch {
    // Ignore
  }
};

export const fetchOffersFromSupabase = async (): Promise<OfferItem[]> => {
  try {
    const { data, error } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      const mapped: OfferItem[] = data.map((item: any) => ({
        id: item.id || `off-${Date.now()}`,
        name: item.name || 'Oferta VIP',
        category: item.category || item.category_id || 'Geral',
        commission: item.commission || '80%',
        description: item.description || '',
        vslVideoUrl: item.vsl_video_url || item.image_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        vslPoster: item.logo_url || item.image_url || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600',
        vslFileName: item.vsl_file_name || 'vsl_video.mp4',
        vslResolution: item.vsl_resolution || '1080p Full HD',
        creativeFileName: item.creative_file_name || 'pack_anuncios.zip',
        creativeFileSize: item.creative_file_size || '150 MB',
        siteUrl: item.official_site_url || 'https://clubparticular.com',
        landingPageUrl: item.landing_page_url || 'https://clubparticular.com',
        adsLibraryUrl: item.facebook_ads_library_url || 'https://facebook.com/ads/library',
        conversionRate: item.conversion_rate || '8.5%',
        viewsCount: item.views_count || '10.000',
      }));

      saveStoredOffers(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Fallback para ofertas sincronizadas em localStorage:', err);
  }
  return getStoredOffers();
};
