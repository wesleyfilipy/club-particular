-- ====================================================================
-- CLUB PARTICULAR - SUPABASE STORAGE BUCKETS & POLICIES
-- Buckets: offers-images, offers-logos, vsl-videos, facebook-videos, creatives, ebooks, pdfs, zip-files
-- ====================================================================

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('offers-images', 'offers-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('offers-logos', 'offers-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']),
    ('vsl-videos', 'vsl-videos', false, 10737418240, ARRAY['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm']), -- Up to 10GB
    ('facebook-videos', 'facebook-videos', false, 2147483648, ARRAY['video/mp4', 'video/quicktime', 'video/webm']),
    ('creatives', 'creatives', false, 2147483648, ARRAY['image/jpeg', 'image/png', 'video/mp4', 'application/pdf', 'application/zip']),
    ('ebooks', 'ebooks', false, 524288000, ARRAY['application/pdf', 'application/epub+zip']),
    ('pdfs', 'pdfs', false, 524288000, ARRAY['application/pdf']),
    ('zip-files', 'zip-files', false, 5368709120, ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream'])
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Security Policies

-- Public Read Access for Logos and Images
CREATE POLICY "Public read access for offer images"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('offers-images', 'offers-logos'));

-- Signed URL / Restricted Read Access for VSL Videos & Downloads (Only Active Subscription)
CREATE POLICY "Active paid members can download VSL and media files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id IN ('vsl-videos', 'facebook-videos', 'creatives', 'ebooks', 'pdfs', 'zip-files')
        AND (
            EXISTS (
                SELECT 1 FROM public.subscriptions
                WHERE user_id = auth.uid() AND status = 'active'
            )
            OR EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid() AND role IN ('admin', 'moderator')
            )
        )
    );

-- Admin Upload & Management Access
CREATE POLICY "Admins can upload files to all buckets"
    ON storage.objects FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins can update and delete files"
    ON storage.objects FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );
