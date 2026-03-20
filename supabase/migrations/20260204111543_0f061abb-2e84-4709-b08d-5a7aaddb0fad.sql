-- Create app_role enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Create gallery_images table for venue photos
CREATE TABLE public.gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    caption TEXT,
    section TEXT NOT NULL DEFAULT 'general',
    order_index INTEGER NOT NULL DEFAULT 0,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on gallery_images
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Create smtp_config table (only one row expected)
CREATE TABLE public.smtp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host TEXT NOT NULL,
    port INTEGER NOT NULL DEFAULT 587,
    username TEXT,
    password TEXT,
    use_tls BOOLEAN DEFAULT true,
    sender_email TEXT NOT NULL,
    sender_name TEXT DEFAULT 'Villa Paris',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on smtp_config
ALTER TABLE public.smtp_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.is_admin());

-- RLS Policies for gallery_images
-- Public can view images (for the website)
CREATE POLICY "Anyone can view gallery images"
ON public.gallery_images FOR SELECT
USING (true);

-- Only admins can manage images
CREATE POLICY "Admins can insert gallery images"
ON public.gallery_images FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update gallery images"
ON public.gallery_images FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete gallery images"
ON public.gallery_images FOR DELETE
USING (public.is_admin());

-- RLS Policies for smtp_config (admin only)
CREATE POLICY "Admins can view smtp config"
ON public.smtp_config FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can insert smtp config"
ON public.smtp_config FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update smtp config"
ON public.smtp_config FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete smtp config"
ON public.smtp_config FOR DELETE
USING (public.is_admin());

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_gallery_images_updated_at
BEFORE UPDATE ON public.gallery_images
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_smtp_config_updated_at
BEFORE UPDATE ON public.smtp_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for venue photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-photos', 'venue-photos', true);

-- Storage policies for venue-photos bucket
CREATE POLICY "Anyone can view venue photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'venue-photos');

CREATE POLICY "Admins can upload venue photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'venue-photos' AND public.is_admin());

CREATE POLICY "Admins can update venue photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'venue-photos' AND public.is_admin());

CREATE POLICY "Admins can delete venue photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'venue-photos' AND public.is_admin());