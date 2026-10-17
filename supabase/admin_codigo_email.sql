-- ====================================================================
-- ESCALA SWIPE - ADMIN COM CÓDIGO NO E-MAIL
-- Rode no SQL Editor do Supabase (pode rodar mais de uma vez).
--
-- Os poderes de admin passam a valer quando o login foi confirmado com:
--   * o código enviado ao e-mail do admin (método "otp"/"magiclink"), ou
--   * o código do app autenticador (sessão "aal2"), como antes.
-- Só a senha continua NÃO bastando, e só contas com role = 'admin' valem.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.es_is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM public.es_profiles WHERE id = user_uuid AND role = 'admin')
       AND (
            COALESCE(auth.jwt() ->> 'aal', '') = 'aal2'
            OR EXISTS (
                SELECT 1
                FROM jsonb_array_elements(
                    CASE WHEN jsonb_typeof(auth.jwt() -> 'amr') = 'array' THEN auth.jwt() -> 'amr' ELSE '[]'::jsonb END
                ) AS m
                WHERE m ->> 'method' IN ('totp', 'otp', 'magiclink')
            )
       );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
