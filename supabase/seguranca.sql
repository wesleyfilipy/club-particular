-- ====================================================================
-- ESCALA SWIPE - SEGURANÇA: ADMIN COM 2 ETAPAS + ASSINATURA INDIVIDUAL
-- Rode no SQL Editor do Supabase (pode rodar mais de uma vez).
-- ====================================================================

-- 1. ADMIN SÓ COM VERIFICAÇÃO EM 2 ETAPAS
-- Os poderes de admin (ver/editar todas as ofertas, perfis e assinaturas)
-- só valem quando o login foi confirmado com o código do app autenticador
-- (sessão "aal2"). Só a senha não basta.
CREATE OR REPLACE FUNCTION public.es_is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM public.es_profiles WHERE id = user_uuid AND role = 'admin')
       AND COALESCE(auth.jwt() ->> 'aal', '') = 'aal2';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. UM PERFIL POR E-MAIL
CREATE UNIQUE INDEX IF NOT EXISTS es_profiles_email_unique ON public.es_profiles (lower(email));

-- 3. ASSINATURA PRESA À CONTA
-- Assinatura ainda sem dono (paga antes de a pessoa entrar no site) vale pelo e-mail;
-- no primeiro acesso ela é vinculada à conta e passa a valer SÓ para essa conta.
CREATE OR REPLACE FUNCTION public.es_is_active_member(user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.es_subscriptions s
        JOIN public.es_profiles p ON p.id = user_uuid
        WHERE (s.user_id = user_uuid OR (s.user_id IS NULL AND s.email = p.email))
          AND s.status = 'active'
          AND (s.current_period_end IS NULL OR s.current_period_end > now())
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.es_ensure_profile()
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.es_profiles (id, full_name, email, role)
    SELECT u.id,
           COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
           lower(u.email),
           CASE WHEN lower(u.email) = ANY (public.es_admin_emails()) THEN 'admin' ELSE 'member' END
    FROM auth.users u
    WHERE u.id = auth.uid() AND u.email IS NOT NULL
    ON CONFLICT DO NOTHING;

    -- Vincula à conta a assinatura paga com o e-mail dela que ainda não tem dono
    UPDATE public.es_subscriptions s
    SET user_id = p.id
    FROM public.es_profiles p
    WHERE p.id = auth.uid() AND s.user_id IS NULL AND s.email = p.email;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.es_ensure_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.es_ensure_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_is_active_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_is_admin(UUID) TO authenticated;

-- Vincula agora as assinaturas que já têm conta com o mesmo e-mail
UPDATE public.es_subscriptions s
SET user_id = p.id
FROM public.es_profiles p
WHERE s.user_id IS NULL AND s.email = p.email;
