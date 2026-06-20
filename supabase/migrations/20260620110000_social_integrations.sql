-- Social integrations: admin-managed connections and public cached posts.

CREATE TABLE public.social_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('instagram', 'facebook', 'tiktok')),
    account_name TEXT NOT NULL,
    account_id TEXT,
    access_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_sync BOOLEAN NOT NULL DEFAULT false,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (provider, account_id)
);

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID REFERENCES public.social_connections(id) ON DELETE SET NULL,
    provider TEXT NOT NULL CHECK (provider IN ('instagram', 'facebook', 'tiktok')),
    provider_post_id TEXT NOT NULL,
    media_type TEXT,
    media_url TEXT,
    thumbnail_url TEXT,
    permalink TEXT NOT NULL,
    caption TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    sort_index INTEGER NOT NULL DEFAULT 0,
    raw JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (provider, provider_post_id)
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE INDEX social_posts_public_feed_idx
ON public.social_posts (provider, is_visible, published_at DESC);

CREATE POLICY "Admins can view social connections"
ON public.social_connections FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can insert social connections"
ON public.social_connections FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update social connections"
ON public.social_connections FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete social connections"
ON public.social_connections FOR DELETE
USING (public.is_admin());

CREATE POLICY "Anyone can view visible social posts"
ON public.social_posts FOR SELECT
USING (is_visible = true);

CREATE POLICY "Admins can insert social posts"
ON public.social_posts FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update social posts"
ON public.social_posts FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete social posts"
ON public.social_posts FOR DELETE
USING (public.is_admin());

CREATE TRIGGER update_social_connections_updated_at
BEFORE UPDATE ON public.social_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at
BEFORE UPDATE ON public.social_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.social_posts;
