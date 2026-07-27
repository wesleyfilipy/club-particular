-- ====================================================================
-- CLUB PARTICULAR - INITIAL SEED DATA
-- Premium offers, categories, VSL records, copies, and chat samples
-- ====================================================================

-- 1. Insert Initial Categories
INSERT INTO public.categories (id, name, slug, icon) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Saúde & Emagrecimento', 'saude-emagrecimento', 'heart-pulse'),
    ('c2000000-0000-0000-0000-000000000002', 'Renda Extra & Finanças', 'renda-extra-financas', 'trending-up'),
    ('c3000000-0000-0000-0000-000000000003', 'Desenvolvimento Pessoal', 'desenvolvimento-pessoal', 'sparkles'),
    ('c4000000-0000-0000-0000-000000000004', 'Relacionamento & Conquista', 'relacionamento', 'flame')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Premium Offers
INSERT INTO public.offers (
    id, name, description, category_id, image_url, logo_url, commission, 
    official_site_url, landing_page_url, facebook_ads_library_url, is_featured
) VALUES
(
    'o1000000-0000-0000-0000-000000000001',
    'Fórmula Seca Barriga Natural 3.0',
    'Oferta Black de altíssima conversão no nicho de emagrecimento com ticket R$ 197 e taxa de aprovação acima de 85% no cartão e PIX.',
    'c1000000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=200',
    '80% (R$ 157,60 por venda)',
    'https://formulaseca.com.br',
    'https://formulaseca.com.br/pv-oficial',
    'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&q=F%C3%B3rmula%20Seca',
    true
),
(
    'o2000000-0000-0000-0000-000000000002',
    'Método Milionário com IA (MMIA)',
    'O treinamento mais vendido de automações e vendas com inteligência artificial. VSL cinematográfica com robô 3D e prova social de alunos fazendo R$ 10k/mês.',
    'c2000000-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1614680376593-902f749f7ec0?auto=format&fit=crop&q=80&w=200',
    '75% (R$ 222,75 por venda)',
    'https://metodomilionarioia.com',
    'https://metodomilionarioia.com/vsl-full',
    'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&q=Metodo%20Milionario%20IA',
    true
),
(
    'o3000000-0000-0000-0000-000000000003',
    'Código Secreto da Sedução Suprema',
    'Nicho de relacionamentos masculinos com pitch validado nos EUA e adaptado ao mercado brasileiro. Conversão monstruosa para tráfego direto no Facebook e TikTok.',
    'c4000000-0000-0000-0000-000000000004',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    '85% (R$ 167,45 por venda)',
    'https://seducaosuprema.com.br',
    'https://seducaosuprema.com.br/pv-membros',
    'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&q=Seducao%20Suprema',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert VSL Records
INSERT INTO public.vsl (id, offer_id, title, description, thumbnail_url, video_url, resolution, file_size, duration) VALUES
(
    'v1000000-0000-0000-0000-000000000001',
    'o1000000-0000-0000-0000-000000000001',
    'VSL Principal 4K - O Ritual Matinal de 3 Minutos',
    'Vídeo de vendas oficial de alta retenção. Pitch revelado aos 14:20. Formato MP4 sem marca d''água pronto para anunciar.',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    '4K',
    '1.2 GB',
    '18:45'
),
(
    'v2000000-0000-0000-0000-000000000002',
    'o2000000-0000-0000-0000-000000000002',
    'VSL Renda com IA 1080p Full HD',
    'Vídeo com animações 3D e narração profissional de voz neural super persuasiva. CTR de VSL acima de 8.4%.',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    '1080p',
    '650 MB',
    '14:10'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Facebook Ads & Creatives
INSERT INTO public.facebook_ads (id, offer_id, title, video_url, thumbnail_url, file_size) VALUES
(
    'f1000000-0000-0000-0000-000000000001',
    'o1000000-0000-0000-0000-000000000001',
    'Criativo 01 - Antes & Depois (UGC Depoimento)',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=300',
    '38 MB'
),
(
    'f2000000-0000-0000-0000-000000000002',
    'o2000000-0000-0000-0000-000000000002',
    'Criativo Bot Celular - Notificação do Banco',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300',
    '52 MB'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Creatives Downloads
INSERT INTO public.creatives (id, offer_id, title, file_type, file_url, file_size) VALUES
(
    'cr100000-0000-0000-0000-000000000001',
    'o1000000-0000-0000-0000-000000000001',
    'Pack Completo de Imagens HD & Banners Canva.zip',
    'zip',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    '145 MB'
),
(
    'cr200000-0000-0000-0000-000000000002',
    'o2000000-0000-0000-0000-000000000002',
    'Guia de Nicho & Script de Vendas no WhatsApp.pdf',
    'pdf',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    '12 MB'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Copy Sets & Target Demographics
INSERT INTO public.copies (
    id, offer_id, headline, description, cta, ad_body, 
    target_age, target_gender, target_country, target_interests
) VALUES
(
    'cp10000-0000-0000-0000-000000000001',
    'o1000000-0000-0000-0000-000000000001',
    '🚨 Descubra o Ritual de 3 Minutos antes de Dormir que Desinflama a Barriga',
    'Médicos revelam o segredo caseiro usado por milhares de brasileiras para eliminar retenção sem dietas malucas.',
    '▶ ASSISTIR VÍDEO GRATUITO',
    'Você acorda se sentindo pesada e com a barriga inchada? 😳 O problema pode não ser a sua alimentação, mas sim o seu metabolismo noturno travado. Assista ao vídeo curto antes que seja removido do ar!',
    '30 - 60 anos',
    'Mulheres (85%)',
    'Brasil',
    'Emagrecimento, Receitas Low Carb, Saúde da Mulher, Vida Saudável'
),
(
    'cp20000-0000-0000-0000-000000000002',
    '🤖 Robô de Inteligência Artificial Vende no Automático Enquanto Você Dorme',
    'Ferramenta americana recém-chegada ao Brasil permite automatizar vendas diárias sem precisar aparecer.',
    '📲 CLIQUE E VEJA COMO FUNCIONA',
    'Enquanto a maioria tenta vender no 1x1 manualmente, os novos afiliados do Club Particular estão usando algoritmos de IA para escalar em dólar e real com zero esforço manual.',
    '21 - 45 anos',
    'Homens e Mulheres',
    'Brasil, Portugal, Angola',
    'Marketing de Afiliados, Dropshipping, ChatGPT, Renda Passiva'
)
ON CONFLICT (id) DO NOTHING;
