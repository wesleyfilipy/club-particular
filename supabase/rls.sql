-- ====================================================================
-- CLUB PARTICULAR - ROW LEVEL SECURITY (RLS) POLICIES
-- Strict access control: Only Active Paid Members can read offers, VSLs & chat
-- ====================================================================

-- 1. Enable RLS on all public tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vsl ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user has active subscription
CREATE OR REPLACE FUNCTION public.is_active_member(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE user_id = user_uuid
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if user is admin or moderator
CREATE OR REPLACE FUNCTION public.is_admin_or_mod(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = user_uuid
          AND role IN ('admin', 'moderator')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------
-- USER PROFILES POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Allow public read access to basic profiles"
    ON public.user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- --------------------------------------------------------------------
-- SUBSCRIPTIONS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Users can view their own subscription status"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id OR is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins can insert or modify subscriptions"
    ON public.subscriptions FOR ALL
    USING (is_admin_or_mod(auth.uid()));

-- --------------------------------------------------------------------
-- OFFERS & CONTENT POLICIES (Only Active Members Can Access)
-- --------------------------------------------------------------------
CREATE POLICY "Active members can view categories"
    ON public.categories FOR SELECT
    USING (is_active_member(auth.uid()) OR is_admin_or_mod(auth.uid()));

CREATE POLICY "Active members can view offers"
    ON public.offers FOR SELECT
    USING (is_active_member(auth.uid()) OR is_admin_or_mod(auth.uid()));

CREATE POLICY "Active members can view VSLs"
    ON public.vsl FOR SELECT
    USING (is_active_member(auth.uid()) OR is_admin_or_mod(auth.uid()));

CREATE POLICY "Active members can view FB Ads"
    ON public.facebook_ads FOR SELECT
    USING (is_active_member(auth.uid()) OR is_admin_or_mod(auth.uid()));

CREATE POLICY "Active members can view creatives"
    ON public.creatives FOR SELECT
    USING (is_active_member(auth.uid()) OR is_admin_or_mod(auth.uid()));

CREATE POLICY "Active members can view landing pages"
    ON public.landing_pages FOR SELECT
    USING (is_active_member(auth.uid()) OR is_admin_or_mod(auth.uid()));

CREATE POLICY "Active members can view copies"
    ON public.copies FOR SELECT
    USING (is_active_member(auth.uid()) OR is_admin_or_mod(auth.uid()));

-- Admin CRUD permissions for offers & content
CREATE POLICY "Admins full management for offers"
    ON public.offers FOR ALL USING (is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins full management for VSLs"
    ON public.vsl FOR ALL USING (is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins full management for creatives"
    ON public.creatives FOR ALL USING (is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins full management for copies"
    ON public.copies FOR ALL USING (is_admin_or_mod(auth.uid()));

-- --------------------------------------------------------------------
-- CHAT MESSAGES POLICIES (Realtime Discord-style)
-- --------------------------------------------------------------------
CREATE POLICY "Active members can view chat messages"
    ON public.chat_messages FOR SELECT
    USING ((is_active_member(auth.uid()) OR is_admin_or_mod(auth.uid())) AND deleted_at IS NULL);

CREATE POLICY "Active members can post chat messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id AND (is_active_member(auth.uid()) OR is_admin_or_mod(auth.uid())));

CREATE POLICY "Users can soft delete own message or mods can delete any"
    ON public.chat_messages FOR UPDATE
    USING (auth.uid() = user_id OR is_admin_or_mod(auth.uid()));

-- --------------------------------------------------------------------
-- DOWNLOADS LOG POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Users can log their downloads"
    ON public.downloads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view download logs"
    ON public.downloads FOR SELECT
    USING (is_admin_or_mod(auth.uid()) OR auth.uid() = user_id);
