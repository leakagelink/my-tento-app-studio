import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, ChevronRight, Clock, Crosshair, LocateFixed, MapPin, Navigation, Route, Search, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { createLiveBooking } from "@/lib/live-data";
import type { LatLng } from "@/components/cab-ride-map";

const CabRideMap = lazy(() => import("@/components/cab-ride-map"));

export type AdminExtraTab = "content" | "notifications" | "reports" | "settings";

export function CabPriorityCard({ onOpen }: { onOpen: () => void }) {
  return <section className="mb-6 flex min-w-0 items-center justify-between gap-3 rounded-3xl bg-festive p-4"><div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 text-white"><Navigation className="size-5" /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Need a ride?</p><h2 className="truncate font-display text-sm font-bold text-white">View nearby vehicles</h2></div></div><Button onClick={onOpen} variant="ghost" className="shrink-0 rounded-xl bg-white/15 px-4 text-xs font-bold text-white hover:bg-white/25">View <ChevronRight className="size-4" /></Button></section>;
}

type CabVehicle = {
  id: string;
  vehicle_type: string;
  seats: number;
  base_fare: number;
  per_km_rate: number;
  provider: { id: string; business_name: string; city: string; distance_km: number } | null;
};

export type CabMode = "trip" | "event";

export const EVENT_PACKAGES = [
  { id: "4h", label: "4 hours", multiplier: 1.5 },
  { id: "8h", label: "8 hours", multiplier: 2.5 },
  { id: "12h", label: "Full day (12 hours)", multiplier: 3.5 },
] as const;

export type CabAddon = {
  vehicleId: string;
  vehicleType: string;
  seats: number;
  providerId: string;
  providerName: string;
  pkgId: string;
  pkgLabel: string;
  multiplier: number;
  total: number;
};

export function useNearbyVehicles(city?: string) {
  return useQuery({
    queryKey: ["public-vehicles", city ?? "all"],
    queryFn: async (): Promise<CabVehicle[]> => {
      const { data, error } = await supabase.from("vehicles").select("id,vehicle_type,seats,base_fare,per_km_rate,providers(id,business_name,city,distance_km,verified,active)").eq("active", true).order("base_fare");
      if (error) throw error;
      return (data ?? []).map((v) => {
        const provider = Array.isArray(v.providers) ? v.providers[0] : v.providers;
        return { id: v.id, vehicle_type: v.vehicle_type, seats: v.seats, base_fare: Number(v.base_fare), per_km_rate: Number(v.per_km_rate), provider };
      }).filter((v) => {
        const want = (city ?? "").trim().toLowerCase().replace(/\s+(city|district)$/, "");
        const have = (v.provider?.city ?? "").trim().toLowerCase();
        return v.provider?.active && v.provider.verified && Number(v.provider.distance_km) <= 10 && (!want || have.includes(want) || want.includes(have));
      });
    },
    staleTime: 0, refetchOnMount: "always",
  });
}

type Place = { label: string; point: LatLng };

async function reverseGeocode(p: LatLng): Promise<string> {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=17&lat=${p.lat}&lon=${p.lng}`, { headers: { "Accept-Language": "en" } });
    const j = await r.json();
    return (j.display_name as string)?.split(",").slice(0, 3).join(",") || `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`;
  } catch { return `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`; }
}

async function searchPlaces(q: string, near: LatLng | null): Promise<Place[]> {
  const box = near ? `&viewbox=${near.lng - 0.4},${near.lat + 0.4},${near.lng + 0.4},${near.lat - 0.4}` : "";
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=in${box}&q=${encodeURIComponent(q)}`, { headers: { "Accept-Language": "en" } });
  const j = (await r.json()) as { display_name: string; lat: string; lon: string }[];
  return j.map((x) => ({ label: x.display_name.split(",").slice(0, 3).join(","), point: { lat: Number(x.lat), lng: Number(x.lon) } }));
}

