import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function RoleGate({ role, children }: { role: "admin" | "provider"; children: ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [check, setCheck] = useState(0);

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return setAllowed(false);
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id).eq("role", role).maybeSingle();
      setAllowed(Boolean(data));
    })();
  }, [role, check]);

  if (allowed === null) return <div className="grid min-h-svh place-items-center bg-background"><div className="size-10 animate-spin rounded-full border-4 border-secondary border-t-primary" /></div>;
  if (!allowed && role === "provider") return <ProviderJoin onJoined={() => { setAllowed(null); setCheck((c) => c + 1); }} />;
  if (!allowed) return <div className="grid min-h-svh place-items-center bg-background px-5"><div className="max-w-sm text-center"><ShieldAlert className="mx-auto size-12 text-primary" /><h1 className="mt-4 text-2xl font-extrabold">Access not available</h1><p className="mt-2 text-sm text-muted-foreground">This account does not have {role} access.</p><Button asChild className="mt-5"><Link to="/">Back to MyTento</Link></Button></div></div>;
  return children;
}

function ProviderJoin({ onJoined }: { onJoined: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const f = new FormData(event.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const { error: rpcError } = await supabase.rpc("register_provider", { _business_name: v("business"), _phone: v("phone"), _city: v("city"), _area: v("area"), _description: v("description") });
    setBusy(false);
    if (rpcError) return setError(rpcError.message);
    onJoined();
  }

  const field = "mt-2 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary";
  return <div className="min-h-svh bg-background px-4 py-6"><div className="mx-auto max-w-md"><Button variant="ghost" asChild className="px-0"><Link to="/">← Back</Link></Button><div className="mt-6 text-center"><Store className="mx-auto size-12 text-primary" /><h1 className="mt-3 font-display text-2xl font-extrabold">Join MyTento as a provider</h1><p className="mt-1 text-sm text-muted-foreground">Register your business. Admin will verify it before customers can see your services.</p></div><form onSubmit={submit} className="mt-6 space-y-3 rounded-lg border border-border bg-card p-5 shadow-sm"><label className="block text-xs font-bold">Business name<input name="business" required minLength={2} className={field} /></label><label className="block text-xs font-bold">Phone number<input name="phone" type="tel" required minLength={6} className={field} /></label><label className="block text-xs font-bold">City<input name="city" required minLength={2} className={field} /></label><label className="block text-xs font-bold">Area<input name="area" className={field} /></label><label className="block text-xs font-bold">About your business<textarea name="description" rows={3} className={field} /></label>{error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-xs font-semibold text-destructive">{error}</p>}<Button type="submit" disabled={busy} className="w-full">{busy ? "Please wait…" : "Register as provider"}</Button></form></div></div>;
}
