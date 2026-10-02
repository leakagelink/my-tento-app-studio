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

export function useLiveProviders(city: string) {
  return useQuery({
    queryKey: ["providers", city],
    queryFn: async (): Promise<LiveProvider[]> => {
      const { data, error } = await supabase
        .from("providers")
        .select("id,business_name,description,phone,rating,distance_km,provider_services(base_price,details)")
        .eq("city", city)
        .eq("active", true)
        .eq("verified", true)
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

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function createLiveBooking(input: {
  providerId: string;
  bookingType: string;
  guests: number;
  totalAmount: number;
  paymentMethod: "cash" | "advance" | "razorpay";
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("SIGN_IN_REQUIRED");
  const { data: booking, error } = await supabase.from("bookings").insert({
    customer_id: user.id,
    provider_id: input.providerId,
    booking_type: input.bookingType,
    event_date: "2026-12-25",
    event_time: "18:00",
    city: "Lucknow",
    guests: input.guests,
    subtotal: input.totalAmount,
    total_amount: input.totalAmount,
    details: { source: "customer_app" },
  }).select("id,booking_code").single();
  if (error) throw error;
  const amount = input.paymentMethod === "advance" ? Math.round(input.totalAmount * 0.2) : input.totalAmount;
  const { error: paymentError } = await supabase.from("payments").insert({
    booking_id: booking.id,
    customer_id: user.id,
    method: input.paymentMethod,
    amount,
  });
  if (paymentError) throw paymentError;
  return booking;
}