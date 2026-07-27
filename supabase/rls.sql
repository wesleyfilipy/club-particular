-- ====================================================================
-- CLUB PARTICULAR - ROW LEVEL SECURITY (RLS) & SEGURANÇA AVANÇADA
-- ====================================================================

-- 1. FUNÇÕES AUXILIARES DE SEGURANÇA (SECURITY DEFINER)
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

-- 2. HABILITAR RLS EM TODAS AS TABELAS
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

-- 3. POLÍTICAS RLS ESTREITAS (ZERO USING(TRUE))

-- USER_PROFILES
CREATE POLICY "Profiles select policy" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Profiles update policy" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Profiles insert policy" ON public.user_profiles
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Profiles delete policy" ON public.user_profiles
    FOR DELETE USING (public.is_admin(auth.uid()));

-- SUBSCRIPTIONS
CREATE POLICY "Subscriptions select policy" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Subscriptions insert policy" ON public.subscriptions
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Subscriptions update policy" ON public.subscriptions
    FOR UPDATE USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Subscriptions delete policy" ON public.subscriptions
    FOR DELETE USING (public.is_admin(auth.uid()));

-- CATEGORIES
CREATE POLICY "Categories select policy" ON public.categories
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

CREATE POLICY "Categories admin policy" ON public.categories
    FOR ALL USING (public.is_admin(auth.uid()));

-- OFFERS
CREATE POLICY "Offers select policy" ON public.offers
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

CREATE POLICY "Offers admin policy" ON public.offers
    FOR ALL USING (public.is_admin(auth.uid()));

-- VSL
CREATE POLICY "VSL select policy" ON public.vsl
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

CREATE POLICY "VSL admin policy" ON public.vsl
    FOR ALL USING (public.is_admin(auth.uid()));

-- FACEBOOK_VIDEOS
CREATE POLICY "Facebook videos select policy" ON public.facebook_videos
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

CREATE POLICY "Facebook videos admin policy" ON public.facebook_videos
    FOR ALL USING (public.is_admin(auth.uid()));

-- CREATIVES
CREATE POLICY "Creatives select policy" ON public.creatives
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

CREATE POLICY "Creatives admin policy" ON public.creatives
    FOR ALL USING (public.is_admin(auth.uid()));

-- EBOOKS
CREATE POLICY "Ebooks select policy" ON public.ebooks
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

CREATE POLICY "Ebooks admin policy" ON public.ebooks
    FOR ALL USING (public.is_admin(auth.uid()));

-- BONUS
CREATE POLICY "Bonus select policy" ON public.bonus
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

CREATE POLICY "Bonus admin policy" ON public.bonus
    FOR ALL USING (public.is_admin(auth.uid()));

-- COPIES
CREATE POLICY "Copies select policy" ON public.copies
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

CREATE POLICY "Copies admin policy" ON public.copies
    FOR ALL USING (public.is_admin(auth.uid()));

-- CHAT_MESSAGES
CREATE POLICY "Chat select policy" ON public.chat_messages
    FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid()))
        AND deleted_at IS NULL
    );

CREATE POLICY "Chat insert policy" ON public.chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid()))
    );

CREATE POLICY "Chat update policy" ON public.chat_messages
    FOR UPDATE USING (
        auth.uid() = user_id OR public.is_admin(auth.uid())
    );

CREATE POLICY "Chat delete policy" ON public.chat_messages
    FOR DELETE USING (public.is_admin(auth.uid()));

-- NOTIFICATIONS
CREATE POLICY "Notifications select policy" ON public.notifications
    FOR SELECT USING (auth.uid() IS NOT NULL AND (public.is_active_member(auth.uid()) OR public.is_admin(auth.uid())));

CREATE POLICY "Notifications admin policy" ON public.notifications
    FOR ALL USING (public.is_admin(auth.uid()));
