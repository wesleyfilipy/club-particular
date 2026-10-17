-- ====================================================================
-- ESCALA SWIPE - ARQUIVO DO SITE BAIXADO (ZIP) EM CADA OFERTA
-- Rode no SQL Editor do Supabase (pode rodar mais de uma vez).
-- ====================================================================
ALTER TABLE public.es_offers ADD COLUMN IF NOT EXISTS site_files_key TEXT;
ALTER TABLE public.es_offers ADD COLUMN IF NOT EXISTS site_files_name TEXT;
ALTER TABLE public.es_offers ADD COLUMN IF NOT EXISTS site_files_size TEXT;

-- Avisa a API do Supabase das colunas novas
NOTIFY pgrst, 'reload schema';
