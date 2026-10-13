CREATE TABLE public.provider_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.provider_images TO anon;
GRANT SELECT, INSERT, DELETE ON public.provider_images TO authenticated;
GRANT ALL ON public.provider_images TO service_role;

ALTER TABLE public.provider_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view provider gallery photos"
ON public.provider_images FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Provider owners can add gallery photos"
ON public.provider_images FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.providers p
  WHERE p.id = provider_id AND p.owner_id = auth.uid()
));

CREATE POLICY "Provider owners can delete their gallery photos"
ON public.provider_images FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.providers p
  WHERE p.id = provider_id AND p.owner_id = auth.uid()
));

CREATE POLICY "Admins can manage all gallery photos"
ON public.provider_images FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));