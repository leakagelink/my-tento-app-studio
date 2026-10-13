export type RankedPlace = { id: string; name: string; address: string; point: { lat: number; lng: number }; distanceKm: number | null };

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Nearest first: own-city places (≤50 km) before farther city/state/country matches. */
export function rankPlaces(list: Omit<RankedPlace, "distanceKm">[], near: { lat: number; lng: number } | null): RankedPlace[] {
  const withD = list.map((p) => ({ ...p, distanceKm: near ? km(near, p.point) : null }));
  if (!near) return withD;
  return withD.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}
