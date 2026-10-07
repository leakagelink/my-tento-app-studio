ALTER TABLE public.bookings DROP CONSTRAINT bookings_guests_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_guests_check CHECK (guests > 0 AND (booking_type = 'Cab' OR guests % 20 = 0));