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
 IF o.id IS NOT NULL THEN SELECT jsonb_build_object('name',d.driver_name,'vehicle_type',v.vehicle_type,'vehicle_number',v.vehicle_number,'phone',p.phone,'rating',p.rating,'business_name',p.business_name,'distance_km',o.distance_km,'fare',o.fare,'latitude',d.latitude,'longitude',d.longitude) INTO driver FROM public.cab_driver_presence d JOIN public.vehicles v ON v.id=o.vehicle_id JOIN public.providers p ON p.id=o.provider_id WHERE d.provider_id=o.provider_id; END IF;
 IF r.booking_id IS NOT NULL THEN SELECT jsonb_build_object('id',b.id,'code',b.booking_code,'status',b.status,'total',b.total_amount) INTO booking FROM public.bookings b WHERE b.id=r.booking_id; END IF;
 RETURN jsonb_build_object('id',r.id,'state',r.state,'radius',radius,'driver',driver,'booking',booking,'pickup',r.pickup_label,'drop',r.drop_label);
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
 INSERT INTO public.bookings(customer_id,provider_id,booking_type,event_date,event_time,pickup_location,drop_location,city,guests,subtotal,total_amount,status,details) VALUES(r.customer_id,p.id,'Cab',current_date,to_char(now(),'HH24:MI'),r.pickup_label,r.drop_label,p.city,v.seats,o.fare,o.fare,'confirmed',jsonb_build_object('source','customer_app','cab_mode','live_dispatch','request_id',r.id,'vehicle_id',v.id,'vehicle_type',v.vehicle_type,'vehicle_number',v.vehicle_number,'driver_name',d.driver_name,'driver_phone',p.phone,'driver_rating',p.rating,'pickup_coords',jsonb_build_object('lat',r.pickup_lat,'lng',r.pickup_lng),'drop_coords',jsonb_build_object('lat',r.drop_lat,'lng',r.drop_lng),'distance_km',r.road_km,'trip_minutes',r.trip_minutes)) RETURNING id INTO bid;
 INSERT INTO public.payments(booking_id,customer_id,method,amount,status) VALUES(bid,r.customer_id,'cash',o.fare,'pending');
 UPDATE public.cab_trip_requests SET state='accepted',booking_id=bid WHERE id=r.id;
 UPDATE public.cab_trip_offers SET state='accepted' WHERE id=o.id;
 UPDATE public.cab_driver_presence SET online=false WHERE provider_id=p.id;
 RETURN jsonb_build_object('state','accepted','booking_id',bid);
END; $$;