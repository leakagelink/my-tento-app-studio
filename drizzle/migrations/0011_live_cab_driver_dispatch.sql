CREATE TABLE public.cab_driver_presence (
 provider_id uuid PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
 vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
 driver_name text NOT NULL DEFAULT '',
 latitude double precision NOT NULL,
 longitude double precision NOT NULL,
 online boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
);
GRANT SELECT ON public.cab_driver_presence TO authenticated;
GRANT ALL ON public.cab_driver_presence TO service_role;
ALTER TABLE public.cab_driver_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Driver reads own presence" ON public.cab_driver_presence FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id=provider_id AND p.owner_id=auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.cab_trip_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 customer_id uuid NOT NULL,
 vehicle_type text NOT NULL DEFAULT 'Cab',
 pickup_label text NOT NULL DEFAULT '',
 drop_label text NOT NULL DEFAULT '',
 pickup_lat double precision NOT NULL,
 pickup_lng double precision NOT NULL,
 drop_lat double precision NOT NULL,
 drop_lng double precision NOT NULL,
 road_km numeric NOT NULL,
 trip_minutes numeric NOT NULL,
 state text NOT NULL DEFAULT 'searching' CHECK (state IN ('searching','accepted','cancelled','no_driver')),
 started_at timestamptz NOT NULL DEFAULT now(),
 booking_id uuid REFERENCES public.bookings(id),
 CHECK (pickup_lat BETWEEN -90 AND 90 AND drop_lat BETWEEN -90 AND 90 AND pickup_lng BETWEEN -180 AND 180 AND drop_lng BETWEEN -180 AND 180),
 CHECK (road_km>0 AND road_km<=2000 AND trip_minutes>0 AND trip_minutes<=3000)
);
GRANT SELECT ON public.cab_trip_requests TO authenticated;
GRANT ALL ON public.cab_trip_requests TO service_role;
ALTER TABLE public.cab_trip_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer reads own cab request" ON public.cab_trip_requests FOR SELECT TO authenticated USING (customer_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.cab_trip_offers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id uuid NOT NULL REFERENCES public.cab_trip_requests(id) ON DELETE CASCADE,
 provider_id uuid NOT NULL REFERENCES public.providers(id),
 vehicle_id uuid NOT NULL REFERENCES public.vehicles(id),
 state text NOT NULL DEFAULT 'offered' CHECK (state IN ('offered','accepted','declined','expired')),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '20 seconds',
 distance_km numeric NOT NULL,
 fare numeric NOT NULL,
 UNIQUE(request_id,provider_id)
);
GRANT SELECT ON public.cab_trip_offers TO authenticated;
GRANT ALL ON public.cab_trip_offers TO service_role;
ALTER TABLE public.cab_trip_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cab parties read offers" ON public.cab_trip_offers FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.providers p WHERE p.id=provider_id AND p.owner_id=auth.uid()) OR EXISTS(SELECT 1 FROM public.cab_trip_requests r WHERE r.id=request_id AND r.customer_id=auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE INDEX cab_offers_provider_state ON public.cab_trip_offers(provider_id,state,expires_at);
CREATE INDEX cab_requests_customer_state ON public.cab_trip_requests(customer_id,state);
CREATE OR REPLACE FUNCTION public.cab_distance_km(a_lat double precision,a_lng double precision,b_lat double precision,b_lng double precision) RETURNS double precision LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT 6371*2*asin(sqrt(least(1.0,power(sin(radians(b_lat-a_lat)/2),2)+cos(radians(a_lat))*cos(radians(b_lat))*power(sin(radians(b_lng-a_lng)/2),2)))); $$;
CREATE OR REPLACE FUNCTION public.set_cab_driver_presence(_vehicle_id uuid,_name text,_lat double precision,_lng double precision,_online boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.providers; result public.cab_driver_presence;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 SELECT pr.* INTO p FROM public.providers pr JOIN public.vehicles v ON v.provider_id=pr.id WHERE v.id=_vehicle_id AND pr.owner_id=auth.uid() AND public.has_role(auth.uid(),'provider') AND v.active;
 IF p.id IS NULL THEN RAISE EXCEPTION 'VEHICLE_NOT_OWNED'; END IF;
 IF _online AND (NOT p.active OR NOT p.verified OR length(trim(_name))<2) THEN RAISE EXCEPTION 'VERIFIED_DRIVER_REQUIRED'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(p.id::text));
 IF _online AND EXISTS(SELECT 1 FROM public.bookings b WHERE b.provider_id=p.id AND b.booking_type='Cab' AND b.status IN ('confirmed','team_assigned','setup_started') AND b.details->>'cab_mode'='live_dispatch') THEN RAISE EXCEPTION 'FINISH_CURRENT_RIDE_FIRST'; END IF;
 INSERT INTO public.cab_driver_presence(provider_id,vehicle_id,driver_name,latitude,longitude,online,updated_at) VALUES(p.id,_vehicle_id,left(trim(_name),80),_lat,_lng,_online,now()) ON CONFLICT(provider_id) DO UPDATE SET vehicle_id=excluded.vehicle_id,driver_name=excluded.driver_name,latitude=excluded.latitude,longitude=excluded.longitude,online=excluded.online,updated_at=now() RETURNING * INTO result;
 RETURN to_jsonb(result);
