-- ====================================================================
-- ESCALA SWIPE - DONO PODE VER A ÁREA DE MEMBROS SEM O CÓDIGO
-- Rode no SQL Editor do Supabase (pode rodar mais de uma vez).
--
-- Só LEITURA das ofertas. Criar, editar e apagar continua exigindo o
-- código do app autenticador (verificação em 2 etapas).
-- ====================================================================

-- Conta marcada como admin (sem exigir o código)
CREATE OR REPLACE FUNCTION public.es_has_admin_role(user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM public.es_profiles WHERE id = user_uuid AND role = 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.es_has_admin_role(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.es_has_admin_role(UUID) TO authenticated;

-- Ver ofertas: assinante ativo ou conta admin
DROP POLICY IF EXISTS "es_offers_select" ON public.es_offers;
CREATE POLICY "es_offers_select" ON public.es_offers
    FOR SELECT USING (public.es_is_active_member(auth.uid()) OR public.es_has_admin_role(auth.uid()));
