import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { rankPlaces, type RankedPlace } from "./place-rank";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

/** Google place search biased to the user's city; results ranked nearest-first. */
export const searchPlacesGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { q: string; lat?: number | null; lng?: number | null }) => {
    const q = String(input.q ?? "").trim().slice(0, 120);
    if (q.length < 2) throw new Error("Query too short");
    const lat = typeof input.lat === "number" && Math.abs(input.lat) <= 90 ? input.lat : null;
    const lng = typeof input.lng === "number" && Math.abs(input.lng) <= 180 ? input.lng : null;
    return { q, lat, lng };
  })
  .handler(async ({ data }): Promise<RankedPlace[]> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableKey || !mapsKey) throw new Error("Google Maps is not connected");
    const near = data.lat != null && data.lng != null ? { lat: data.lat, lng: data.lng } : null;
    const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": mapsKey,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location",
      },
      body: JSON.stringify({
        textQuery: data.q,
        pageSize: 15,
        languageCode: "en",
        regionCode: "IN",
        ...(near ? { locationBias: { circle: { center: { latitude: near.lat, longitude: near.lng }, radius: 50000 } } } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Places search failed [${res.status}]: ${body}`);
      throw new Error(`Place search failed (${res.status})`);
    }
    const j = (await res.json()) as { places?: { id: string; displayName?: { text?: string }; formattedAddress?: string; location?: { latitude: number; longitude: number } }[] };
    const list = (j.places ?? []).filter((p) => p.location).map((p) => ({
      id: p.id,
      name: p.displayName?.text ?? "",
      address: p.formattedAddress ?? "",
      point: { lat: p.location!.latitude, lng: p.location!.longitude },
    }));
    return rankPlaces(list, near);
  });
