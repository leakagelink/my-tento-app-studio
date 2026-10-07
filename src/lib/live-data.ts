import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LiveProvider = {
  id: string;
  name: string;
  detail: string;
  price: string;
  rating: string;
  initials: string;
  distance: number;
  phone: string;
};

export function useLiveProviders(city: string, serviceName: string) {
  return useQuery({
    queryKey: ["providers", city, serviceName],
    queryFn: async (): Promise<LiveProvider[]> => {
      const { data, error } = await supabase
        .from("providers")
        .select("id,business_name,description,phone,rating,distance_km,provider_services!inner(base_price,details,active,services!inner(name))")
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
        };
      });
    },
    staleTime: 60_000,
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