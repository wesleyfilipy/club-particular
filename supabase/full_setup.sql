-- ====================================================================
-- ESCALA SWIPE - BANCO DE DADOS SUPABASE
-- Copie e cole este script completo no SQL Editor do Supabase e clique em Run.
--
-- ISOLADO: este projeto Supabase é compartilhado com outro app. Por isso
-- tudo do Escala Swipe usa o prefixo es_ (tabelas e funções) e o script
-- NÃO altera nenhuma tabela, função ou gatilho existente do outro app
-- (nem a tabela auth.users). Pode ser rodado mais de uma vez.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. TABELAS
-- --------------------------------------------------------------------

-- 1.1 Perfis do Escala Swipe (uma linha por conta/e-mail do Supabase Auth)
CREATE TABLE IF NOT EXISTS public.es_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.2 Assinaturas Stripe (uma por conta; só o webhook do Stripe escreve aqui)
CREATE TABLE IF NOT EXISTS public.es_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.es_profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'expired' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'expired')),
    plan_name TEXT DEFAULT 'Escala Swipe',
    price_amount NUMERIC(10, 2) DEFAULT 0,
    currency TEXT DEFAULT 'BRL',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.3 Ofertas (arquivos ficam no Cloudflare R2; aqui só as chaves do bucket)
CREATE TABLE IF NOT EXISTS public.es_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT,
    commission TEXT NOT NULL DEFAULT '',
    official_site_url TEXT,
    landing_page_url TEXT,
    facebook_ads_library_url TEXT,
    vsl_key TEXT,                                    -- offers/<id>/vsl/arquivo.mp4
    vsl_file_name TEXT,
    vsl_resolution TEXT DEFAULT '1080p Full HD',
    poster_key TEXT,                                 -- offers/<id>/poster/capa.jpg
    creative_key TEXT,                               -- offers/<id>/creatives/pack.zip
    creative_file_name TEXT,
    creative_file_size TEXT,
    ad_videos JSONB NOT NULL DEFAULT '[]'::jsonb,    -- [{ "key": "...", "name": "..." }]
    daily_scale JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{ "date": "2026-10-15", "ads": 42 }]
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS es_profiles_email_idx ON public.es_profiles (lower(email));
CREATE INDEX IF NOT EXISTS es_subscriptions_status_idx ON public.es_subscriptions (status);
CREATE INDEX IF NOT EXISTS es_offers_created_idx ON public.es_offers (created_at DESC);

-- --------------------------------------------------------------------
-- 2. FUNÇÕES (todas com prefixo es_)
-- --------------------------------------------------------------------

-- E-mails de administrador do Escala Swipe
CREATE OR REPLACE FUNCTION public.es_admin_emails()
RETURNS TEXT[] AS $$
    SELECT ARRAY['inteligenciaartificial558@gmail.com']::TEXT[];
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.es_is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM public.es_profiles WHERE id = user_uuid AND role = 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Assinatura paga e dentro do período
CREATE OR REPLACE FUNCTION public.es_is_active_member(user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.es_subscriptions
        WHERE user_id = user_uuid
          AND status = 'active'
          AND (current_period_end IS NULL OR current_period_end > now())
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Cria o perfil do Escala Swipe da conta logada no primeiro acesso
-- (substitui o gatilho em auth.users, que poderia interferir no outro app)
CREATE OR REPLACE FUNCTION public.es_ensure_profile()
RETURNS VOID AS $$
    INSERT INTO public.es_profiles (id, full_name, email, role)
    SELECT u.id,
           COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
           lower(u.email),
           CASE WHEN lower(u.email) = ANY (public.es_admin_emails()) THEN 'admin' ELSE 'member' END
    FROM auth.users u
    WHERE u.id = auth.uid() AND u.email IS NOT NULL
    ON CONFLICT (id) DO NOTHING;
$$ LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.es_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS es_profiles_updated ON public.es_profiles;
CREATE TRIGGER es_profiles_updated BEFORE UPDATE ON public.es_profiles FOR EACH ROW EXECUTE FUNCTION public.es_set_updated_at();

DROP TRIGGER IF EXISTS es_subscriptions_updated ON public.es_subscriptions;
CREATE TRIGGER es_subscriptions_updated BEFORE UPDATE ON public.es_subscriptions FOR EACH ROW EXECUTE FUNCTION public.es_set_updated_at();

DROP TRIGGER IF EXISTS es_offers_updated ON public.es_offers;
CREATE TRIGGER es_offers_updated BEFORE UPDATE ON public.es_offers FOR EACH ROW EXECUTE FUNCTION public.es_set_updated_at();

REVOKE ALL ON FUNCTION public.es_ensure_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.es_ensure_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_is_active_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_is_admin(UUID) TO authenticated;

-- --------------------------------------------------------------------
-- 3. SEGURANÇA (RLS)
--    - Membro vê só o próprio perfil e a própria assinatura; não pode alterá-los.
--    - Ofertas: leitura só para assinante ativo ou admin; escrita só admin.
--    - Assinaturas são escritas apenas pelo webhook do Stripe (service_role).
-- --------------------------------------------------------------------
ALTER TABLE public.es_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.es_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.es_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "es_profiles_select" ON public.es_profiles;
CREATE POLICY "es_profiles_select" ON public.es_profiles
    FOR SELECT USING (auth.uid() = id OR public.es_is_admin(auth.uid()));

DROP POLICY IF EXISTS "es_profiles_admin" ON public.es_profiles;
CREATE POLICY "es_profiles_admin" ON public.es_profiles
    FOR ALL USING (public.es_is_admin(auth.uid())) WITH CHECK (public.es_is_admin(auth.uid()));

DROP POLICY IF EXISTS "es_subscriptions_select" ON public.es_subscriptions;
CREATE POLICY "es_subscriptions_select" ON public.es_subscriptions
    FOR SELECT USING (auth.uid() = user_id OR public.es_is_admin(auth.uid()));

DROP POLICY IF EXISTS "es_offers_select" ON public.es_offers;
CREATE POLICY "es_offers_select" ON public.es_offers
    FOR SELECT USING (public.es_is_active_member(auth.uid()) OR public.es_is_admin(auth.uid()));

DROP POLICY IF EXISTS "es_offers_admin" ON public.es_offers;
CREATE POLICY "es_offers_admin" ON public.es_offers
    FOR ALL USING (public.es_is_admin(auth.uid())) WITH CHECK (public.es_is_admin(auth.uid()));

-- --------------------------------------------------------------------
-- 4. ADMINISTRADOR: cria o perfil admin se a conta já existir no Auth
-- --------------------------------------------------------------------
INSERT INTO public.es_profiles (id, full_name, email, role)
SELECT u.id, 'Administrador', lower(u.email), 'admin'
FROM auth.users u
WHERE lower(u.email) = ANY (public.es_admin_emails())
ON CONFLICT (id) DO UPDATE SET role = 'admin';
