import { useQuery } from "@tanstack/react-query";
import { Car, LoaderCircle, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { advanceCabRequest } from "@/lib/cab-dispatch";

export function CabDispatchStatus({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const { data, error, refetch } = useQuery({ queryKey: ["cab-dispatch", requestId], queryFn: () => advanceCabRequest(requestId), refetchInterval: q => q.state.data?.state === "searching" || !q.state.data ? 3000 : q.state.data?.state === "accepted" ? 10000 : false });
  const cancel = async () => {
    const { error } = await supabase.rpc("cancel_cab_trip_request", { _request_id: requestId });
    if (error) { toast.error("Request cancel nahi hui; dobara try kariye"); void refetch(); return; }
    onClose();
  };
  const searching = !data || data.state === "searching";
  return <section className="space-y-5 px-5 py-8" aria-live="polite">
    <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary/10 text-primary">{searching ? <LoaderCircle className="size-10 animate-spin motion-reduce:animate-none" /> : <Car className="size-10" />}</div>
    <h1 className="text-center font-display text-2xl font-extrabold">{searching ? "Finding your driver" : data.state === "accepted" ? (data.booking?.status === "completed" ? "Ride completed" : "Driver accepted your ride") : data.state === "no_driver" ? "No driver available" : "Request cancelled"}</h1>
    {error ? <p className="text-center text-sm text-destructive">Connection mein dikkat hai. <Button variant="link" onClick={() => void refetch()}>Retry</Button></p> : searching ? <p className="text-center text-sm text-muted-foreground">{data?.driver ? "Nearest driver ke response ka intezaar…" : `Searching within ${data?.radius ?? 2} km…`}</p> : null}
    {data?.driver && <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{searching ? "Request sent to" : "Your driver"}</p>
      <p className="mt-1 text-lg font-bold">{data.driver.name}</p>
      <p className="text-sm">{data.driver.vehicle_type} · {data.driver.vehicle_number}</p>
      <p className="mt-2 flex items-center gap-1 text-sm text-primary"><Navigation className="size-4" />{Number(data.driver.distance_km).toFixed(1)} km away · estimated {Math.round(Number(data.driver.distance_km) / 25 * 60 + 2)} min</p>
      <p className="mt-3 border-t border-border pt-3 font-bold">Cash · ₹{Number(data.driver.fare).toLocaleString("en-IN")}</p>
    </div>}
    {data && <div className="space-y-2 text-sm"><p><b>Pickup:</b> {data.pickup}</p><p><b>Drop:</b> {data.drop}</p>{data.booking && <p><b>Booking:</b> {data.booking.code}</p>}</div>}
    <Button className="w-full" variant={searching ? "outline" : "default"} onClick={searching ? () => void cancel() : onClose}>{searching ? "Cancel search" : "Back to cab"}</Button>
  </section>;
}