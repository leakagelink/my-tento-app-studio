import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Set new password | MyTento" },
    { name: "description", content: "Securely set a new password for your MyTento account." },
    { property: "og:title", content: "Set new password | MyTento" },
    { property: "og:description", content: "Recover access to your MyTento account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const recovery = window.location.hash.includes("type=recovery") || new URLSearchParams(window.location.search).get("type") === "recovery";
    void supabase.auth.getSession().then(({ data }) => setReady(recovery || Boolean(data.session)));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) return setError(updateError.message);
    await navigate({ to: "/" });
  }
  return <div className="grid min-h-svh place-items-center bg-background px-4"><form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-border bg-card p-5 text-center"><BrandLogo className="mx-auto size-16" /><h1 className="mt-4 text-2xl font-extrabold">Set new password</h1>{ready ? <><label className="mt-5 flex items-center gap-2 rounded-md border border-border px-3 text-left"><LockKeyhole className="size-4 text-primary" /><input name="password" type="password" minLength={8} required placeholder="New password" className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>{error && <p role="alert" className="mt-3 text-xs font-semibold text-destructive">{error}</p>}<Button className="mt-5 w-full">Update password</Button></> : <p className="mt-4 text-sm text-muted-foreground">Open the password reset link from your email to continue.</p>}</form></div>;
}