ALTER TABLE public.cab_trip_requests
 ADD COLUMN IF NOT EXISTS ride_status text NOT NULL DEFAULT 'pending',
 ADD COLUMN IF NOT EXISTS ride_otp text,
 ADD COLUMN IF NOT EXISTS driver_lat double precision,
 ADD COLUMN IF NOT EXISTS driver_lng double precision,
 ADD COLUMN IF NOT EXISTS driver_updated_at timestamptz,
 ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
 ADD COLUMN IF NOT EXISTS arrived_at timestamptz,
 ADD COLUMN IF NOT EXISTS ride_started_at timestamptz,
 ADD COLUMN IF NOT EXISTS ride_completed_at timestamptz;

CREATE OR REPLACE FUNCTION public.advance_cab_trip_request(_request_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.cab_trip_requests; o public.cab_trip_offers; candidate record; radius double precision; elapsed double precision; driver jsonb; booking jsonb; owner uuid; dlat double precision; dlng double precision; dkm double precision;
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
   INSERT INTO public.notifications(user_id,title,message) VALUES(r.customer_id,'No driver available','Abhi aapke paas koi driver available nahi hai. Thodi der baad dobara try kariye.');
  ELSIF o.id IS NULL THEN
   FOR candidate IN SELECT d.provider_id,d.vehicle_id,v.base_fare,v.per_km_rate,public.cab_distance_km(r.pickup_lat,r.pickup_lng,d.latitude,d.longitude) AS distance FROM public.cab_driver_presence d JOIN public.providers p ON p.id=d.provider_id JOIN public.vehicles v ON v.id=d.vehicle_id WHERE d.online AND d.updated_at>now()-interval '90 seconds' AND p.active AND p.verified AND v.active AND lower(v.vehicle_type)=lower(r.vehicle_type) AND public.cab_distance_km(r.pickup_lat,r.pickup_lng,d.latitude,d.longitude)<=radius AND NOT EXISTS(SELECT 1 FROM public.cab_trip_offers tried WHERE tried.request_id=r.id AND tried.provider_id=d.provider_id) ORDER BY distance LOOP
    PERFORM pg_advisory_xact_lock(hashtext(candidate.provider_id::text));
    IF NOT EXISTS(SELECT 1 FROM public.cab_trip_offers busy WHERE busy.provider_id=candidate.provider_id AND busy.state='offered' AND busy.expires_at>now()) AND NOT EXISTS(SELECT 1 FROM public.bookings b WHERE b.provider_id=candidate.provider_id AND b.booking_type='Cab' AND b.status IN ('confirmed','team_assigned','setup_started') AND b.details->>'cab_mode'='live_dispatch') THEN
     INSERT INTO public.cab_trip_offers(request_id,provider_id,vehicle_id,distance_km,fare) VALUES(r.id,candidate.provider_id,candidate.vehicle_id,candidate.distance,round(candidate.base_fare+candidate.per_km_rate*r.road_km)) RETURNING * INTO o;
     SELECT owner_id INTO owner FROM public.providers WHERE id=candidate.provider_id;
     IF owner IS NOT NULL THEN INSERT INTO public.notifications(user_id,title,message) VALUES(owner,'New ride request','Pickup: '||r.pickup_label||' → '||r.drop_label||' · ₹'||o.fare||'. 20 second me accept kariye.'); END IF;
     EXIT;
    END IF;
   END LOOP;
  END IF;
 END IF;
 IF o.id IS NULL THEN SELECT * INTO o FROM public.cab_trip_offers WHERE request_id=r.id AND state='accepted' LIMIT 1; END IF;
 IF o.id IS NOT NULL THEN
  SELECT coalesce(r.driver_lat,d.latitude),coalesce(r.driver_lng,d.longitude) INTO dlat,dlng FROM public.cab_driver_presence d WHERE d.provider_id=o.provider_id;
  dkm:=CASE WHEN dlat IS NULL THEN o.distance_km ELSE public.cab_distance_km(r.pickup_lat,r.pickup_lng,dlat,dlng) END;
  SELECT jsonb_build_object('name',coalesce(d.driver_name,p.business_name),'vehicle_type',v.vehicle_type,'vehicle_number',v.vehicle_number,'phone',CASE WHEN r.state='accepted' THEN p.phone END,'rating',p.rating,'business_name',p.business_name,'distance_km',dkm,'fare',o.fare,'latitude',dlat,'longitude',dlng) INTO driver FROM public.vehicles v JOIN public.providers p ON p.id=o.provider_id LEFT JOIN public.cab_driver_presence d ON d.provider_id=o.provider_id WHERE v.id=o.vehicle_id;
 END IF;
 IF r.booking_id IS NOT NULL THEN SELECT jsonb_build_object('id',b.id,'code',b.booking_code,'status',b.status,'total',b.total_amount) INTO booking FROM public.bookings b WHERE b.id=r.booking_id; END IF;
 RETURN jsonb_build_object('id',r.id,'state',r.state,'radius',radius,'driver',driver,'booking',booking,'pickup',r.pickup_label,'drop',r.drop_label,'ride_status',r.ride_status,'otp',CASE WHEN r.ride_status IN ('accepted','arrived') THEN r.ride_otp END,'pickup_coords',jsonb_build_object('lat',r.pickup_lat,'lng',r.pickup_lng),'drop_coords',jsonb_build_object('lat',r.drop_lat,'lng',r.drop_lng),'road_km',r.road_km,'trip_minutes',r.trip_minutes);
END; $$;

CREATE OR REPLACE FUNCTION public.respond_cab_trip_offer(_offer_id uuid,_accept boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.cab_trip_offers; r public.cab_trip_requests; d public.cab_driver_presence; p public.providers; v public.vehicles; bid uuid; otp text;
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
 INSERT INTO public.bookings(customer_id,provider_id,booking_type,event_date,event_time,pickup_location,drop_location,city,guests,subtotal,total_amount,status,details) VALUES(r.customer_id,p.id,'Cab',current_date,to_char(now(),'HH24:MI'),r.pickup_label,r.drop_label,p.city,v.seats,o.fare,o.fare,'confirmed',jsonb_build_object('source','customer_app','cab_mode','live_dispatch','request_id',r.id,'vehicle_id',v.id,'vehicle_type',v.vehicle_type,'vehicle_number',v.vehicle_number,'driver_name',d.driver_name,'driver_phone',p.phone,'driver_rating',p.rating,'pickup_coords',jsonb_build_object('lat',r.pickup_lat,'lng',r.pickup_lng),'drop_coords',jsonb_build_object('lat',r.drop_lat,'lng',r.drop_lng),'distance_km',r.road_km,'trip_minutes',r.trip_minutes)) RETURNING id INTO bid;
 INSERT INTO public.payments(booking_id,customer_id,method,amount,status) VALUES(bid,r.customer_id,'cash',o.fare,'pending');
 otp:=lpad(floor(random()*10000)::int::text,4,'0');
 UPDATE public.cab_trip_requests SET state='accepted',booking_id=bid,ride_status='accepted',ride_otp=otp,accepted_at=now(),driver_lat=d.latitude,driver_lng=d.longitude,driver_updated_at=now() WHERE id=r.id;
 UPDATE public.cab_trip_offers SET state='accepted' WHERE id=o.id;
 UPDATE public.cab_driver_presence SET online=false WHERE provider_id=p.id;
 INSERT INTO public.notifications(user_id,title,message) VALUES(r.customer_id,'Driver accepted your ride',d.driver_name||' ('||v.vehicle_type||' · '||v.vehicle_number||') aa rahe hain. Ride OTP: '||otp);
 RETURN jsonb_build_object('state','accepted','booking_id',bid);
END; $$;

CREATE OR REPLACE FUNCTION public.get_cab_driver_active_ride() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE res jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 SELECT jsonb_build_object('request_id',r.id,'booking_code',b.booking_code,'ride_status',r.ride_status,'pickup_label',r.pickup_label,'drop_label',r.drop_label,'pickup_lat',r.pickup_lat,'pickup_lng',r.pickup_lng,'drop_lat',r.drop_lat,'drop_lng',r.drop_lng,'road_km',r.road_km,'trip_minutes',r.trip_minutes,'fare',b.total_amount,'customer_name',coalesce(nullif(pr.full_name,''),'Customer'),'customer_phone',CASE WHEN r.ride_status IN ('accepted','arrived','started') THEN nullif(pr.phone,'') END) INTO res
 FROM public.cab_trip_requests r JOIN public.bookings b ON b.id=r.booking_id JOIN public.providers p ON p.id=b.provider_id LEFT JOIN public.profiles pr ON pr.id=r.customer_id
 WHERE p.owner_id=auth.uid() AND r.ride_status IN ('accepted','arrived','started') ORDER BY r.accepted_at DESC LIMIT 1;
 RETURN res;
END; $$;

CREATE OR REPLACE FUNCTION public.update_cab_ride_location(_request_id uuid,_lat double precision,_lng double precision) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 UPDATE public.cab_trip_requests r SET driver_lat=_lat,driver_lng=_lng,driver_updated_at=now()
 FROM public.bookings b JOIN public.providers p ON p.id=b.provider_id
 WHERE r.id=_request_id AND b.id=r.booking_id AND p.owner_id=auth.uid() AND r.ride_status IN ('accepted','arrived','started');
END; $$;

CREATE OR REPLACE FUNCTION public.cab_ride_action(_request_id uuid,_action text,_otp text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.cab_trip_requests; b public.bookings; owner uuid; is_driver boolean; dname text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'SIGN_IN_REQUIRED'; END IF;
 SELECT * INTO r FROM public.cab_trip_requests WHERE id=_request_id FOR UPDATE;
 IF r.id IS NULL OR r.booking_id IS NULL THEN RAISE EXCEPTION 'RIDE_NOT_FOUND'; END IF;
 SELECT * INTO b FROM public.bookings WHERE id=r.booking_id;
 SELECT owner_id INTO owner FROM public.providers WHERE id=b.provider_id;
 is_driver:=owner=auth.uid();
 IF NOT is_driver AND r.customer_id<>auth.uid() THEN RAISE EXCEPTION 'NOT_ALLOWED'; END IF;
 dname:=coalesce(b.details->>'driver_name','Driver');
 IF _action='arrived' AND is_driver AND r.ride_status='accepted' THEN
  UPDATE public.cab_trip_requests SET ride_status='arrived',arrived_at=now() WHERE id=r.id;
  UPDATE public.bookings SET status='team_assigned',updated_at=now() WHERE id=b.id;
  INSERT INTO public.notifications(user_id,title,message) VALUES(r.customer_id,'Driver pickup par pahunch gaya',dname||' aapka intezaar kar rahe hain. Ride start karne ke liye OTP '||r.ride_otp||' batayein.');
 ELSIF _action='start' AND is_driver AND r.ride_status IN ('accepted','arrived') THEN
  IF coalesce(_otp,'')<>r.ride_otp THEN RAISE EXCEPTION 'WRONG_OTP'; END IF;
  UPDATE public.cab_trip_requests SET ride_status='started',ride_started_at=now(),arrived_at=coalesce(arrived_at,now()) WHERE id=r.id;
  UPDATE public.bookings SET status='setup_started',updated_at=now() WHERE id=b.id;
  INSERT INTO public.notifications(user_id,title,message) VALUES(r.customer_id,'Ride started','Aapki ride shuru ho gayi hai · Drop: '||r.drop_label);
 ELSIF _action='complete' AND is_driver AND r.ride_status='started' THEN
  UPDATE public.cab_trip_requests SET ride_status='completed',ride_completed_at=now() WHERE id=r.id;
  UPDATE public.bookings SET status='completed',payment_status='paid',updated_at=now() WHERE id=b.id;
  UPDATE public.payments SET status='paid',updated_at=now() WHERE booking_id=b.id;
  INSERT INTO public.notifications(user_id,title,message) VALUES(r.customer_id,'Ride completed','Aap '||r.drop_label||' pahunch gaye. Cash ₹'||b.total_amount||' driver ko dijiye. Dhanyavaad!');
  IF owner IS NOT NULL THEN INSERT INTO public.notifications(user_id,title,message) VALUES(owner,'Ride completed','Booking '||b.booking_code||' · ₹'||b.total_amount||' cash collect kariye.'); END IF;
 ELSIF _action='cancel' AND r.ride_status IN ('accepted','arrived') THEN
  UPDATE public.cab_trip_requests SET ride_status='cancelled' WHERE id=r.id;
  UPDATE public.bookings SET status='cancelled',updated_at=now() WHERE id=b.id;
  UPDATE public.payments SET status='failed',updated_at=now() WHERE booking_id=b.id AND status='pending';
  IF is_driver THEN INSERT INTO public.notifications(user_id,title,message) VALUES(r.customer_id,'Driver ne ride cancel ki','Maaf kijiye, '||dname||' ne ride cancel kar di. Kripya nayi ride book kariye.');
  ELSIF owner IS NOT NULL THEN INSERT INTO public.notifications(user_id,title,message) VALUES(owner,'Customer ne ride cancel ki','Booking '||b.booking_code||' cancel ho gayi.'); END IF;
 ELSE RAISE EXCEPTION 'ACTION_NOT_ALLOWED'; END IF;
 RETURN jsonb_build_object('ok',true);
END; $$;

REVOKE ALL ON FUNCTION public.get_cab_driver_active_ride(), public.update_cab_ride_location(uuid,double precision,double precision), public.cab_ride_action(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cab_driver_active_ride(), public.update_cab_ride_location(uuid,double precision,double precision), public.cab_ride_action(uuid,text,text) TO authenticated;