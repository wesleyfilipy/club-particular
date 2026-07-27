-- ====================================================================
-- CLUB PARTICULAR - COMPLETO BANCO DE DADOS SUPABASE (PRODUÇÃO SEGURA)
-- Copie e cole este script completo no SQL Editor do Supabase Dashboard
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. EXTENSÕES & SETUP INICIAL
-- --------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 2. CRIAÇÃO DAS TABELAS COM CHAVES ESTRANGEIRAS
-- --------------------------------------------------------------------

-- 2.1 TABELA DE PERFIS DE USUÁRIOS (user_profiles)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 TABELA DE ASSINATURAS (subscriptions - Stripe R$100/mês)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'expired' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'expired')),
    plan_name TEXT DEFAULT 'Club Particular VIP (R$100/mês)',
    price_amount NUMERIC(10, 2) DEFAULT 100.00,
    currency TEXT DEFAULT 'BRL',
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.3 TABELA DE CATEGORIAS (categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'tag',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.4 TABELA DE OFERTAS (offers)
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 2.5 TABELA DE VSL (vsl - Vídeos de Vendas 4K/1080p)
CREATE TABLE IF NOT EXISTS public.vsl (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT NOT NULL,
    video_url TEXT NOT NULL,
    resolution TEXT DEFAULT '1080p' CHECK (resolution IN ('720p', '1080p', '4K')),
    file_size TEXT DEFAULT '450 MB',
    duration TEXT DEFAULT '15:30',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.6 TABELA DE VÍDEOS FACEBOOK (facebook_videos)
CREATE TABLE IF NOT EXISTS public.facebook_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size TEXT DEFAULT '45 MB',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.7 TABELA DE CRIATIVOS E PACOTES (creatives)
CREATE TABLE IF NOT EXISTS public.creatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'pdf', 'zip')),
    file_url TEXT NOT NULL,
    file_size TEXT DEFAULT '15 MB',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.8 TABELA DE EBOOKS (ebooks)
