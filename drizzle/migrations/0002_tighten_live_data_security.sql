DROP POLICY "Public reads provider media" ON storage.objects;
CREATE POLICY "Authenticated reads provider media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'provider-media');

DROP POLICY "Public reads availability" ON public.provider_availability;
CREATE POLICY "Public reads verified provider availability" ON public.provider_availability FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.active AND p.verified));

DROP POLICY "Public reads reviews" ON public.reviews;
CREATE POLICY "Public reads verified provider reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.active AND p.verified));

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;