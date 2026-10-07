import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { displayableImage } from "@/lib/image";

export type LiveProvider = {
  id: string;
  name: string;
  detail: string;
  price: string;
  rating: string;
  initials: string;
  distance: number;
  phone: string;
  logo: string | null;
  banner: string | null;
};

export function useLiveProviders(city: string, serviceName: string) {
  return useQuery({
    queryKey: ["providers", city, serviceName],
    queryFn: async (): Promise<LiveProvider[]> => {
      const { data, error } = await supabase
        .from("providers")
        .select("id,business_name,description,phone,rating,distance_km,logo_url,banner_url,provider_services!inner(base_price,details,active,services!inner(name))")
        .ilike("city", `%${city.trim().replace(/\s+(city|district)$/i, "").replace(/[%_,]/g, "")}%`)
        .eq("active", true)
        .eq("verified", true)
        .eq("provider_services.active", true)
        .eq("provider_services.services.name", serviceName)
        .lte("distance_km", 10)
        .order("rating", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((provider) => {
        const service = Array.isArray(provider.provider_services) ? provider.provider_services[0] : undefined;
        const name = provider.business_name;
        return {
          id: provider.id,
          name,
          detail: service?.details || provider.description,
          price: `₹${Number(service?.base_price ?? 0).toLocaleString("en-IN")}`,
          rating: Number(provider.rating).toFixed(1),
          initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
          distance: Number(provider.distance_km),
          phone: provider.phone,
          logo: displayableImage(provider.logo_url),
          banner: displayableImage(provider.banner_url),
        };
      });
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

/**
 * Availability rules per provider: a provider that has any calendar rows is
 * "restricted" (open only on dates explicitly marked available); a provider
 * with no rows is open every day. A date is bookable when at least one
 * relevant provider is open on it.
 */
export function useAvailableDates(providerIds: string[]) {
  const ids = [...providerIds].sort();
  const { data, isLoading } = useQuery({
    queryKey: ["provider-availability-open", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data: rows, error } = await supabase.from("provider_availability").select("provider_id,available_date,status").in("provider_id", ids);
      if (error) throw error;
      return rows ?? [];
    },
    staleTime: 60_000,
  });
  const openDates = new Set<string>();
  const bookedDates = new Set<string>();
  let restricted = 0;
  if (data) {
    const byProvider = new Map<string, number>();
    for (const row of data) {
      byProvider.set(row.provider_id, (byProvider.get(row.provider_id) ?? 0) + 1);
      if (row.status === "available") openDates.add(row.available_date);
      if (row.status === "booked") bookedDates.add(row.available_date);
    }
    restricted = [...byProvider.values()].filter((count) => count > 0).length;
  }
  const isDateAvailable = (date: Date) => {
    if (restricted === 0) return true;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return openDates.has(key);
  };
  const isDateBooked = (date: Date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return bookedDates.has(key);
  };
  return { isDateAvailable, isDateBooked, isLoading };
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function createLiveBooking(input: {
  providerId: string;
  bookingType: string;
  guests: number;
  totalAmount: number;
  paymentMethod: "cash";
  eventDate: string;
  eventTime: string;
  city: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("SIGN_IN_REQUIRED");
  const { data: booking, error } = await supabase.from("bookings").insert({
    customer_id: user.id,
    provider_id: input.providerId,
    booking_type: input.bookingType,
    event_date: input.eventDate,
    event_time: input.eventTime,
    city: input.city,
    guests: input.guests,
    subtotal: input.totalAmount,
    total_amount: input.totalAmount,
    details: { source: "customer_app" },
  }).select("id,booking_code").single();
  if (error) throw error;
  const { error: paymentError } = await supabase.from("payments").insert({
    booking_id: booking.id,
    customer_id: user.id,
    method: input.paymentMethod,
    amount: input.totalAmount,
    status: "pending",
  });
  if (paymentError) throw paymentError;
  return booking;
}
/** Admin-managed photos for each service category, keyed by service name. */
export function useServicePhotos() {
  const { data } = useQuery({
    queryKey: ["service-photos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("name,image_url");
      if (error) throw error;
      return Object.fromEntries((data ?? []).filter((s) => s.image_url).map((s) => [s.name, s.image_url as string])) as Record<string, string>;
    },
    staleTime: 5 * 60_000,
  });
  return data ?? {};
}

export type PublicOffer = { code: string; title: string; discount_percent: number; max_discount: number | null; starts_at: string | null; ends_at: string | null };
/** Active offers currently within their date window. */
export function usePublicOffers() {
  const { data } = useQuery({
    queryKey: ["public-offers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("offers").select("code,title,discount_percent,max_discount,starts_at,ends_at").eq("active", true).order("discount_percent", { ascending: false });
      if (error) throw error;
      const now = Date.now();
      return (data ?? []).filter((o) => (!o.starts_at || Date.parse(o.starts_at) <= now) && (!o.ends_at || Date.parse(o.ends_at) >= now)) as PublicOffer[];
    },
    staleTime: 0,
  });
  return data ?? [];
}
export function offerDiscount(offer: PublicOffer | undefined, amount: number) {
  if (!offer) return 0;
  const raw = Math.round((amount * offer.discount_percent) / 100);
  return offer.max_discount ? Math.min(raw, Number(offer.max_discount)) : raw;
}

export function usePublicBanners() {
  const { data } = useQuery({
    queryKey: ["public-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("id,title,subtitle,image_url,banner_type").eq("active", true).order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 0,
  });
  return data ?? [];
}
