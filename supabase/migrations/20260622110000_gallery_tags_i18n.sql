ALTER TABLE public.gallery_images
ADD COLUMN IF NOT EXISTS caption_en TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS gallery_images_tags_idx
ON public.gallery_images USING gin (tags);
