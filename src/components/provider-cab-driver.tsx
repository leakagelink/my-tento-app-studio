import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LocateFixed, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import type { CabOffer } from "@/lib/cab-dispatch";

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
  if (!vehicles.length) return null;
  return <section className="mb-6 border-b border-border pb-5">
    <div className="mb-3 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold"><Navigation className="size-5 text-primary" />Cab driver</h2><Label className="flex items-center gap-2">{online ? "Online" : "Offline"}<Switch aria-label="Driver online" checked={online} disabled={busy} onCheckedChange={next => void toggle(next)} /></Label></div>
    <div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="cab-driver-name">Driver name</Label><Input id="cab-driver-name" value={name} disabled={online} onChange={e => setName(e.target.value)} placeholder="Driver ka poora naam" /></div><div><Label htmlFor="cab-driver-vehicle">Vehicle</Label><select id="cab-driver-vehicle" value={selectedVehicle} disabled={online} onChange={e => setVehicle(e.target.value)} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm">{vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_type} · {v.vehicle_number}</option>)}</select></div></div>
    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><LocateFixed className="size-3" />{gps}</p>
    {offers.map(o => <div key={o.id} className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4"><p className="font-bold">New ride · ₹{Number(o.fare).toLocaleString("en-IN")}</p><p className="mt-2 text-sm"><b>Pickup:</b> {o.pickup_label}</p><p className="text-sm"><b>Drop:</b> {o.drop_label}</p><p className="mt-2 text-xs text-muted-foreground">{Number(o.distance_km).toFixed(1)} km to pickup · {Number(o.road_km).toFixed(1)} km trip · offer expires {new Date(o.expires_at).toLocaleTimeString()}</p><div className="mt-3 flex gap-2"><Button variant="outline" disabled={busy} onClick={() => void respond(o.id, false)}>Decline</Button><Button disabled={busy} onClick={() => void respond(o.id, true)}>Accept ride</Button></div></div>)}
  </section>;
}