function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371, toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function fmtMin(min: number) { const m = Math.max(1, Math.round(min)); return m >= 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m} min`; }
function clockAfter(min: number) { return new Date(Date.now() + min * 60000).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }); }
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

/** Fare for a point-to-point ride: base fare + per-km rate × road distance. */
export function rideFare(v: { base_fare: number; per_km_rate: number }, km: number) {
  return Math.round(v.base_fare + v.per_km_rate * km);
}
/** Minutes for a cab to reach pickup from the provider's base (≈25 km/h city speed + 2 min). */
export function pickupEtaMin(providerDistanceKm: number) {
  return Math.round((providerDistanceKm / 25) * 60 + 2);
}

function PlaceSearch({ placeholder, near, onSelect }: { placeholder: string; near: LatLng | null; onSelect: (p: Place) => void }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Place[]>([]);
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(t.current);
    if (q.trim().length < 3) { setRes([]); return; }
    t.current = setTimeout(() => { searchPlaces(q, near).then(setRes).catch(() => setRes([])); }, 450);
  }, [q, near]);
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="h-11 rounded-xl pl-9" />
      {res.length > 0 && (
        <div className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {res.map((r, i) => (
            <button key={i} type="button" onClick={() => { onSelect(r); setQ(""); setRes([]); }} className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-secondary">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" /><span className="line-clamp-2">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ClientCabScreen() {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<CabMode>("trip");
  const [pickup, setPickup] = useState<Place | null>(null);
  const [drop, setDrop] = useState<Place | null>(null);
  const [locating, setLocating] = useState(false);
  const [route, setRoute] = useState<{ km: number; min: number; line: [number, number][] } | null>(null);
  const [routing, setRouting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pkg, setPkg] = useState<string>("4h");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const { data: vehicles = [], isLoading } = useNearbyVehicles();
  const selected = vehicles.find((v) => v.id === selectedId) ?? vehicles[0] ?? null;

  useEffect(() => { setMounted(true); }, []);

  const locate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) { toast.error("Location is not available on this device"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setPickup({ label: "Locating address…", point });
      setPickup({ label: await reverseGeocode(point), point });
      setLocating(false);
    }, () => { setLocating(false); toast.error("Location permission nahi mili — pickup search karke chuniye"); }, { enableHighAccuracy: true, timeout: 15000 });
  };
  useEffect(() => { locate(); }, []);

  // Road distance + travel time between pickup and drop.
  useEffect(() => {
    if (!pickup || !drop) { setRoute(null); return; }
    let cancel = false;
    setRouting(true);
    const { point: a } = pickup, { point: b } = drop;
    fetch(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`)
      .then((r) => r.json())
      .then((j) => {
        if (cancel) return;
        const r0 = j.routes?.[0];
        if (!r0) throw new Error("no route");
        setRoute({ km: r0.distance / 1000, min: r0.duration / 60, line: (r0.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng]) });
      })
      .catch(() => { if (!cancel) { const km = haversineKm(a, b) * 1.3; setRoute({ km, min: (km / 25) * 60, line: [] }); } })
      .finally(() => { if (!cancel) setRouting(false); });
    return () => { cancel = true; };
  }, [pickup, drop]);

  const onMapPick = async (p: LatLng) => {
    setDrop({ label: "Fetching address…", point: p });
    setDrop({ label: await reverseGeocode(p), point: p });
  };

  const km = route ? Math.round(route.km * 10) / 10 : 0;
  const activePkg = EVENT_PACKAGES.find((p) => p.id === pkg) ?? EVENT_PACKAGES[0];
  const total = selected ? (mode === "event" ? Math.round(selected.base_fare * activePkg.multiplier) : rideFare(selected, km)) : 0;
  const mapLine = useMemo(() => route?.line ?? [], [route]);

  const book = async () => {
    if (!selected?.provider) return;
    if (!pickup || !drop) { toast.error("Pickup aur drop location chuniye"); return; }
    if (mode === "event" && (!date || !time)) { toast.error("Event ki date aur time chuniye"); return; }
    if (mode === "trip" && !route) { toast.error("Route calculate ho raha hai, ek second rukiye"); return; }
    setSaving(true);
    try {
      const now = new Date();
      const booking = await createLiveBooking({
        providerId: selected.provider.id,
        bookingType: mode === "event" ? "Marriage Cab" : "Cab",
        guests: selected.seats,
        totalAmount: total,
        paymentMethod: "cash",
        eventDate: mode === "event" ? date : todayStr(),
        eventTime: mode === "event" ? time : `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        city: selected.provider.city,
      });
      await supabase.from("bookings").update({
        pickup_location: pickup.label,
        drop_location: drop.label,
        details: {
          source: "customer_app",
          vehicle_id: selected.id,
          vehicle_type: selected.vehicle_type,
          pickup_coords: pickup.point,
          drop_coords: drop.point,
          ...(mode === "event"
            ? { cab_mode: "event_package", package: activePkg.label }
            : { cab_mode: "point_to_point", distance_km: km, trip_minutes: Math.round(route?.min ?? 0) }),
        },
      }).eq("id", booking.id);
      setDone(booking.booking_code);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (e) {
      toast.error(e instanceof Error && e.message === "SIGN_IN_REQUIRED" ? "Cab book karne ke liye sign in kariye" : "Booking save nahi hui, dobara try kariye");
    } finally {
      setSaving(false);
    }
  };

  const eta = selected?.provider ? pickupEtaMin(Number(selected.provider.distance_km)) : 0;

  if (done) {
    return (
      <div className="animate-rise-in px-5 pt-10 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-success/15 text-success"><Car className="size-10" /></div>
        <h1 className="mt-5 font-display text-2xl font-extrabold">{mode === "event" ? "Event cab reserved!" : "Ride confirmed!"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Booking code <b className="text-foreground">{done}</b></p>
        <div className="mt-6 space-y-2 rounded-2xl border border-border bg-card p-4 text-left text-sm">
          <p className="flex gap-2"><span className="mt-1 size-2.5 shrink-0 rounded-full bg-success" />{pickup?.label}</p>
          <p className="flex gap-2"><span className="mt-1 size-2.5 shrink-0 rounded-full bg-accent" />{drop?.label}</p>
          {mode === "trip" && <p className="pt-2 text-muted-foreground">Cab {fmtMin(eta)} me pahunchegi · drop approx {clockAfter(eta + (route?.min ?? 0))}</p>}
          <p className="flex justify-between border-t border-border pt-2 font-bold"><span>Total (cash)</span><span className="text-primary">₹{total.toLocaleString("en-IN")}</span></p>
        </div>
        <Button className="mt-6 w-full" size="lg" onClick={() => { setDone(null); setDrop(null); setDate(""); setTime(""); }}>Book another ride</Button>
      </div>
    );
  }

  return (
    <div className="min-w-0 animate-rise-in">
      <div className="relative h-[46vh] min-h-[300px] w-full overflow-hidden bg-secondary">
        {mounted && <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">Loading map…</div>}><CabRideMap pickup={pickup?.point ?? null} drop={drop?.point ?? null} route={mapLine} onPick={onMapPick} /></Suspense>}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] flex justify-center">
          <div className="pointer-events-auto grid grid-cols-2 gap-1 rounded-full bg-card p-1 shadow-lg">
            <button type="button" onClick={() => setMode("trip")} className={`rounded-full px-4 py-2 text-xs font-bold ${mode === "trip" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Ride now</button>
            <button type="button" onClick={() => setMode("event")} className={`rounded-full px-4 py-2 text-xs font-bold ${mode === "event" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>Marriage / Event</button>
          </div>
        </div>
        <button type="button" aria-label="Use my location" onClick={locate} className="absolute bottom-8 right-3 z-[500] grid size-11 place-items-center rounded-full bg-card text-primary shadow-lg">
          <LocateFixed className={`size-5 ${locating ? "animate-pulse" : ""}`} />
        </button>
        {!drop && <div className="pointer-events-none absolute bottom-8 left-3 z-[500] rounded-full bg-foreground/80 px-3 py-1.5 text-[11px] font-semibold text-background"><Crosshair className="mr-1 inline size-3" />Map par tap karke drop chuniye</div>}
      </div>

      <div className="relative z-10 -mt-5 space-y-4 rounded-t-[28px] bg-background px-4 pb-8 pt-5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-1.5"><span className="size-3 rounded-full bg-success ring-4 ring-success/20" /><span className="my-1 w-px flex-1 border-l-2 border-dashed border-border" /><span className="size-3 rounded-sm bg-accent ring-4 ring-accent/20" /></div>
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Pickup</p>
                <p className="truncate text-sm font-semibold">{pickup?.label ?? (locating ? "Detecting your location…" : "Pickup chuniye")}</p>
                {!pickup && !locating && <div className="mt-1"><PlaceSearch placeholder="Search pickup" near={null} onSelect={setPickup} /></div>}
              </div>
              <div className="border-t border-border pt-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Drop</p>
                {drop ? <div className="flex items-center gap-2"><p className="min-w-0 flex-1 truncate text-sm font-semibold">{drop.label}</p><button type="button" onClick={() => setDrop(null)} className="text-xs font-bold text-primary">Change</button></div>
                  : <div className="mt-1"><PlaceSearch placeholder="Where to? Search ya map par tap" near={pickup?.point ?? null} onSelect={setDrop} /></div>}
              </div>
            </div>
          </div>
        </div>

        {mode === "trip" && route && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-secondary p-2.5"><Route className="mx-auto size-4 text-primary" /><p className="mt-1 text-sm font-extrabold">{km} km</p><p className="text-[10px] text-muted-foreground">Distance</p></div>
            <div className="rounded-xl bg-secondary p-2.5"><Timer className="mx-auto size-4 text-primary" /><p className="mt-1 text-sm font-extrabold">{fmtMin(route.min)}</p><p className="text-[10px] text-muted-foreground">Trip time</p></div>
            <div className="rounded-xl bg-secondary p-2.5"><Clock className="mx-auto size-4 text-primary" /><p className="mt-1 text-sm font-extrabold">{clockAfter(eta + route.min)}</p><p className="text-[10px] text-muted-foreground">Drop by</p></div>
          </div>
        )}
        {mode === "trip" && routing && <p className="text-center text-xs text-muted-foreground">Route calculate ho raha hai…</p>}

        {mode === "event" && (
          <div className="space-y-3 rounded-2xl border border-accent/30 bg-accent/5 p-3">
            <p className="text-xs font-bold text-accent">Shaadi / event ke liye cab reserve kariye</p>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_PACKAGES.map((p) => <Button key={p.id} type="button" size="sm" variant={pkg === p.id ? "default" : "outline"} onClick={() => setPkg(p.id)} className="h-auto whitespace-normal py-2 text-xs">{p.label}</Button>)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Event date</Label><Input type="date" min={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div><Label className="text-xs">Time</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-2 font-display text-sm font-bold">Choose a ride</h2>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading vehicles…</p> : vehicles.length === 0 ? <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Abhi aas-paas koi verified cab available nahi hai.</p> : (
            <div className="space-y-2">
              {vehicles.map((v) => {
                const active = selected?.id === v.id;
                const price = mode === "event" ? Math.round(v.base_fare * activePkg.multiplier) : rideFare(v, km);
                const vEta = pickupEtaMin(Number(v.provider?.distance_km ?? 0));
                return (
                  <button key={v.id} type="button" onClick={() => setSelectedId(v.id)} className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${active ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Car className="size-6" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{v.vehicle_type} <span className="text-xs font-medium text-muted-foreground">· {v.seats} seats</span></p>
                      <p className="truncate text-xs text-muted-foreground">{mode === "trip" ? `${fmtMin(vEta)} away · ` : ""}{v.provider?.business_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold">{mode === "trip" && !route ? `₹${v.per_km_rate}/km` : `₹${price.toLocaleString("en-IN")}`}</p>
                      {mode === "trip" && !route && <p className="text-[10px] text-muted-foreground">+ ₹{v.base_fare} base</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selected && (
          <Button className="h-14 w-full rounded-2xl text-base font-bold" disabled={saving || !pickup || !drop || (mode === "trip" && !route)} onClick={book}>
            {saving ? "Booking…" : !drop ? "Drop location chuniye" : `Book ${selected.vehicle_type} · ₹${total.toLocaleString("en-IN")}`}
          </Button>
        )}
        <p className="text-center text-[11px] text-muted-foreground">Cash payment · fare includes base ₹{selected?.base_fare ?? 0} + per km rate</p>
      </div>
    </div>
  );
}