CREATE TABLE IF NOT EXISTS public.ebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_size TEXT DEFAULT '20 MB',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.9 TABELA DE BÔNUS (bonus)
CREATE TABLE IF NOT EXISTS public.bonus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_size TEXT DEFAULT '10 MB',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.10 TABELA DE COPIES (copies)
CREATE TABLE IF NOT EXISTS public.copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    headline TEXT NOT NULL,
    description TEXT NOT NULL,
    cta TEXT NOT NULL,
    ad_body TEXT NOT NULL,
    target_age TEXT DEFAULT '25 - 54 anos',
    target_gender TEXT DEFAULT 'Homens e Mulheres',
    target_country TEXT DEFAULT 'Brasil',
    target_interests TEXT DEFAULT 'Marketing Digital, Empreendedorismo, Finanças',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.11 TABELA DE MENSAGENS DO CHAT (chat_messages)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    user_email TEXT,
    user_name TEXT,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2.12 TABELA DE NOTIFICAÇÕES (notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_role TEXT DEFAULT 'all',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.13 ATIVAR REALTIME NO CHAT (IDEMPOTENTE)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE p.pubname = 'supabase_realtime'
          AND n.nspname = 'public'
          AND c.relname = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- --------------------------------------------------------------------
-- 3. ÍNDICES DE PERFORMANCE (ÍNDICES EM CHAVES ESTRANGEIRAS E FILTROS)
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_offers_category ON public.offers(category_id);
CREATE INDEX IF NOT EXISTS idx_vsl_offer ON public.vsl(offer_id);
CREATE INDEX IF NOT EXISTS idx_facebook_videos_offer ON public.facebook_videos(offer_id);
CREATE INDEX IF NOT EXISTS idx_creatives_offer ON public.creatives(offer_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_offer ON public.ebooks(offer_id);
CREATE INDEX IF NOT EXISTS idx_bonus_offer ON public.bonus(offer_id);
CREATE INDEX IF NOT EXISTS idx_copies_offer ON public.copies(offer_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at DESC);

-- --------------------------------------------------------------------
-- 4. FUNÇÕES AUXILIARES DE SEGURANÇA (SECURITY DEFINER)
-- --------------------------------------------------------------------

-- Função Auxiliar 1: Verificar se usuário é Administrador
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF user_uuid IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = user_uuid
          AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função Auxiliar 2: Verificar se usuário tem Assinatura Ativa
CREATE OR REPLACE FUNCTION public.is_active_member(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF user_uuid IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE user_id = user_uuid
          AND status = 'active'
          AND (current_period_end IS NULL OR current_period_end > timezone('utc'::text, now()))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------------------------------
-- 5. TRIGGERS AUTOMÁTICOS (UPDATED_AT & HANDLE_NEW_USER & ROLE ESCALATION)
-- --------------------------------------------------------------------

-- Trigger 5.1: Atualização automática de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_profiles_updated ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_subscriptions_updated ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_offers_updated ON public.offers;
CREATE TRIGGER trg_offers_updated BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_vsl_updated ON public.vsl;
CREATE TRIGGER trg_vsl_updated BEFORE UPDATE ON public.vsl FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_facebook_videos_updated ON public.facebook_videos;
CREATE TRIGGER trg_facebook_videos_updated BEFORE UPDATE ON public.facebook_videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_creatives_updated ON public.creatives;
CREATE TRIGGER trg_creatives_updated BEFORE UPDATE ON public.creatives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ebooks_updated ON public.ebooks;
CREATE TRIGGER trg_ebooks_updated BEFORE UPDATE ON public.ebooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_bonus_updated ON public.bonus;
CREATE TRIGGER trg_bonus_updated BEFORE UPDATE ON public.bonus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_copies_updated ON public.copies;
CREATE TRIGGER trg_copies_updated BEFORE UPDATE ON public.copies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_notifications_updated ON public.notifications;
CREATE TRIGGER trg_notifications_updated BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger 5.2: Criação automática de perfil no signup (Forçando role='member' e SEM assinatura ativa padrão)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Membro VIP'),
        NEW.email,
        'member' -- Força rigorosamente role='member' (impossibilita escalação de privilégio)
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger 5.3: Impedir alteração não autorizada da coluna 'role' por usuários normais
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF (auth.role() = 'authenticated') THEN
        IF NOT public.is_admin(auth.uid()) THEN
            IF (OLD.role IS DISTINCT FROM NEW.role) THEN
                RAISE EXCEPTION 'Acesso Negado: Apenas administradores ou Edge Functions via service_role podem alterar a função (role) de um usuário.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.user_profiles;
CREATE TRIGGER trg_prevent_role_escalation
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- --------------------------------------------------------------------
-- 6. HABILITAÇÃO DO ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- --------------------------------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vsl ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 7. POLÍTICAS RLS ESTREITAS (COM DROP IF EXISTS PARA IDEMPOTÊNCIA TOTAL)
-- --------------------------------------------------------------------

-- 7.1 USER_PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles select policy" ON public.user_profiles;
CREATE POLICY "Profiles select policy" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Profiles update policy" ON public.user_profiles;
CREATE POLICY "Profiles update policy" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Profiles insert policy" ON public.user_profiles;
CREATE POLICY "Profiles insert policy" ON public.user_profiles
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Profiles delete policy" ON public.user_profiles;
CREATE POLICY "Profiles delete policy" ON public.user_profiles
    FOR DELETE USING (public.is_admin(auth.uid()));

-- 7.2 SUBSCRIPTIONS POLICIES (Vinculado exclusivamente ao auth.uid())
DROP POLICY IF EXISTS "Subscriptions select policy" ON public.subscriptions;
CREATE POLICY "Subscriptions select policy" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Subscriptions insert policy" ON public.subscriptions;
CREATE POLICY "Subscriptions insert policy" ON public.subscriptions
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Subscriptions update policy" ON public.subscriptions;
CREATE POLICY "Subscriptions update policy" ON public.subscriptions
    FOR UPDATE USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Subscriptions delete policy" ON public.subscriptions;
CREATE POLICY "Subscriptions delete policy" ON public.subscriptions
    FOR DELETE USING (public.is_admin(auth.uid()));

-- 7.3 CATEGORIES POLICIES
DROP POLICY IF EXISTS "Categories select policy" ON public.categories;
CREATE POLICY "Categories select policy" ON public.categories
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

DROP POLICY IF EXISTS "Categories admin policy" ON public.categories;
CREATE POLICY "Categories admin policy" ON public.categories
    FOR ALL USING (public.is_admin(auth.uid()));

-- 7.4 OFFERS POLICIES
DROP POLICY IF EXISTS "Offers select policy" ON public.offers;
CREATE POLICY "Offers select policy" ON public.offers
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

DROP POLICY IF EXISTS "Offers admin policy" ON public.offers;
CREATE POLICY "Offers admin policy" ON public.offers
    FOR ALL USING (public.is_admin(auth.uid()));

-- 7.5 VSL POLICIES
DROP POLICY IF EXISTS "VSL select policy" ON public.vsl;
CREATE POLICY "VSL select policy" ON public.vsl
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

DROP POLICY IF EXISTS "VSL admin policy" ON public.vsl;
CREATE POLICY "VSL admin policy" ON public.vsl
    FOR ALL USING (public.is_admin(auth.uid()));

-- 7.6 FACEBOOK_VIDEOS POLICIES
DROP POLICY IF EXISTS "Facebook videos select policy" ON public.facebook_videos;
CREATE POLICY "Facebook videos select policy" ON public.facebook_videos
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

DROP POLICY IF EXISTS "Facebook videos admin policy" ON public.facebook_videos;
CREATE POLICY "Facebook videos admin policy" ON public.facebook_videos
    FOR ALL USING (public.is_admin(auth.uid()));

-- 7.7 CREATIVES POLICIES
DROP POLICY IF EXISTS "Creatives select policy" ON public.creatives;
CREATE POLICY "Creatives select policy" ON public.creatives
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

DROP POLICY IF EXISTS "Creatives admin policy" ON public.creatives;
CREATE POLICY "Creatives admin policy" ON public.creatives
    FOR ALL USING (public.is_admin(auth.uid()));

-- 7.8 EBOOKS POLICIES
DROP POLICY IF EXISTS "Ebooks select policy" ON public.ebooks;
CREATE POLICY "Ebooks select policy" ON public.ebooks
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

DROP POLICY IF EXISTS "Ebooks admin policy" ON public.ebooks;
CREATE POLICY "Ebooks admin policy" ON public.ebooks
    FOR ALL USING (public.is_admin(auth.uid()));

-- 7.9 BONUS POLICIES
DROP POLICY IF EXISTS "Bonus select policy" ON public.bonus;
CREATE POLICY "Bonus select policy" ON public.bonus
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

DROP POLICY IF EXISTS "Bonus admin policy" ON public.bonus;
CREATE POLICY "Bonus admin policy" ON public.bonus
    FOR ALL USING (public.is_admin(auth.uid()));

-- 7.10 COPIES POLICIES
DROP POLICY IF EXISTS "Copies select policy" ON public.copies;
CREATE POLICY "Copies select policy" ON public.copies
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

DROP POLICY IF EXISTS "Copies admin policy" ON public.copies;
CREATE POLICY "Copies admin policy" ON public.copies
    FOR ALL USING (public.is_admin(auth.uid()));

-- 7.11 CHAT_MESSAGES POLICIES
DROP POLICY IF EXISTS "Chat select policy" ON public.chat_messages;
CREATE POLICY "Chat select policy" ON public.chat_messages
    FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid()))
        AND deleted_at IS NULL
    );

