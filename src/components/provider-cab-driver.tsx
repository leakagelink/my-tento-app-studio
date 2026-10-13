import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { History, KeyRound, LocateFixed, MapPin, Navigation, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import type { ActiveCabRide, CabOffer } from "@/lib/cab-dispatch";

export function ProviderCabDriver({ providerId }: { providerId: string }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [online, setOnline] = useState(false);
  const [gps, setGps] = useState("Offline");
  const [busy, setBusy] = useState(false);
  const point = useRef<{ lat: number; lng: number } | null>(null);
  const { data: vehicles = [] } = useQuery({ queryKey: ["driver-vehicles", providerId], queryFn: async () => { const { data, error } = await supabase.from("vehicles").select("id,vehicle_type,vehicle_number").eq("provider_id", providerId).eq("active", true); if (error) throw error; return data ?? []; } });
  const { data: presence } = useQuery({ queryKey: ["driver-presence", providerId], queryFn: async () => { const { data, error } = await supabase.from("cab_driver_presence").select("*").eq("provider_id", providerId).maybeSingle(); if (error) throw error; return data; } });
  const initialized = useRef(false);
  useEffect(() => { if (presence && !initialized.current) { initialized.current = true; setName(presence.driver_name); setVehicle(presence.vehicle_id); setOnline(presence.online); } }, [presence]);
  const selectedVehicle = vehicle || vehicles[0]?.id || "";
  const [otp, setOtp] = useState("");
  const { data: ride, refetch: refetchRide } = useQuery({ queryKey: ["cab-driver-active", providerId], queryFn: async () => { const { data, error } = await supabase.rpc("get_cab_driver_active_ride"); if (error) throw error; return (data ?? null) as unknown as ActiveCabRide | null; }, refetchInterval: 4000 });
  const { data: history = [] } = useQuery({ queryKey: ["cab-driver-history", providerId, ride?.ride_status], queryFn: async () => { const { data, error } = await supabase.from("bookings").select("booking_code,pickup_location,drop_location,total_amount,status,created_at,details").eq("provider_id", providerId).eq("booking_type", "Cab").order("created_at", { ascending: false }).limit(15); if (error) throw error; return (data ?? []).filter(b => b.details && typeof b.details === "object" && !Array.isArray(b.details) && b.details["cab_mode"] === "live_dispatch"); } });
  const lastRideStatus = useRef<string | null>(null);
  useEffect(() => { const k = ride?.request_id ?? null; if (lastRideStatus.current && !k) toast("Ride band ho gayi", { description: "Customer ne cancel kiya ya ride complete hui" }); lastRideStatus.current = k; }, [ride?.request_id]);
  useEffect(() => {
    if (!ride || !navigator.geolocation) return;
    const id = ride.request_id;
    const watch = navigator.geolocation.watchPosition(pos => { void supabase.rpc("update_cab_ride_location", { _request_id: id, _lat: pos.coords.latitude, _lng: pos.coords.longitude }); }, () => undefined, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
    return () => navigator.geolocation.clearWatch(watch);
  }, [ride?.request_id]);
  const act = async (action: "arrived" | "start" | "complete" | "cancel") => {
    if (!ride) return;
    setBusy(true);
    const { error } = await supabase.rpc("cab_ride_action", { _request_id: ride.request_id, _action: action, ...(action === "start" ? { _otp: otp.trim() } : {}) });
    setBusy(false);
    if (error) { toast.error(error.message.includes("WRONG_OTP") ? "OTP galat hai — customer se dobara poochiye" : "Action nahi ho paya, dobara try kariye"); return; }
    toast.success({ arrived: "Customer ko bata diya ki aap pahunch gaye", start: "Ride shuru ho gayi", complete: "Ride complete — cash collect kariye", cancel: "Ride cancel ho gayi" }[action]);
    setOtp(""); void refetchRide(); void qc.invalidateQueries({ queryKey: ["provider-bookings"] });
  };
  const { data: offers = [], refetch } = useQuery({ queryKey: ["cab-driver-inbox", providerId], queryFn: async () => { const { data, error } = await supabase.rpc("get_cab_driver_inbox"); if (error) throw error; return Array.isArray(data) ? data as unknown as CabOffer[] : []; }, refetchInterval: 3000 });

  useEffect(() => {
    if (!online || !selectedVehicle || name.trim().length < 2) return;
    if (!navigator.geolocation) { setGps("GPS unavailable"); setOnline(false); return; }
    let stopped = false;
    let saving = false;
    let lastGpsAt = 0;
    const save = async (isOnline: boolean) => {
      const p = point.current;
      if (!p || saving) return;
      saving = true;
      const { error } = await supabase.rpc("set_cab_driver_presence", { _vehicle_id: selectedVehicle, _name: name, _lat: p.lat, _lng: p.lng, _online: isOnline });
      saving = false;
      if (stopped) return;
      if (error) { setGps("Location update failed"); setOnline(false); toast.error("Online nahi ho paye—verification aur current ride check kariye"); }
      else setGps(isOnline ? "Live GPS · Online" : "Offline");
    };
    setGps("Getting GPS…");
    const watch = navigator.geolocation.watchPosition(pos => { if (stopped) return; point.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; lastGpsAt = Date.now(); void save(true); }, () => { if (stopped) return; void save(false); setOnline(false); setGps("Location permission required"); toast.error("Driver online hone ke liye location permission chahiye"); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
    const timer = setInterval(() => { navigator.geolocation.getCurrentPosition(pos => { if (stopped) return; point.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; lastGpsAt = Date.now(); void save(true); }, () => { if (stopped || Date.now() - lastGpsAt < 60000) return; void save(false); setGps("GPS lost · Offline"); setOnline(false); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }); }, 20000);
    return () => { stopped = true; navigator.geolocation.clearWatch(watch); clearInterval(timer); };
  }, [online, selectedVehicle, name]);

  const toggle = async (next: boolean) => {
    if (next) { if (!selectedVehicle || name.trim().length < 2) { toast.error("Driver name aur active vehicle chuniye"); return; } setOnline(true); return; }
    setBusy(true);
    const p = point.current ?? (presence ? { lat: presence.latitude, lng: presence.longitude } : null);
    if (p) { const { error } = await supabase.rpc("set_cab_driver_presence", { _vehicle_id: selectedVehicle, _name: name, _lat: p.lat, _lng: p.lng, _online: false }); if (error) { toast.error("Offline status save nahi hua"); setBusy(false); return; } }
    setOnline(false); setGps("Offline"); setBusy(false);
  };
  const respond = async (id: string, accept: boolean) => {
    setBusy(true);
    const { error } = await supabase.rpc("respond_cab_trip_offer", { _offer_id: id, _accept: accept });
    if (error) toast.error("Request expire ya unavailable hai; list refresh ho rahi hai");
    else { toast.success(accept ? "Ride accepted" : "Request declined"); if (accept) { setOnline(false); setGps("On a ride · Offline"); void qc.invalidateQueries({ queryKey: ["provider-bookings"] }); } }
    await refetch(); setBusy(false);
  };
  if (!vehicles.length && !ride) return null;
  const nav = ride ? (ride.ride_status === "started" ? `${ride.drop_lat},${ride.drop_lng}` : `${ride.pickup_lat},${ride.pickup_lng}`) : "";
  return <section className="mb-6 border-b border-border pb-5">
    {ride && <div className="mb-5 rounded-lg border-2 border-primary bg-primary/5 p-4">
      <p className="text-xs font-semibold uppercase text-primary">{{ accepted: "Customer ki taraf jaiye", arrived: "Pickup par intezaar · OTP lijiye", started: "Ride chal rahi hai" }[ride.ride_status]}</p>
      <p className="mt-1 text-lg font-bold">{ride.customer_name}</p>
      {ride.customer_phone && <a href={`tel:${ride.customer_phone}`} className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"><Phone className="size-4" />Call customer · {ride.customer_phone}</a>}
      <p className="mt-3 flex gap-2 text-sm"><MapPin className="size-4 shrink-0 text-success" /><span><b>Pickup:</b> {ride.pickup_label}</span></p>
      <p className="flex gap-2 text-sm"><MapPin className="size-4 shrink-0 text-destructive" /><span><b>Drop:</b> {ride.drop_label}</span></p>
      <p className="mt-2 text-sm font-bold">Cash ₹{Number(ride.fare).toLocaleString("en-IN")} · {Number(ride.road_km).toFixed(1)} km · {ride.booking_code}</p>
      <a href={`https://www.google.com/maps/dir/?api=1&destination=${nav}&travelmode=driving`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary underline"><Navigation className="size-4" />Navigate to {ride.ride_status === "started" ? "drop" : "pickup"}</a>
      {ride.ride_status === "accepted" && <Button className="mt-3 w-full" disabled={busy} onClick={() => void act("arrived")}>Pickup par pahunch gaya</Button>}
      {(ride.ride_status === "accepted" || ride.ride_status === "arrived") && <div className="mt-3 flex gap-2"><div className="relative flex-1"><KeyRound className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Ride OTP" inputMode="numeric" maxLength={4} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="Customer ka 4-digit OTP" className="pl-9" /></div><Button disabled={busy || otp.length !== 4} onClick={() => void act("start")}>Start ride</Button></div>}
      {ride.ride_status === "started" && <Button className="mt-3 w-full" disabled={busy} onClick={() => void act("complete")}>Complete ride</Button>}
      {ride.ride_status !== "started" && <Button variant="outline" className="mt-2 w-full" disabled={busy} onClick={() => void act("cancel")}>Cancel ride</Button>}
    </div>}
    <div className="mb-3 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold"><Navigation className="size-5 text-primary" />Cab driver</h2><Label className="flex items-center gap-2">{online ? "Online" : "Offline"}<Switch aria-label="Driver online" checked={online} disabled={busy} onCheckedChange={next => void toggle(next)} /></Label></div>
    <div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="cab-driver-name">Driver name</Label><Input id="cab-driver-name" value={name} disabled={online} onChange={e => setName(e.target.value)} placeholder="Driver ka poora naam" /></div><div><Label htmlFor="cab-driver-vehicle">Vehicle</Label><select id="cab-driver-vehicle" value={selectedVehicle} disabled={online} onChange={e => setVehicle(e.target.value)} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm">{vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_type} · {v.vehicle_number}</option>)}</select></div></div>
    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><LocateFixed className="size-3" />{gps}</p>
    {offers.map(o => <div key={o.id} className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4"><p className="font-bold">New ride · ₹{Number(o.fare).toLocaleString("en-IN")}</p><p className="mt-2 text-sm"><b>Pickup:</b> {o.pickup_label}</p><p className="text-sm"><b>Drop:</b> {o.drop_label}</p><p className="mt-2 text-xs text-muted-foreground">{Number(o.distance_km).toFixed(1)} km to pickup · {Number(o.road_km).toFixed(1)} km trip · offer expires {new Date(o.expires_at).toLocaleTimeString()}</p><div className="mt-3 flex gap-2"><Button variant="outline" disabled={busy} onClick={() => void respond(o.id, false)}>Decline</Button><Button disabled={busy} onClick={() => void respond(o.id, true)}>Accept ride</Button></div></div>)}
    {history.length > 0 && <details className="mt-5"><summary className="flex cursor-pointer items-center gap-2 text-sm font-bold"><History className="size-4 text-primary" />Ride history ({history.length})</summary>
      <ul className="mt-2 divide-y divide-border">{history.map(h => <li key={h.booking_code} className="py-2 text-sm"><div className="flex justify-between gap-2"><span className="font-semibold">{h.booking_code}</span><span className="font-bold">₹{Number(h.total_amount).toLocaleString("en-IN")}</span></div><p className="truncate text-xs text-muted-foreground">{h.pickup_location} → {h.drop_location}</p><p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("en-IN")} · {{ completed: "Completed", cancelled: "Cancelled", confirmed: "Accepted", team_assigned: "Arrived", setup_started: "On trip" }[h.status as string] ?? h.status}</p></li>)}</ul>
    </details>}
  </section>;
}