END; $$;
CREATE OR REPLACE FUNCTION public.find_nearby_cab_drivers(_lat double precision,_lng double precision,_radius double precision) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 IF _lat NOT BETWEEN -90 AND 90 OR _lng NOT BETWEEN -180 AND 180 OR _radius NOT BETWEEN 0 AND 15 THEN RAISE EXCEPTION 'INVALID_LOCATION'; END IF;
 RETURN coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.distance_km) FROM (SELECT v.id,v.vehicle_type,v.vehicle_number,v.seats,v.base_fare,v.per_km_rate,d.driver_name,d.latitude,d.longitude,public.cab_distance_km(_lat,_lng,d.latitude,d.longitude) AS distance_km,p.id AS provider_id,p.business_name,p.city FROM public.cab_driver_presence d JOIN public.providers p ON p.id=d.provider_id JOIN public.vehicles v ON v.id=d.vehicle_id WHERE d.online AND d.updated_at>now()-interval '90 seconds' AND p.active AND p.verified AND v.active AND public.cab_distance_km(_lat,_lng,d.latitude,d.longitude)<=_radius AND NOT EXISTS(SELECT 1 FROM public.bookings b WHERE b.provider_id=p.id AND b.booking_type='Cab' AND b.status IN ('confirmed','team_assigned','setup_started') AND b.details->>'cab_mode'='live_dispatch') ORDER BY distance_km LIMIT 40) x),'[]'::jsonb);
END; $$;
CREATE OR REPLACE FUNCTION public.create_cab_trip_request(_type text,_pickup text,_drop text,_plat double precision,_plng double precision,_dlat double precision,_dlng double precision,_km numeric,_minutes numeric) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE rid uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(auth.uid()::text));
 IF EXISTS(SELECT 1 FROM public.cab_trip_requests WHERE customer_id=auth.uid() AND state='searching' AND started_at>now()-interval '2 minutes') THEN RAISE EXCEPTION 'REQUEST_ALREADY_ACTIVE'; END IF;
 IF length(trim(_pickup))=0 OR length(trim(_drop))=0 OR _km<public.cab_distance_km(_plat,_plng,_dlat,_dlng)*0.8 THEN RAISE EXCEPTION 'INVALID_TRIP'; END IF;
 INSERT INTO public.cab_trip_requests(customer_id,vehicle_type,pickup_label,drop_label,pickup_lat,pickup_lng,drop_lat,drop_lng,road_km,trip_minutes) VALUES(auth.uid(),left(_type,80),left(_pickup,500),left(_drop,500),_plat,_plng,_dlat,_dlng,_km,_minutes) RETURNING id INTO rid;
 RETURN rid;
