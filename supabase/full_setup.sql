-- ====================================================================
-- CLUB PARTICULAR - COMPLETO BANCO DE DADOS SUPABASE (ALL IN ONE)
-- Copie e cole este script completo no SQL Editor do Supabase Dashboard
-- ====================================================================

-- 1. EXTENSÕES POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 2. TABELA DE PERFIS DE USUÁRIOS (user_profiles)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 3. TABELA DE ASSINATURAS (subscriptions - Stripe R$100/mês)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'expired')),
    plan_name TEXT DEFAULT 'Club Particular VIP (R$100/mês)',
    price_amount NUMERIC(10, 2) DEFAULT 100.00,
    currency TEXT DEFAULT 'BRL',
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 4. TABELA DE CATEGORIAS (categories)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'tag',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 5. TABELA DE OFERTAS (offers)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    commission TEXT NOT NULL,
    official_site_url TEXT,
    landing_page_url TEXT,
    facebook_ads_library_url TEXT,
    is_featured BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 6. TABELA DE VSL (vsl - Vídeos de Vendas 4K/1080p)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vsl (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT NOT NULL,
    video_url TEXT NOT NULL,
    resolution TEXT DEFAULT '1080p' CHECK (resolution IN ('720p', '1080p', '4K')),
    file_size TEXT DEFAULT '450 MB',
    duration TEXT DEFAULT '15:30',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 7. TABELA DE ANÚNCIOS FACEBOOK (facebook_ads)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.facebook_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size TEXT DEFAULT '45 MB',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 8. TABELA DE CRIATIVOS E PACOTES (creatives)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'pdf', 'zip')),
    file_url TEXT NOT NULL,
    file_size TEXT DEFAULT '15 MB',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 9. TABELA DE LANDING PAGES (landing_pages)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.landing_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    preview_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 10. TABELA DE COPIES E PÚBLICO ALVO (copies)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.copies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    headline TEXT NOT NULL,
    description TEXT NOT NULL,
    cta TEXT NOT NULL,
    ad_body TEXT NOT NULL,
    target_age TEXT DEFAULT '25 - 54 anos',
    target_gender TEXT DEFAULT 'Homens e Mulheres',
    target_country TEXT DEFAULT 'Brasil',
    target_interests TEXT DEFAULT 'Marketing Digital, Empreendedorismo, Finanças',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 11. TABELA DE MENSAGENS DO CHAT (chat_messages - Realtime)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    user_email TEXT,
    user_name TEXT,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Ativar Supabase Realtime no Chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- --------------------------------------------------------------------
-- 12. GATILHO AUTOMÁTICO PARA NOVO USUÁRIO REGISTRADO NO SUPABASE
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Membro VIP'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'member')
    );

    INSERT INTO public.subscriptions (user_id, status)
    VALUES (NEW.id, 'active');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------
-- 13. SEGURANÇA E REGRAS RLS (ROW LEVEL SECURITY)
-- --------------------------------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vsl ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura de Perfis" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Atualização do Próprio Perfil" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Leitura de Categorias" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Leitura de Ofertas" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Leitura de VSLs" ON public.vsl FOR SELECT USING (true);
CREATE POLICY "Leitura de Facebook Ads" ON public.facebook_ads FOR SELECT USING (true);
CREATE POLICY "Leitura de Criativos" ON public.creatives FOR SELECT USING (true);
CREATE POLICY "Leitura de Copies" ON public.copies FOR SELECT USING (true);

CREATE POLICY "Leitura do Chat" ON public.chat_messages FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Envio de Mensagens no Chat" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 14. INSERÇÃO DE DADOS INICIAIS (SEED DATA COM UUIDs VÁLIDOS)
-- --------------------------------------------------------------------
INSERT INTO public.categories (id, name, slug, icon) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Saúde & Emagrecimento', 'saude-emagrecimento', 'heart-pulse'),
    ('c2000000-0000-0000-0000-000000000002', 'Renda Extra & Finanças', 'renda-extra-financas', 'trending-up'),
    ('c3000000-0000-0000-0000-000000000003', 'Desenvolvimento Pessoal', 'desenvolvimento-pessoal', 'sparkles'),
    ('c4000000-0000-0000-0000-000000000004', 'Relacionamento & Conquista', 'relacionamento', 'flame')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.offers (
    id, name, description, category_id, image_url, logo_url, commission, 
    official_site_url, landing_page_url, facebook_ads_library_url, is_featured
) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'Fórmula Seca Barriga Natural 3.0',
    'Oferta Black de altíssima conversão no nicho de emagrecimento com ticket R$ 197 e taxa de aprovação acima de 85%.',
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
    '20000000-0000-0000-0000-000000000002',
    'Método Milionário com IA (MMIA)',
    'O treinamento mais vendido de automações e vendas com inteligência artificial. VSL cinematográfica em 4K.',
    'c2000000-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1614680376593-902f749f7ec0?auto=format&fit=crop&q=80&w=200',
    '75% (R$ 222,75 por venda)',
    'https://metodomilionarioia.com',
    'https://metodomilionarioia.com/vsl-full',
    'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&q=Metodo%20Milionario%20IA',
    true
)
ON CONFLICT (id) DO NOTHING;
