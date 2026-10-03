ALTER POLICY "Public reads active verified providers" ON public.providers USING (active AND verified);
ALTER POLICY "Public reads active provider services" ON public.provider_services USING (active);
ALTER POLICY "Public reads active vehicles" ON public.vehicles USING (active);
ALTER POLICY "Public reads active services" ON public.services USING (active);
ALTER POLICY "Public reads active banners" ON public.banners USING (active);
ALTER POLICY "Public reads active offers" ON public.offers USING (active);

CREATE POLICY "Owners read own provider business" ON public.providers FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Admins read all providers" ON public.providers FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));