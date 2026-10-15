-- ====================================================================
-- ESCALA SWIPE - PAGAMENTO PELA LASTLINK
-- Rode no SQL Editor do Supabase DEPOIS do full_setup.sql (pode rodar mais de uma vez).
--
-- A assinatura passa a ser vinculada ao E-MAIL usado na compra da Lastlink:
-- a conta do site com esse e-mail fica liberada enquanto a assinatura estiver
-- paga. Se não renovar, o acesso fecha sozinho no fim do período.
-- ====================================================================

-- 1. Assinaturas por e-mail (a compra pode chegar antes da pessoa criar a conta)
ALTER TABLE public.es_subscriptions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.es_subscriptions ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.es_subscriptions ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'lastlink';
ALTER TABLE public.es_subscriptions ADD COLUMN IF NOT EXISTS external_subscription_id TEXT;
ALTER TABLE public.es_subscriptions ADD COLUMN IF NOT EXISTS last_event TEXT;
ALTER TABLE public.es_subscriptions ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMPTZ;

UPDATE public.es_subscriptions s
SET email = p.email
FROM public.es_profiles p
WHERE s.user_id = p.id AND s.email IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS es_subscriptions_email_key ON public.es_subscriptions (email);

-- 2. Registro de todos os eventos recebidos da Lastlink (evita processar o mesmo evento 2x)
CREATE TABLE IF NOT EXISTS public.es_payment_events (
    id TEXT PRIMARY KEY,                 -- Id do evento enviado pela Lastlink
    event TEXT NOT NULL,
    email TEXT,
    is_test BOOLEAN NOT NULL DEFAULT FALSE,
    payload JSONB NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.es_payment_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "es_payment_events_admin" ON public.es_payment_events;
CREATE POLICY "es_payment_events_admin" ON public.es_payment_events
    FOR SELECT USING (public.es_is_admin(auth.uid()));

-- 3. Assinante ativo = assinatura paga, dentro do período, no e-mail da conta
CREATE OR REPLACE FUNCTION public.es_is_active_member(user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.es_subscriptions s
        JOIN public.es_profiles p ON p.id = user_uuid
        WHERE (s.user_id = user_uuid OR s.email = p.email)
          AND s.status = 'active'
          AND (s.current_period_end IS NULL OR s.current_period_end > now())
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.es_is_active_member(UUID) TO authenticated;

-- 4. O membro vê a própria assinatura (pelo ID ou pelo e-mail da conta)
DROP POLICY IF EXISTS "es_subscriptions_select" ON public.es_subscriptions;
CREATE POLICY "es_subscriptions_select" ON public.es_subscriptions
    FOR SELECT USING (
        auth.uid() = user_id
        OR email = (SELECT p.email FROM public.es_profiles p WHERE p.id = auth.uid())
        OR public.es_is_admin(auth.uid())
    );
