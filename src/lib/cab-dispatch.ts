import { supabase } from "@/integrations/supabase/client";

export type LiveCabDriver = {
  id: string; vehicle_type: string; vehicle_number: string; seats: number;
  base_fare: number; per_km_rate: number; driver_name: string;
  latitude: number; longitude: number; distance_km: number;
  provider_id: string; business_name: string; city: string;
};
export type CabDispatchState = {
  id: string; state: "searching" | "accepted" | "cancelled" | "no_driver"; radius: number;
  pickup: string; drop: string;
  driver: { name: string; vehicle_type: string; vehicle_number: string; phone?: string | null; rating?: number | null; business_name?: string | null; distance_km: number; fare: number; latitude: number; longitude: number } | null;
  booking: { id: string; code: string; status: string; total: number } | null;
  ride_status?: "pending" | "accepted" | "arrived" | "started" | "completed" | "cancelled";
  otp?: string | null;
  pickup_coords?: { lat: number; lng: number }; drop_coords?: { lat: number; lng: number };
  road_km?: number; trip_minutes?: number;
};
export type ActiveCabRide = { request_id: string; booking_code: string; ride_status: "accepted" | "arrived" | "started"; pickup_label: string; drop_label: string; pickup_lat: number; pickup_lng: number; drop_lat: number; drop_lng: number; road_km: number; trip_minutes: number; fare: number; customer_name: string; customer_phone: string | null };
export function rideHeadline(state: CabDispatchState["state"] | undefined, ride?: CabDispatchState["ride_status"]) {
  if (!state || state === "searching") return "Finding your driver";
  if (state === "no_driver") return "No driver available";
  if (state === "cancelled" || ride === "cancelled") return "Ride cancelled";
  return ({ accepted: "Driver is on the way", arrived: "Driver has arrived", started: "Ride in progress", completed: "Ride completed" } as Record<string, string>)[ride ?? "accepted"] ?? "Driver is on the way";
}
export type CabOffer = { id: string; fare: number; expires_at: string; distance_km: number; pickup_label: string; drop_label: string; road_km: number; trip_minutes: number; vehicle_type: string };

export function searchRadius(elapsedSeconds: number) {
  return elapsedSeconds < 10 ? 2 : elapsedSeconds < 20 ? 5 : elapsedSeconds < 30 ? 10 : 15;
}
export function nearestFirst<T extends { distance_km: number }>(drivers: T[]): T[] {
  return [...drivers].sort((a, b) => a.distance_km - b.distance_km);
}
export async function findLiveDrivers(lat: number, lng: number, radius: number): Promise<LiveCabDriver[]> {
  const { data, error } = await supabase.rpc("find_nearby_cab_drivers", { _lat: lat, _lng: lng, _radius: radius });
  if (error) throw error;
  return nearestFirst(Array.isArray(data) ? data as unknown as LiveCabDriver[] : []);
}
export async function advanceCabRequest(id: string): Promise<CabDispatchState> {
  const { data, error } = await supabase.rpc("advance_cab_trip_request", { _request_id: id });
  if (error) throw error;
  return data as unknown as CabDispatchState;
}