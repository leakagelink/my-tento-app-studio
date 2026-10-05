CREATE OR REPLACE FUNCTION public.register_provider(_business_name text, _phone text, _city text, _area text, _description text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); _pid uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF length(trim(coalesce(_business_name,''))) < 2 OR length(trim(coalesce(_phone,''))) < 6 OR length(trim(coalesce(_city,''))) < 2 THEN
    RAISE EXCEPTION 'Business name, phone and city are required';
  END IF;
  SELECT id INTO _pid FROM public.providers WHERE owner_id = _uid LIMIT 1;
  IF _pid IS NULL THEN
    INSERT INTO public.providers (owner_id, business_name, description, phone, city, area, verified, active)
    VALUES (_uid, left(trim(_business_name),120), left(coalesce(_description,''),1000), left(trim(_phone),20), left(trim(_city),80), left(coalesce(trim(_area),''),120), false, true)
    RETURNING id INTO _pid;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'provider') ON CONFLICT (user_id, role) DO NOTHING;
  RETURN _pid;
END;
$$;
REVOKE ALL ON FUNCTION public.register_provider(text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_provider(text,text,text,text,text) TO authenticated;