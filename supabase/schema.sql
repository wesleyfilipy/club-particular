-- ====================================================================
-- CLUB PARTICULAR - DATABASE SCHEMA
-- Supabase PostgreSQL tables, foreign keys, triggers and indexes
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. USERS & PROFILES TABLE
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
-- 2. SUBSCRIPTIONS TABLE (Stripe R$100/mês)
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
-- 3. CATEGORIES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'tag',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 4. OFFERS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    commission TEXT NOT NULL, -- e.g., '80% (R$ 197,00)'
    official_site_url TEXT,
    landing_page_url TEXT,
    facebook_ads_library_url TEXT,
    is_featured BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 5. VSL TABLE (Video Sales Letter Player & Download)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vsl (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT NOT NULL,
    video_url TEXT NOT NULL, -- Storage bucket path or direct URL
    resolution TEXT DEFAULT '1080p' CHECK (resolution IN ('720p', '1080p', '4K')),
    file_size TEXT DEFAULT '450 MB',
    duration TEXT DEFAULT '15:30',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 6. FACEBOOK ADS TABLE
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
-- 7. CREATIVES TABLE (Downloads: Images, Videos, PDFs, ZIPs)
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
-- 8. LANDING PAGES TABLE
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
-- 9. COPIES TABLE (Headlines, Descriptions, CTAs & Target Demographics)
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
-- 10. DOWNLOADS LOG TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 11. CHAT MESSAGES TABLE (Supabase Realtime Discord-style)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- --------------------------------------------------------------------
-- 12. NOTIFICATIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_role TEXT DEFAULT 'all',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 13. INDEXES FOR PERFORMANCE
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_offers_category ON public.offers(category_id);
CREATE INDEX IF NOT EXISTS idx_vsl_offer ON public.vsl(offer_id);
CREATE INDEX IF NOT EXISTS idx_creatives_offer ON public.creatives(offer_id);
CREATE INDEX IF NOT EXISTS idx_copies_offer ON public.copies(offer_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);

-- --------------------------------------------------------------------
-- AUTOMATIC TRIGGER FOR NEW USERS & TIMESTAMP UPDATES
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

    -- Create default active subscription for demo/testing
    INSERT INTO public.subscriptions (user_id, status)
    VALUES (NEW.id, 'active');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
