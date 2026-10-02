import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({ redirect: typeof search["redirect"] === "string" && search["redirect"].startsWith("/") ? search["redirect"] : "/" }),
  head: () => ({ meta: [
    { title: "Sign in | MyTento" },
    { name: "description", content: "Sign in or create your MyTento account to manage bookings." },
    { property: "og:title", content: "Sign in | MyTento" },
    { property: "og:description", content: "Access your MyTento bookings and profile." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "").trim();
    if (mode === "forgot") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      setBusy(false);
      if (resetError) return setError(resetError.message);
      return setMessage("Password reset link sent. Please check your email.");
    }
    if (mode === "signup") {
      const { data, error: signupError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } } });
      setBusy(false);
      if (signupError) return setError(signupError.message);
      if (!data.session) return setMessage("Account created. Please confirm the link sent to your email, then sign in.");
    } else {
      const { error: signinError } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (signinError) return setError("Email or password is incorrect.");
    }
    await navigate({ to: redirect });
  }

  return <div className="min-h-svh bg-background px-4 py-6"><div className="mx-auto max-w-md"><Button variant="ghost" asChild className="px-0"><Link to="/"><ArrowLeft className="size-4" /> Back</Link></Button><div className="mt-8 text-center"><BrandLogo priority className="mx-auto size-20" /><h1 className="mt-4 font-display text-3xl font-extrabold text-logo">MyTento</h1><p className="mt-1 text-sm text-muted-foreground">Your celebrations, managed securely</p></div><form onSubmit={submit} className="mt-8 rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="text-xl font-extrabold">{mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Welcome back"}</h2><p className="mt-1 text-xs text-muted-foreground">{mode === "signup" ? "Save and track every booking" : mode === "forgot" ? "We will email you a secure reset link" : "Sign in to continue to MyTento"}</p>{mode === "signup" && <label className="mt-5 block text-xs font-bold">Full name<span className="mt-2 flex items-center gap-2 rounded-md border border-border px-3"><UserRound className="size-4 text-primary" /><input name="fullName" required className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" /></span></label>}<label className="mt-4 block text-xs font-bold">Email address<span className="mt-2 flex items-center gap-2 rounded-md border border-border px-3"><Mail className="size-4 text-primary" /><input name="email" type="email" autoComplete="email" required className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" /></span></label>{mode !== "forgot" && <label className="mt-4 block text-xs font-bold">Password<span className="mt-2 flex items-center gap-2 rounded-md border border-border px-3"><LockKeyhole className="size-4 text-primary" /><input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" /><Button type="button" variant="ghost" size="icon" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button></span></label>}{error && <p role="alert" className="mt-4 rounded-md bg-destructive/10 p-3 text-xs font-semibold text-destructive">{error}</p>}{message && <p className="mt-4 rounded-md bg-success/10 p-3 text-xs font-semibold text-success">{message}</p>}<Button type="submit" disabled={busy} className="mt-5 w-full">{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>{mode === "signin" && <Button type="button" variant="ghost" className="mt-2 w-full text-xs" onClick={() => { setMode("forgot"); setMessage(""); setError(""); }}>Forgot password?</Button>}<div className="mt-4 border-t border-border pt-4 text-center"><Button type="button" variant="ghost" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); setError(""); }}>{mode === "signup" ? "Already have an account? Sign in" : "New to MyTento? Create account"}</Button></div></form></div></div>;
}