END; $$;
CREATE OR REPLACE FUNCTION public.advance_cab_trip_request(_request_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.cab_trip_requests; o public.cab_trip_offers; candidate record; radius double precision; elapsed double precision; driver jsonb; booking jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 SELECT * INTO r FROM public.cab_trip_requests WHERE id=_request_id AND customer_id=auth.uid() FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'REQUEST_NOT_FOUND'; END IF;
 elapsed:=extract(epoch FROM now()-r.started_at);
 radius:=CASE WHEN elapsed<10 THEN 2 WHEN elapsed<20 THEN 5 WHEN elapsed<30 THEN 10 ELSE 15 END;
 IF r.state='searching' THEN
  UPDATE public.cab_trip_offers SET state='expired' WHERE request_id=r.id AND state='offered' AND expires_at<=now();
  SELECT * INTO o FROM public.cab_trip_offers WHERE request_id=r.id AND state='offered' AND expires_at>now();
  IF o.id IS NULL AND elapsed>=120 THEN
   UPDATE public.cab_trip_requests SET state='no_driver' WHERE id=r.id; r.state:='no_driver';
  ELSIF o.id IS NULL THEN
   FOR candidate IN SELECT d.provider_id,d.vehicle_id,v.base_fare,v.per_km_rate,public.cab_distance_km(r.pickup_lat,r.pickup_lng,d.latitude,d.longitude) AS distance FROM public.cab_driver_presence d JOIN public.providers p ON p.id=d.provider_id JOIN public.vehicles v ON v.id=d.vehicle_id WHERE d.online AND d.updated_at>now()-interval '90 seconds' AND p.active AND p.verified AND v.active AND lower(v.vehicle_type)=lower(r.vehicle_type) AND public.cab_distance_km(r.pickup_lat,r.pickup_lng,d.latitude,d.longitude)<=radius AND NOT EXISTS(SELECT 1 FROM public.cab_trip_offers tried WHERE tried.request_id=r.id AND tried.provider_id=d.provider_id) ORDER BY distance LOOP
    PERFORM pg_advisory_xact_lock(hashtext(candidate.provider_id::text));
    IF NOT EXISTS(SELECT 1 FROM public.cab_trip_offers busy WHERE busy.provider_id=candidate.provider_id AND busy.state='offered' AND busy.expires_at>now()) AND NOT EXISTS(SELECT 1 FROM public.bookings b WHERE b.provider_id=candidate.provider_id AND b.booking_type='Cab' AND b.status IN ('confirmed','team_assigned','setup_started') AND b.details->>'cab_mode'='live_dispatch') THEN
     INSERT INTO public.cab_trip_offers(request_id,provider_id,vehicle_id,distance_km,fare) VALUES(r.id,candidate.provider_id,candidate.vehicle_id,candidate.distance,round(candidate.base_fare+candidate.per_km_rate*r.road_km)) RETURNING * INTO o;
     EXIT;
    END IF;
   END LOOP;
  END IF;
 END IF;
 IF o.id IS NULL THEN SELECT * INTO o FROM public.cab_trip_offers WHERE request_id=r.id AND state='accepted' LIMIT 1; END IF;
 IF o.id IS NOT NULL THEN SELECT jsonb_build_object('name',d.driver_name,'vehicle_type',v.vehicle_type,'vehicle_number',v.vehicle_number,'distance_km',o.distance_km,'fare',o.fare,'latitude',d.latitude,'longitude',d.longitude) INTO driver FROM public.cab_driver_presence d JOIN public.vehicles v ON v.id=o.vehicle_id WHERE d.provider_id=o.provider_id; END IF;
 IF r.booking_id IS NOT NULL THEN SELECT jsonb_build_object('id',b.id,'code',b.booking_code,'status',b.status,'total',b.total_amount) INTO booking FROM public.bookings b WHERE b.id=r.booking_id; END IF;
 RETURN jsonb_build_object('id',r.id,'state',r.state,'radius',radius,'driver',driver,'booking',booking,'pickup',r.pickup_label,'drop',r.drop_label);
END; $$;
CREATE OR REPLACE FUNCTION public.get_cab_driver_inbox() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'provider') THEN RAISE EXCEPTION 'PROVIDER_REQUIRED'; END IF;
 RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT o.id,o.fare,o.expires_at,o.distance_km,r.pickup_label,r.drop_label,r.road_km,r.trip_minutes,v.vehicle_type FROM public.cab_trip_offers o JOIN public.providers p ON p.id=o.provider_id JOIN public.cab_trip_requests r ON r.id=o.request_id JOIN public.vehicles v ON v.id=o.vehicle_id WHERE p.owner_id=auth.uid() AND o.state='offered' AND o.expires_at>now() AND r.state='searching' ORDER BY o.expires_at LIMIT 10) x),'[]'::jsonb);
