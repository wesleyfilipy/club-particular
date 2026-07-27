import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface VSLItem {
  id: string;
  offer_id: string;
  title: string;
  description?: string;
  thumbnail_url: string;
  video_url: string;
  resolution: '720p' | '1080p' | '4K';
  file_size: string;
  duration: string;
}

export interface CreativeItem {
  id: string;
  offer_id: string;
  title: string;
  file_type: 'image' | 'video' | 'pdf' | 'zip';
  file_url: string;
  file_size: string;
}

export interface CopySet {
  id: string;
  offer_id: string;
  headline: string;
  description: string;
  cta: string;
  ad_body: string;
  target_age: string;
  target_gender: string;
  target_country: string;
  target_interests: string;
}

export interface Offer {
  id: string;
  name: string;
  description: string;
  category_id?: string;
  image_url: string;
  logo_url: string;
  commission: string;
  official_site_url?: string;
  landing_page_url?: string;
  facebook_ads_library_url?: string;
  vsl_list?: VSLItem[];
  creatives?: CreativeItem[];
  copies?: CopySet[];
}

interface OffersState {
  categories: Category[];
  offers: Offer[];
  selectedCategory: string | null;
  searchQuery: string;
  isLoading: boolean;
  fetchOffers: () => Promise<void>;
  setSelectedCategory: (categoryId: string | null) => void;
  setSearchQuery: (query: string) => void;
}

// Fallback seed offers for offline or initial load
const MOCK_OFFERS: Offer[] = [
  {
    id: 'o1000000-0000-0000-0000-000000000001',
    name: 'Fórmula Seca Barriga Natural 3.0',
    description: 'Oferta Black de altíssima conversão no nicho de emagrecimento com ticket R$ 197 e taxa de aprovação acima de 85% no cartão e PIX.',
    image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800',
    logo_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=200',
    commission: '80% (R$ 157,60 por venda)',
    official_site_url: 'https://formulaseca.com.br',
    landing_page_url: 'https://formulaseca.com.br/pv-oficial',
    facebook_ads_library_url: 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&q=F%C3%B3rmula%20Seca',
    vsl_list: [
      {
        id: 'v1',
        offer_id: 'o1000000-0000-0000-0000-000000000001',
        title: 'VSL Principal 4K - Ritual Matinal 3 Minutos',
        thumbnail_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        resolution: '4K',
        file_size: '1.2 GB',
        duration: '18:45',
      },
    ],
    creatives: [
      {
        id: 'cr1',
        offer_id: 'o1000000-0000-0000-0000-000000000001',
        title: 'Pack Completo Imagens Canva & Creatives.zip',
        file_type: 'zip',
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        file_size: '145 MB',
      },
    ],
    copies: [
      {
        id: 'cp1',
        offer_id: 'o1000000-0000-0000-0000-000000000001',
        headline: '🚨 Descubra o Ritual de 3 Minutos antes de Dormir que Desinflama a Barriga',
        description: 'Médicos revelam o segredo caseiro usado por milhares de brasileiras para eliminar retenção sem dietas malucas.',
        cta: '▶ ASSISTIR VÍDEO GRATUITO',
        ad_body: 'Você acorda se sentindo pesada e com a barriga inchada? 😳 O problema pode não ser a sua alimentação, mas sim o seu metabolismo noturno travado. Assista ao vídeo curto antes que seja removido do ar!',
        target_age: '30 - 60 anos',
        target_gender: 'Mulheres (85%)',
        target_country: 'Brasil',
        target_interests: 'Emagrecimento, Receitas Low Carb, Saúde da Mulher, Vida Saudável',
      },
    ],
  },
  {
    id: 'o2000000-0000-0000-0000-000000000002',
    name: 'Método Milionário com IA (MMIA)',
    description: 'O treinamento mais vendido de automações e vendas com inteligência artificial. VSL cinematográfica com robô 3D e prova social de alunos fazendo R$ 10k/mês.',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    logo_url: 'https://images.unsplash.com/photo-1614680376593-902f749f7ec0?auto=format&fit=crop&q=80&w=200',
    commission: '75% (R$ 222,75 por venda)',
    official_site_url: 'https://metodomilionarioia.com',
    landing_page_url: 'https://metodomilionarioia.com/vsl-full',
    facebook_ads_library_url: 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&q=Metodo%20Milionario%20IA',
    vsl_list: [
      {
        id: 'v2',
        offer_id: 'o2000000-0000-0000-0000-000000000002',
        title: 'VSL Renda com IA 1080p Full HD',
        thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        resolution: '1080p',
        file_size: '650 MB',
        duration: '14:10',
      },
    ],
    copies: [
      {
        id: 'cp2',
        offer_id: 'o2000000-0000-0000-0000-000000000002',
        headline: '🤖 Robô de Inteligência Artificial Vende no Automático Enquanto Você Dorme',
        description: 'Ferramenta americana recém-chegada ao Brasil permite automatizar vendas diárias sem precisar aparecer.',
        cta: '📲 CLIQUE E VEJA COMO FUNCIONA',
        ad_body: 'Enquanto a maioria tenta vender no 1x1 manualmente, os novos afiliados do Club Particular estão usando algoritmos de IA para escalar em dólar e real com zero esforço manual.',
        target_age: '21 - 45 anos',
        target_gender: 'Homens e Mulheres',
        target_country: 'Brasil, Portugal',
        target_interests: 'Marketing de Afiliados, Dropshipping, ChatGPT, Renda Passiva',
      },
    ],
  },
];

export const useOffersStore = create<OffersState>((set, get) => ({
  categories: [],
  offers: MOCK_OFFERS,
  selectedCategory: null,
  searchQuery: '',
  isLoading: false,

  fetchOffers: async () => {
    try {
      set({ isLoading: true });

      const { data: catData } = await supabase.from('categories').select('*');
      const { data: offerData } = await supabase.from('offers').select(`
        *,
        vsl_list:vsl(*),
        creatives:creatives(*),
        copies:copies(*)
      `);

      if (catData) set({ categories: catData });
      if (offerData && offerData.length > 0) set({ offers: offerData });
    } catch (err) {
      console.warn('Using fallback mock offers:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