DROP POLICY IF EXISTS "Chat insert policy" ON public.chat_messages;
CREATE POLICY "Chat insert policy" ON public.chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid()))
    );

DROP POLICY IF EXISTS "Chat update policy" ON public.chat_messages;
CREATE POLICY "Chat update policy" ON public.chat_messages
    FOR UPDATE USING (
        auth.uid() = user_id OR public.is_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Chat delete policy" ON public.chat_messages;
CREATE POLICY "Chat delete policy" ON public.chat_messages
    FOR DELETE USING (public.is_admin(auth.uid()));

-- 7.12 NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Notifications select policy" ON public.notifications;
CREATE POLICY "Notifications select policy" ON public.notifications
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

DROP POLICY IF EXISTS "Notifications admin policy" ON public.notifications;
CREATE POLICY "Notifications admin policy" ON public.notifications
    FOR ALL USING (public.is_admin(auth.uid()));

-- --------------------------------------------------------------------
-- 8. DADOS INICIAIS (SEED DATA COM UUIDs VÁLIDOS)
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
    'c2000000-0000-0000-0000-000000000003',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1614680376593-902f749f7ec0?auto=format&fit=crop&q=80&w=200',
    '75% (R$ 222,75 por venda)',
    'https://metodomilionarioia.com',
    'https://metodomilionarioia.com/vsl-full',
    'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&q=Metodo%20Milionario%20IA',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 7. AUTO-CONFIRMAR E-MAILS DE ADMINISTRADORES NO SUPABASE AUTH (Elimina erro "Email not confirmed")
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
WHERE LOWER(email) IN (
    'inteligenciaartificial558@gmail.com',
    'wesleyfilipy454@gmail.com',
    'admin@clubparticular.com'
);
