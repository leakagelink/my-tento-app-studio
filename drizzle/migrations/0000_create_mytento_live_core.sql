CREATE TYPE public.app_role AS ENUM ('admin', 'provider', 'customer');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'team_assigned', 'setup_started', 'completed', 'declined', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'advance_paid', 'paid', 'failed', 'refunded');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  avatar_url text,
  preferred_language text NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','hi')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'customer',
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', '')) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  business_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  city text NOT NULL,
  area text NOT NULL DEFAULT '',
  latitude numeric(10,7),
  longitude numeric(10,7),
  distance_km numeric(6,2) NOT NULL DEFAULT 0,
  rating numeric(2,1) NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  review_count integer NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  logo_url text,
  banner_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.providers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active verified providers" ON public.providers FOR SELECT TO anon, authenticated USING (active AND verified OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Providers update own business" ON public.providers FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Providers create own business" ON public.providers FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'provider') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete providers" ON public.providers FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  subtitle text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active services" ON public.services FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.provider_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  base_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  details text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  UNIQUE(provider_id, service_id)
);
GRANT SELECT ON public.provider_services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.provider_services TO authenticated;
GRANT ALL ON public.provider_services TO service_role;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active provider services" ON public.provider_services FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners manage provider services" ON public.provider_services FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))) WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('tent','gadget','decoration','catering')),
  name text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.inventory_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active inventory" ON public.inventory_items FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners manage inventory" ON public.inventory_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))) WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE,
  vehicle_type text NOT NULL,
  vehicle_number text NOT NULL DEFAULT '',
  seats integer NOT NULL DEFAULT 4 CHECK (seats > 0),
  base_fare numeric(12,2) NOT NULL DEFAULT 0 CHECK (base_fare >= 0),
  per_km_rate numeric(10,2) NOT NULL DEFAULT 0 CHECK (per_km_rate >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active vehicles" ON public.vehicles FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners manage vehicles" ON public.vehicles FOR ALL TO authenticated USING (provider_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))) OR public.has_role(auth.uid(), 'admin')) WITH CHECK (provider_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))) OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.provider_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  available_date date NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','booked','blocked')),
  UNIQUE(provider_id, available_date)
);
GRANT SELECT ON public.provider_availability TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.provider_availability TO authenticated;
GRANT ALL ON public.provider_availability TO service_role;
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads availability" ON public.provider_availability FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners manage availability" ON public.provider_availability FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))) WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text NOT NULL UNIQUE DEFAULT ('MT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  customer_id uuid NOT NULL,
  provider_id uuid REFERENCES public.providers(id),
  service_id uuid REFERENCES public.services(id),
  booking_type text NOT NULL,
  event_date date NOT NULL,
  event_time text NOT NULL DEFAULT '',
  pickup_location text NOT NULL DEFAULT '',
  drop_location text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  guests integer NOT NULL DEFAULT 20 CHECK (guests > 0 AND guests % 20 = 0),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  subtotal numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status public.booking_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers create bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Booking parties read bookings" ON public.bookings FOR SELECT TO authenticated USING (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers update pending bookings" ON public.bookings FOR UPDATE TO authenticated USING (customer_id = auth.uid() AND status IN ('pending','confirmed') OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')) WITH CHECK (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  method text NOT NULL CHECK (method IN ('razorpay','cash','advance')),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  status public.payment_status NOT NULL DEFAULT 'pending',
  provider_order_id text,
  provider_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payment parties read payments" ON public.payments FOR SELECT TO authenticated USING (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.bookings b JOIN public.providers p ON p.id = b.provider_id WHERE b.id = booking_id AND p.owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers create payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid() AND EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid()));

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Customers review completed bookings" ON public.reviews FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid() AND EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid() AND b.provider_id = provider_id AND b.status = 'completed'));
CREATE POLICY "Customers manage own reviews" ON public.reviews FOR UPDATE TO authenticated USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Customers delete own reviews" ON public.reviews FOR DELETE TO authenticated USING (customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_type text NOT NULL CHECK (banner_type IN ('offer','update','announcement')),
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  image_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active banners" ON public.banners FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  discount_percent integer NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  max_discount numeric(12,2),
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.offers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active offers" ON public.offers FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage offers" ON public.offers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  audience public.app_role,
  title text NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT INSERT, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read relevant notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR audience IS NOT NULL AND public.has_role(auth.uid(), audience) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users mark own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX providers_location_idx ON public.providers(city, distance_km) WHERE active AND verified;
CREATE INDEX provider_services_provider_idx ON public.provider_services(provider_id);
CREATE INDEX inventory_provider_idx ON public.inventory_items(provider_id, category);
CREATE INDEX vehicles_provider_idx ON public.vehicles(provider_id, vehicle_type);
CREATE INDEX availability_provider_date_idx ON public.provider_availability(provider_id, available_date);
CREATE INDEX bookings_customer_idx ON public.bookings(customer_id, created_at DESC);
CREATE INDEX bookings_provider_idx ON public.bookings(provider_id, event_date);
CREATE INDEX payments_booking_idx ON public.payments(booking_id);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_availability;