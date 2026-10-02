import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function RoleGate({ role, children }: { role: "admin" | "provider"; children: ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    void supabase.rpc("has_role", { _user_id: undefined, _role: role }).then(async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return setAllowed(false);
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id).eq("role", role).maybeSingle();
      setAllowed(Boolean(data));
    });
  }, [role]);

  if (allowed === null) return <div className="grid min-h-svh place-items-center bg-background"><div className="size-10 animate-spin rounded-full border-4 border-secondary border-t-primary" /></div>;
  if (!allowed) return <div className="grid min-h-svh place-items-center bg-background px-5"><div className="max-w-sm text-center"><ShieldAlert className="mx-auto size-12 text-primary" /><h1 className="mt-4 text-2xl font-extrabold">Access not available</h1><p className="mt-2 text-sm text-muted-foreground">This account does not have {role} access.</p><Button asChild className="mt-5"><Link to="/">Back to MyTento</Link></Button></div></div>;
  return children;
}