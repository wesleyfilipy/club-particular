-- ====================================================================
-- ESCALA SWIPE - FILTROS DAS OFERTAS + FAVORITOS
-- Rode no SQL Editor do Supabase (pode rodar mais de uma vez).
-- ====================================================================

-- 1. Dados usados nos filtros da área de membros
ALTER TABLE public.es_offers ADD COLUMN IF NOT EXISTS traffic_network TEXT NOT NULL DEFAULT 'Facebook';
ALTER TABLE public.es_offers ADD COLUMN IF NOT EXISTS structure TEXT NOT NULL DEFAULT 'VSL';
ALTER TABLE public.es_offers ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'Infoproduto';
ALTER TABLE public.es_offers ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'Português';
ALTER TABLE public.es_offers ADD COLUMN IF NOT EXISTS started_at DATE; -- desde quando a oferta está rodando
ALTER TABLE public.es_offers ADD COLUMN IF NOT EXISTS ticket_type TEXT;  -- Low Ticket, Mid Ticket, High Ticket
ALTER TABLE public.es_offers ADD COLUMN IF NOT EXISTS transcript TEXT;   -- transcrição da VSL

-- 2. Ofertas favoritas de cada membro
CREATE TABLE IF NOT EXISTS public.es_favorites (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES public.es_offers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, offer_id)
);

ALTER TABLE public.es_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "es_favorites_own" ON public.es_favorites;
CREATE POLICY "es_favorites_own" ON public.es_favorites
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
