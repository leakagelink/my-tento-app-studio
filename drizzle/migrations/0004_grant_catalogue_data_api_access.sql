GRANT SELECT ON public.providers TO anon, authenticated;
GRANT SELECT ON public.provider_services TO anon, authenticated;
GRANT SELECT ON public.vehicles TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT ON public.banners TO anon, authenticated;
GRANT SELECT ON public.offers TO anon, authenticated;

GRANT INSERT, UPDATE ON public.providers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.provider_services TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.offers TO authenticated;

GRANT ALL ON public.providers, public.provider_services, public.vehicles, public.services, public.banners, public.offers TO service_role;