import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, ChevronRight, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { createLiveBooking } from "@/lib/live-data";

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
      }).filter((v) => v.provider?.active && v.provider.verified && Number(v.provider.distance_km) <= 10 && (!city || v.provider.city === city));
    },
    staleTime: 60_000,
  });
}

export function ClientCabScreen() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<CabVehicle | null>(null);
  const [mode, setMode] = useState<CabMode>("trip");
  const [pkg, setPkg] = useState<string>("4h");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [km, setKm] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: vehicles = [], isLoading } = useNearbyVehicles();

  const kmNum = Number(km) || 0;
  const activePkg = EVENT_PACKAGES.find((p) => p.id === pkg) ?? EVENT_PACKAGES[0];
  const total = selected
    ? mode === "event"
      ? Math.round(selected.base_fare * activePkg.multiplier)
      : selected.base_fare + selected.per_km_rate * kmNum
    : 0;

  const book = async () => {
    if (!selected?.provider) return;
    if (!date || !time || !pickup.trim() || !drop.trim() || (mode === "trip" && kmNum <= 0)) {
      toast.error(mode === "trip" ? "Date, time, pickup, drop aur distance bhariye" : "Date, time, pickup aur drop bhariye");
      return;
    }
    setSaving(true);
    try {
      const booking = await createLiveBooking({
        providerId: selected.provider.id,
        bookingType: mode === "event" ? "Marriage Cab" : "Cab",
        guests: selected.seats,
        totalAmount: total,
        paymentMethod: "cash",
        eventDate: date,
        eventTime: time,
        city: selected.provider.city,
      });
      await supabase.from("bookings").update({
        pickup_location: pickup.trim(),
        drop_location: drop.trim(),
        details: {
          source: "customer_app",
          vehicle_id: selected.id,
          vehicle_type: selected.vehicle_type,
          ...(mode === "event"
            ? { cab_mode: "event_package", package: activePkg.label }
            : { cab_mode: "point_to_point", distance_km: kmNum }),
        },
      }).eq("id", booking.id);
      toast.success(`Cab booked! Code: ${booking.booking_code}`);
      setSelected(null);
      setMode("trip"); setPkg("4h");
      setDate(""); setTime(""); setPickup(""); setDrop(""); setKm("");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (e) {
      toast.error(e instanceof Error && e.message === "SIGN_IN_REQUIRED" ? "Cab book karne ke liye sign in kariye" : "Booking save nahi hui, dobara try kariye");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-w-0 animate-rise-in">
      <div className="rounded-b-[28px] bg-primary px-5 pb-6 pt-4 text-primary-foreground"><p className="text-[10px] font-black uppercase text-accent">Cab booking</p><h1 className="mt-1 font-display text-2xl font-extrabold">Nearby vehicles</h1><p className="mt-1 text-xs text-primary-foreground/75">Only active vehicles from verified providers within 10 km</p></div>
      <div className="space-y-4 px-4 pt-5">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading vehicles…</p> : vehicles.length === 0 ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">No verified cab vehicles are available nearby right now.</p> : vehicles.map((vehicle) => (
          <div key={vehicle.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><Car className="size-6" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold">{vehicle.vehicle_type}</h2>
                <p className="text-xs text-muted-foreground">{vehicle.seats} seats · {vehicle.provider?.business_name}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" /> {vehicle.provider?.city} · {Number(vehicle.provider?.distance_km).toFixed(1)} km</p>
              </div>
              <div className="text-right"><p className="font-bold text-primary">₹{vehicle.base_fare}</p><p className="text-[10px] text-muted-foreground">+ ₹{vehicle.per_km_rate}/km</p></div>
            </div>
            <Button className="mt-3 w-full" onClick={() => setSelected(vehicle)}>Book this cab</Button>
          </div>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Book {selected?.vehicle_type}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={mode === "trip" ? "default" : "outline"} onClick={() => setMode("trip")}>Point to point</Button>
              <Button type="button" variant={mode === "event" ? "default" : "outline"} onClick={() => setMode("event")}>Marriage / Event</Button>
            </div>
            {mode === "event" && (
              <div><Label>Package</Label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {EVENT_PACKAGES.map((p) => (
                    <Button key={p.id} type="button" size="sm" variant={pkg === p.id ? "default" : "outline"} onClick={() => setPkg(p.id)}>{p.label}</Button>
                  ))}
                </div>
              </div>
            )}
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><Label>Time</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
            <div><Label>Pickup location</Label><Input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Jahan se pick karna hai" /></div>
            <div><Label>Drop location</Label><Input value={drop} onChange={(e) => setDrop(e.target.value)} placeholder={mode === "event" ? "Event venue" : "Jahan jaana hai"} /></div>
            {mode === "trip" && <div><Label>Estimated distance (km)</Label><Input type="number" min="1" value={km} onChange={(e) => setKm(e.target.value)} placeholder="e.g. 12" /></div>}
            <div className="rounded-lg bg-secondary p-3 text-sm">
              {mode === "event" ? (
                <><div className="flex justify-between"><span>{activePkg.label} package</span><b>₹{total.toLocaleString("en-IN")}</b></div><p className="mt-1 text-[11px] text-muted-foreground">Base fare ₹{selected?.base_fare} × {activePkg.multiplier} — event ke liye reserved cab</p></>
              ) : (
                <><div className="flex justify-between"><span>Base fare</span><b>₹{selected?.base_fare}</b></div><div className="flex justify-between"><span>{kmNum} km × ₹{selected?.per_km_rate}/km</span><b>₹{(selected?.per_km_rate ?? 0) * kmNum}</b></div></>
              )}
              <div className="mt-1 flex justify-between border-t border-border pt-1"><span>Total (cash)</span><b className="text-primary">₹{total.toLocaleString("en-IN")}</b></div>
            </div>
            <Button className="w-full" size="lg" disabled={saving} onClick={book}>{saving ? "Booking…" : "Confirm booking"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
