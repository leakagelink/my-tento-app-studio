import { lazy, Suspense, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Car, CheckCircle2, KeyRound, LoaderCircle, MapPin, Navigation, Phone, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { advanceCabRequest, rideHeadline } from "@/lib/cab-dispatch";

const CabRideMap = lazy(() => import("@/components/cab-ride-map"));

function notify(title: string, body: string) {
  toast(title, { description: body });
  try { if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(title, { body }); } catch { /* ignore */ }
}

export function CabDispatchStatus({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const { data, error, refetch } = useQuery({
    queryKey: ["cab-dispatch", requestId],
    queryFn: () => advanceCabRequest(requestId),
    refetchInterval: q => { const d = q.state.data; if (!d || d.state === "searching") return 3000; if (d.state === "accepted" && d.ride_status !== "completed" && d.ride_status !== "cancelled") return 4000; return false; },
  });
  useEffect(() => { if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission(); }, []);
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (!data) return;
    const key = `${data.state}:${data.ride_status ?? ""}`;
    if (last.current && last.current !== key) {
      const n = data.driver?.name ?? "Driver";
      if (data.state === "accepted" && data.ride_status === "accepted") notify("Driver accepted", `${n} aapki taraf aa rahe hain. OTP: ${data.otp ?? ""}`);
      if (data.ride_status === "arrived") notify("Driver pahunch gaya", `Ride start karne ke liye OTP ${data.otp ?? ""} batayein`);
      if (data.ride_status === "started") notify("Ride started", `Drop: ${data.drop}`);
      if (data.ride_status === "completed") notify("Ride completed", `Cash ₹${Number(data.driver?.fare ?? 0).toLocaleString("en-IN")} driver ko dijiye`);
      if (data.ride_status === "cancelled") notify("Ride cancelled", "Driver ne ride cancel kar di");
      if (data.state === "no_driver") notify("No driver available", "Thodi der baad dobara try kariye");
    }
    last.current = key;
  }, [data]);

  const searching = !data || data.state === "searching";
  const live = data?.state === "accepted" && (data.ride_status === "accepted" || data.ride_status === "arrived" || data.ride_status === "started");
  const cancel = async () => {
    const { error } = searching
      ? await supabase.rpc("cancel_cab_trip_request", { _request_id: requestId })
      : await supabase.rpc("cab_ride_action", { _request_id: requestId, _action: "cancel" });
    if (error) { toast.error("Ride cancel nahi hui; dobara try kariye"); void refetch(); return; }
    if (searching) onClose(); else void refetch();
  };
  const d = data?.driver;
  const etaMin = d ? Math.max(1, Math.round(Number(d.distance_km) / 25 * 60 + 1)) : 0;
  const canCancel = searching || data?.ride_status === "accepted" || data?.ride_status === "arrived";

  return <section className="space-y-5 px-5 py-8" aria-live="polite">
    <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary/10 text-primary">{searching ? <LoaderCircle className="size-10 animate-spin motion-reduce:animate-none" /> : data.ride_status === "completed" ? <CheckCircle2 className="size-10" /> : <Car className="size-10" />}</div>
    <h1 className="text-center font-display text-2xl font-extrabold">{rideHeadline(data?.state, data?.ride_status)}</h1>
    {error ? <p className="text-center text-sm text-destructive">Connection mein dikkat hai. <Button variant="link" onClick={() => void refetch()}>Retry</Button></p>
      : searching ? <p className="text-center text-sm text-muted-foreground">{d ? "Nearest driver ke response ka intezaar…" : `Searching within ${data?.radius ?? 2} km…`}</p>
      : live && data.ride_status === "accepted" ? <p className="text-center text-sm font-semibold text-primary">Pahunchne me ~{etaMin} min · {Number(d?.distance_km ?? 0).toFixed(1)} km door</p>
      : live && data.ride_status === "started" ? <p className="text-center text-sm text-muted-foreground">Trip ~{Math.round(Number(data.trip_minutes ?? 0))} min · {Number(data.road_km ?? 0).toFixed(1)} km</p> : null}

    {live && data.otp && <div className="rounded-lg border-2 border-dashed border-primary bg-primary/5 p-4 text-center">
      <p className="flex items-center justify-center gap-1 text-xs font-semibold text-muted-foreground"><KeyRound className="size-4" />Ride OTP · driver ko batayein</p>
      <p className="mt-1 font-display text-4xl font-extrabold tracking-[0.4em] text-primary">{data.otp}</p>
    </div>}

    {live && data.pickup_coords && <div className="h-56 overflow-hidden rounded-lg border border-border">
      <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">Map loading…</div>}>
        <CabRideMap pickup={data.pickup_coords} drop={data.drop_coords ?? null} route={[]} onPick={() => undefined} drivers={d?.latitude != null ? [{ lat: Number(d.latitude), lng: Number(d.longitude), name: d.name }] : []} />
      </Suspense>
    </div>}

    {d && <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{searching ? "Request sent to" : "Your driver"}</p>
      <div className="mt-1 flex items-center justify-between gap-2"><p className="text-lg font-bold">{d.name}</p>{d.rating != null && <span className="flex items-center gap-1 text-sm font-semibold"><Star className="size-4 fill-current text-primary" />{Number(d.rating).toFixed(1)}</span>}</div>
      <p className="text-sm">{d.vehicle_type} · <b>{d.vehicle_number}</b></p>
      {d.business_name && <p className="text-xs text-muted-foreground">{d.business_name}</p>}
      {live && d.phone && <a href={`tel:${d.phone}`} className="mt-3 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"><Phone className="size-4" />Call driver · {d.phone}</a>}
      <p className="mt-3 flex items-center gap-1 border-t border-border pt-3 font-bold"><Navigation className="size-4 text-primary" />Cash · ₹{Number(d.fare).toLocaleString("en-IN")}</p>
    </div>}

    {data && <div className="space-y-2 text-sm"><p className="flex gap-2"><MapPin className="size-4 shrink-0 text-success" /><span><b>Pickup:</b> {data.pickup}</span></p><p className="flex gap-2"><MapPin className="size-4 shrink-0 text-destructive" /><span><b>Drop:</b> {data.drop}</span></p>{data.booking && <p><b>Booking:</b> {data.booking.code}</p>}</div>}

    {canCancel && <Button className="w-full" variant="outline" onClick={() => void cancel()}>{searching ? "Cancel search" : "Cancel ride"}</Button>}
    {!searching && <Button className="w-full" variant={live ? "ghost" : "default"} onClick={onClose}>{live ? "Minimize" : "Back to cab"}</Button>}
    {!searching && !live && <p className="text-center text-xs text-muted-foreground">Saari rides "Bookings" tab me history me dikhengi.</p>}
  </section>;
}