END; $$;
CREATE OR REPLACE FUNCTION public.respond_cab_trip_offer(_offer_id uuid,_accept boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.cab_trip_offers; r public.cab_trip_requests; d public.cab_driver_presence; p public.providers; v public.vehicles; bid uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'provider') THEN RAISE EXCEPTION 'PROVIDER_REQUIRED'; END IF;
 SELECT ofr.* INTO o FROM public.cab_trip_offers ofr JOIN public.providers pr ON pr.id=ofr.provider_id WHERE ofr.id=_offer_id AND pr.owner_id=auth.uid();
 IF o.id IS NULL THEN RAISE EXCEPTION 'OFFER_NOT_FOUND'; END IF;
 SELECT * INTO r FROM public.cab_trip_requests WHERE id=o.request_id FOR UPDATE;
 PERFORM pg_advisory_xact_lock(hashtext(o.provider_id::text));
 SELECT * INTO o FROM public.cab_trip_offers WHERE id=_offer_id FOR UPDATE;
 IF o.state<>'offered' OR o.expires_at<=now() OR r.state<>'searching' THEN RAISE EXCEPTION 'OFFER_EXPIRED'; END IF;
 IF NOT _accept THEN UPDATE public.cab_trip_offers SET state='declined' WHERE id=o.id; RETURN jsonb_build_object('state','declined'); END IF;
 SELECT * INTO d FROM public.cab_driver_presence WHERE provider_id=o.provider_id AND vehicle_id=o.vehicle_id AND online AND updated_at>now()-interval '90 seconds';
 SELECT * INTO p FROM public.providers WHERE id=o.provider_id AND active AND verified;
 SELECT * INTO v FROM public.vehicles WHERE id=o.vehicle_id AND active;
 IF d.provider_id IS NULL OR p.id IS NULL OR v.id IS NULL OR EXISTS(SELECT 1 FROM public.bookings b WHERE b.provider_id=p.id AND b.booking_type='Cab' AND b.status IN ('confirmed','team_assigned','setup_started') AND b.details->>'cab_mode'='live_dispatch') THEN RAISE EXCEPTION 'DRIVER_UNAVAILABLE'; END IF;
 INSERT INTO public.bookings(customer_id,provider_id,booking_type,event_date,event_time,pickup_location,drop_location,city,guests,subtotal,total_amount,status,details) VALUES(r.customer_id,p.id,'Cab',current_date,to_char(now(),'HH24:MI'),r.pickup_label,r.drop_label,p.city,v.seats,o.fare,o.fare,'confirmed',jsonb_build_object('source','customer_app','cab_mode','live_dispatch','request_id',r.id,'vehicle_id',v.id,'vehicle_type',v.vehicle_type,'driver_name',d.driver_name,'pickup_coords',jsonb_build_object('lat',r.pickup_lat,'lng',r.pickup_lng),'drop_coords',jsonb_build_object('lat',r.drop_lat,'lng',r.drop_lng),'distance_km',r.road_km,'trip_minutes',r.trip_minutes)) RETURNING id INTO bid;
 INSERT INTO public.payments(booking_id,customer_id,method,amount,status) VALUES(bid,r.customer_id,'cash',o.fare,'pending');
 UPDATE public.cab_trip_requests SET state='accepted',booking_id=bid WHERE id=r.id;
 UPDATE public.cab_trip_offers SET state='accepted' WHERE id=o.id;
 UPDATE public.cab_driver_presence SET online=false WHERE provider_id=p.id;
 RETURN jsonb_build_object('state','accepted','booking_id',bid);
END; $$;
CREATE OR REPLACE FUNCTION public.cancel_cab_trip_request(_request_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 PERFORM 1 FROM public.cab_trip_requests WHERE id=_request_id AND customer_id=auth.uid() AND state='searching' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'REQUEST_NOT_CANCELLABLE'; END IF;
 UPDATE public.cab_trip_requests SET state='cancelled' WHERE id=_request_id;
 UPDATE public.cab_trip_offers SET state='expired' WHERE request_id=_request_id AND state='offered';
END; $$;
REVOKE ALL ON FUNCTION public.set_cab_driver_presence(uuid,text,double precision,double precision,boolean), public.find_nearby_cab_drivers(double precision,double precision,double precision),public.create_cab_trip_request(text,text,text,double precision,double precision,double precision,double precision,numeric,numeric),public.advance_cab_trip_request(uuid),public.get_cab_driver_inbox(),public.respond_cab_trip_offer(uuid,boolean),public.cancel_cab_trip_request(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_cab_driver_presence(uuid,text,double precision,double precision,boolean), public.find_nearby_cab_drivers(double precision,double precision,double precision),public.create_cab_trip_request(text,text,text,double precision,double precision,double precision,double precision,numeric,numeric),public.advance_cab_trip_request(uuid),public.get_cab_driver_inbox(),public.respond_cab_trip_offer(uuid,boolean),public.cancel_cab_trip_request(uuid) TO authenticated;