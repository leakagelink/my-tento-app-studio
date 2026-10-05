CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage team" ON public.team_members FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = team_members.provider_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = team_members.provider_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

ALTER TABLE public.bookings ADD COLUMN assigned_team_member_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL;

CREATE POLICY "Owners read own reviews" ON public.reviews FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = reviews.provider_id AND p.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.get_booking_customer_contact(_booking_code text)
RETURNS TABLE(full_name text, phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pr.full_name, pr.phone FROM public.bookings b
  JOIN public.providers p ON p.id = b.provider_id
  JOIN public.profiles pr ON pr.id = b.customer_id
  WHERE b.booking_code = _booking_code AND p.owner_id = auth.uid()
    AND b.status NOT IN ('pending','declined','cancelled')
$$;
REVOKE ALL ON FUNCTION public.get_booking_customer_contact(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_booking_customer_contact(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_provider_protected_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') AND auth.uid() IS NOT NULL THEN
    NEW.verified := OLD.verified; NEW.rating := OLD.rating; NEW.review_count := OLD.review_count;
    NEW.owner_id := OLD.owner_id; NEW.distance_km := OLD.distance_km;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER providers_guard_protected BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION public.guard_provider_protected_fields();