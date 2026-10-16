-- ====================================================================
-- ESCALA SWIPE - UMA SESSÃO POR CONTA
-- Rode no SQL Editor do Supabase (pode rodar mais de uma vez).
--
-- Cada conta (inclusive a do administrador) fica logada em UM aparelho
-- por vez: ao entrar em outro aparelho, o anterior é desconectado.
-- Impede que um login (ou uma assinatura) seja compartilhado.
-- ====================================================================

ALTER TABLE public.es_profiles ADD COLUMN IF NOT EXISTS active_session TEXT;

-- O aparelho que acabou de fazer login passa a ser o único válido
CREATE OR REPLACE FUNCTION public.es_claim_session(session_id TEXT)
RETURNS VOID AS $$
    UPDATE public.es_profiles SET active_session = session_id WHERE id = auth.uid();
$$ LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public;

-- Este aparelho ainda é o aparelho ativo da conta?
CREATE OR REPLACE FUNCTION public.es_session_is_current(session_id TEXT)
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        (SELECT active_session IS NULL OR active_session = session_id FROM public.es_profiles WHERE id = auth.uid()),
        TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.es_claim_session(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.es_session_is_current(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.es_claim_session(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_session_is_current(TEXT) TO authenticated;
