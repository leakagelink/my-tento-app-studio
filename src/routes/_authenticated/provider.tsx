import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ElementType } from "react";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, Bell, CalendarDays, Check, ChevronRight, Clock3, Home as HomeIcon,
  IndianRupee, MapPin, Phone, Star, Store, TentTree, TrendingUp, WalletCards, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { RoleGate } from "@/components/role-gate";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/provider")({
  head: () => ({
    meta: [
      { title: "Provider Panel | My Tento" },
      { name: "description", content: "Manage My Tento bookings, availability and earnings." },
      { property: "og:title", content: "Provider Panel | My Tento" },
      { property: "og:description", content: "Manage bookings, availability and earnings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProviderApp,
});

type Tab = "dashboard" | "bookings" | "calendar" | "earnings" | "profile";

type ProviderBooking = {
  id: string; customer: string; phone: string; service: string; detail: string;
  date: string; time: string; area: string; amount: string; status: "new" | "confirmed" | "team" | "setup" | "done" | "declined";
};

const statusLabel: Record<ProviderBooking["status"], string> = {
  new: "NEW REQUEST", confirmed: "CONFIRMED", team: "TEAM ASSIGNED", setup: "SETUP STARTED", done: "COMPLETED", declined: "DECLINED",
};

function ProviderApp() {
  return <RoleGate role="provider"><ProviderPanel /></RoleGate>;
}

function ProviderPanel() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: providerProfile } = useQuery({ queryKey: ["provider-profile"], queryFn: async () => { const { data: auth } = await supabase.auth.getUser(); if (!auth.user) return null; const { data, error } = await supabase.from("providers").select("id,business_name,city,rating,verified").eq("owner_id", auth.user.id).maybeSingle(); if (error) throw error; return data; } });
  const { data: availability = [] } = useQuery({ queryKey: ["provider-availability", providerProfile?.id], enabled: Boolean(providerProfile?.id), queryFn: async () => { const { data, error } = await supabase.from("provider_availability").select("id,available_date,status").eq("provider_id", providerProfile?.id ?? "").order("available_date"); if (error) throw error; return data ?? []; } });
  const { data: liveBookings } = useQuery({ queryKey: ["provider-bookings"], queryFn: async () => { const { data: auth } = await supabase.auth.getUser(); if (!auth.user) return []; const { data: provider } = await supabase.from("providers").select("id").eq("owner_id", auth.user.id).maybeSingle(); if (!provider) return []; const { data, error } = await supabase.from("bookings").select("booking_code,booking_type,event_date,event_time,city,total_amount,status,guests").eq("provider_id", provider.id).order("created_at", { ascending: false }); if (error) throw error; return (data ?? []).map((row): ProviderBooking => { const statusMap: Record<string, ProviderBooking["status"]> = { pending: "new", confirmed: "confirmed", team_assigned: "team", setup_started: "setup", completed: "done", declined: "declined", cancelled: "declined" }; return { id: row.booking_code, customer: "MyTento customer", phone: "Shared after accept", service: `${row.booking_type} booking`, detail: `${row.guests} guests`, date: row.event_date, time: row.event_time, area: row.city, amount: `₹${Number(row.total_amount).toLocaleString("en-IN")}`, status: statusMap[row.status] ?? "new" }; }); } });
  useEffect(() => { setBookings(liveBookings ?? []); }, [liveBookings]);

  const go = (next: Tab) => { setTab(next); setOpenId(null); window.scrollTo(0, 0); };
  const open = bookings.find((b) => b.id === openId) ?? null;
  const update = async (id: string, status: ProviderBooking["status"]) => {
    const statusMap: Record<ProviderBooking["status"], "pending" | "confirmed" | "team_assigned" | "setup_started" | "completed" | "declined"> = { new: "pending", confirmed: "confirmed", team: "team_assigned", setup: "setup_started", done: "completed", declined: "declined" };
    const { error } = await supabase.from("bookings").update({ status: statusMap[status] }).eq("booking_code", id);
    if (error) { toast.error("Booking status could not be updated"); return; }
    setBookings((list) => list.map((booking) => booking.id === id ? { ...booking, status } : booking));
    await queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
    toast.success("Booking status updated");
  };

  const nextStatus: Partial<Record<ProviderBooking["status"], { label: string; next: ProviderBooking["status"] }>> = {
    new: { label: "Accept booking", next: "confirmed" },
    confirmed: { label: "Assign team", next: "team" },
    team: { label: "Start setup", next: "setup" },
    setup: { label: "Mark completed", next: "done" },
  };

  return (
    <div className="app-bottom-space min-h-svh min-w-0 bg-background">
      <header className="safe-top sticky top-0 z-30 border-b border-border/70 bg-card/95 backdrop-blur">
        <div className="mx-auto grid min-h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:flex sm:px-6">
          <Button variant="ghost" asChild className="h-auto min-w-0 justify-start gap-2 overflow-hidden px-0 hover:bg-transparent sm:gap-3">
             <Link to="/" className="min-w-0"><ArrowLeft className="size-5 shrink-0 text-foreground" /><BrandLogo priority className="size-11 max-[359px]:size-10" /><span className="min-w-0 truncate font-display text-lg font-extrabold text-logo sm:text-xl">MyTento <span className="mobile-compact-hide text-xs font-bold text-muted-foreground sm:text-sm">Provider</span></span></Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative rounded-full bg-secondary text-primary hover:bg-secondary/80"><Bell className="size-5" /><span className="absolute right-2 top-2 size-2 rounded-full bg-accent" /></Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {open ? (
          <BookingDetail booking={open} onNext={() => { const n = nextStatus[open.status]; if (n) void update(open.id, n.next); else setOpenId(null); }} onDecline={() => { void update(open.id, "declined"); setOpenId(null); }} onClose={() => setOpenId(null)} />
        ) : tab === "dashboard" ? (
          <Dashboard bookings={bookings} profile={providerProfile} onOpen={(id) => setOpenId(id)} />
        ) : tab === "bookings" ? (
          <Bookings bookings={bookings} onOpen={(id) => setOpenId(id)} />
        ) : tab === "calendar" ? (
          <Calendar availability={availability} />
        ) : tab === "earnings" ? (
          <Earnings bookings={bookings} />
        ) : (
          <ProviderProfile profile={providerProfile} />
        )}
      </main>

      {!open && (
        <nav className="safe-bottom app-bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card">
          <div className="mx-auto grid h-18 max-w-md grid-cols-5">
            <NavItem icon={HomeIcon} label="Dashboard" active={tab === "dashboard"} onClick={() => go("dashboard")} />
            <NavItem icon={CalendarDays} label="Bookings" active={tab === "bookings"} onClick={() => go("bookings")} />
            <NavItem icon={Clock3} label="Calendar" active={tab === "calendar"} onClick={() => go("calendar")} />
            <NavItem icon={WalletCards} label="Earnings" active={tab === "earnings"} onClick={() => go("earnings")} />
            <NavItem icon={Store} label="Profile" active={tab === "profile"} onClick={() => go("profile")} />
          </div>
        </nav>
      )}
    </div>
  );
}

function Dashboard({ bookings, profile, onOpen }: { bookings: ProviderBooking[]; profile: { business_name: string; city: string; rating: number; verified: boolean } | null | undefined; onOpen: (id: string) => void }) {
  const pending = bookings.filter((b) => b.status === "new");
  const upcoming = bookings.filter((b) => b.status === "confirmed" || b.status === "team");
  return (
    <div className="animate-rise-in">
      <div className="mb-6 flex items-center gap-4 rounded-lg border border-border bg-card p-5">
        <span className="grid size-14 place-items-center rounded-lg bg-brand-soft font-display font-bold text-primary">{profile?.business_name?.slice(0, 2).toUpperCase() || "MT"}</span>
        <div className="flex-1"><h1 className="font-bold">{profile?.business_name || "Provider profile"}</h1><p className="flex items-center gap-1 text-sm text-muted-foreground"><Star className="size-3 fill-accent text-accent" /> {profile ? `${Number(profile.rating).toFixed(1)} · ${profile.verified ? "Verified" : "Verification pending"} · ${profile.city}` : "No provider business linked to this account"}</p></div>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Bell} label="New requests" value={String(pending.length)} tone="text-accent" />
        <Stat icon={CalendarDays} label="Upcoming events" value={String(upcoming.length)} tone="text-primary" />
        <Stat icon={IndianRupee} label="Completed value" value={`₹${bookings.filter((b) => b.status === "done").reduce((sum, b) => sum + Number(b.amount.replace(/[^0-9]/g, "")), 0).toLocaleString("en-IN")}`} tone="text-primary" />
        <Stat icon={TrendingUp} label="Rating" value={profile ? `${Number(profile.rating).toFixed(1)} ★` : "—"} tone="text-accent" />
      </div>
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">New booking requests</h2>
        {pending.length === 0 ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">No new requests right now. New bookings will appear here.</p>
          : pending.map((b) => <RequestCard key={b.id} booking={b} onOpen={() => onOpen(b.id)} />)}
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">Upcoming events</h2>
        <div className="space-y-3">{upcoming.map((b) => <RequestCard key={b.id} booking={b} onOpen={() => onOpen(b.id)} />)}</div>
      </section>
    </div>
  );
}

function Bookings({ bookings, onOpen }: { bookings: ProviderBooking[]; onOpen: (id: string) => void }) {
  return (
    <div className="animate-rise-in">
      <PageTitle title="My bookings" subtitle="Bookings assigned to your provider account" />
      <div className="space-y-3">{bookings.length === 0 ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">No bookings assigned yet.</p> : bookings.map((b) => <RequestCard key={b.id} booking={b} onOpen={() => onOpen(b.id)} />)}</div>
    </div>
  );
}

function RequestCard({ booking, onOpen }: { booking: ProviderBooking; onOpen: () => void }) {
  const tone = booking.status === "new" ? "text-accent" : booking.status === "done" ? "text-muted-foreground" : "text-success";
  return (
    <button onClick={onOpen} className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary/40 hover:shadow-sm min-[380px]:grid-cols-[auto_minmax(0,1fr)_auto] min-[380px]:gap-4 min-[380px]:p-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><TentTree className="size-6" /></span>
      <span className="min-w-0 flex-1">
        <span className={`text-xs font-bold ${tone}`}>{statusLabel[booking.status]}</span>
        <span className="mt-0.5 block font-bold">{booking.customer} · {booking.service}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{booking.date} · {booking.time} · {booking.area}</span>
      </span>
      <span className="col-span-2 flex items-center justify-between text-right min-[380px]:col-span-1 min-[380px]:block"><span className="block font-display font-bold text-primary">{booking.amount}</span><ChevronRight className="ml-auto mt-1 size-4 text-muted-foreground" /></span>
    </button>
  );
}

function BookingDetail({ booking, onNext, onDecline, onClose }: { booking: ProviderBooking; onNext: () => void; onDecline: () => void; onClose: () => void }) {
  const action = { new: { label: "Accept booking", next: "CONFIRMED" }, confirmed: { label: "Assign team", next: "TEAM ASSIGNED" }, team: { label: "Start setup", next: "SETUP STARTED" }, setup: { label: "Mark completed", next: "COMPLETED" } }[booking.status as "new" | "confirmed" | "team" | "setup"];
  const stages: ProviderBooking["status"][] = ["confirmed", "team", "setup", "done"];
  return (
    <div className="mx-auto max-w-2xl animate-rise-in">
      <Button variant="ghost" size="sm" onClick={onClose} className="mb-4 px-0 text-primary"><ArrowLeft className="size-4" /> Back to panel</Button>
      <div className="rounded-lg border border-border bg-card p-5">
        <span className={`text-xs font-bold ${booking.status === "new" ? "text-accent" : "text-success"}`}>{statusLabel[booking.status]}</span>
        <h1 className="mt-1 text-xl font-extrabold">{booking.service} · {booking.id}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{booking.date} · {booking.time} · {booking.area}</p>
        <div className="my-4 border-t border-border" />
        <Summary label="Customer" value={booking.customer} />
        <Summary label="Requirements" value={booking.detail} />
        <Summary label="Package amount" value={booking.amount} strong />
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-secondary p-3"><Phone className="size-4 text-primary" /><span className="text-sm font-semibold">{booking.phone}</span><span className="ml-auto text-xs text-muted-foreground">Shared after accept</span></div>
        {booking.status !== "new" && (
          <div className="mt-5">
            <h3 className="font-bold">Job progress</h3>
            <div className="mt-3 space-y-3">{["Booking confirmed", "Team assigned", "Setup started", "Event completed"].map((label, i) => (
              <div key={label} className="flex gap-3"><span className={`mt-1 size-3 rounded-full ${i <= stages.indexOf(booking.status) - 1 ? "bg-success" : "bg-border"}`} /><div><p className="text-sm font-semibold">{label}</p><p className="text-xs text-muted-foreground">{i <= stages.indexOf(booking.status) - 1 ? "Done" : "Pending"}</p></div></div>
            ))}</div>
          </div>
        )}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={booking.status === "new" ? onDecline : onClose}>{booking.status === "new" ? "Decline request" : "Close"}</Button>
          <Button onClick={onNext}>{action ? action.label : "Completed"}</Button>
        </div>
      </div>
    </div>
  );
}

function Calendar({ availability }: { availability: { id: string; available_date: string; status: string }[] }) {
  return (
    <div className="animate-rise-in">
      <PageTitle title="Availability calendar" subtitle="Published availability for your business" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {availability.length === 0 ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">No availability dates published yet.</p> : availability.map((slot) => <div key={slot.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4"><span className="font-bold">{slot.available_date}</span><span className="text-xs font-bold text-primary">{slot.status}</span></div>)}
      </div>
    </div>
  );
}

function Earnings({ bookings }: { bookings: ProviderBooking[] }) {
  const completed = bookings.filter((booking) => booking.status === "done");
  const total = completed.reduce((sum, booking) => sum + Number(booking.amount.replace(/[^0-9]/g, "")), 0);
  return (
    <div className="animate-rise-in">
      <PageTitle title="Earnings" subtitle="Payouts and transactions" />
      <div className="rounded-lg bg-primary p-6 text-primary-foreground">
        <p className="text-sm text-primary-foreground/70">Completed booking value</p>
        <p className="mt-1 font-display text-3xl font-extrabold">₹{total.toLocaleString("en-IN")}</p>
      </div>
      <section className="mt-6"><h2 className="mb-3 font-bold">This month</h2>
        <div className="grid grid-cols-2 gap-3"><Stat icon={TrendingUp} label="Completed bookings" value={String(completed.length)} tone="text-primary" /><Stat icon={IndianRupee} label="Recorded value" value={`₹${total.toLocaleString("en-IN")}`} tone="text-muted-foreground" /></div>
      </section>
      <section className="mt-6"><h2 className="mb-3 font-bold">Recent transactions</h2>
        <div className="rounded-lg border border-border bg-card p-4">{completed.length === 0 ? <p className="text-sm text-muted-foreground">No completed booking records yet.</p> : completed.map((booking) => <Summary key={booking.id} label={booking.id} value={booking.amount} />)}</div>
      </section>
    </div>
  );
}

function ProviderProfile({ profile }: { profile: { business_name: string; city: string; rating: number; verified: boolean } | null | undefined }) { return <div className="animate-rise-in"><PageTitle title="Provider profile" subtitle="Business details saved in MyTento" />{profile ? <div className="rounded-lg border border-border bg-card p-5"><Summary label="Business" value={profile.business_name} /><Summary label="City" value={profile.city} /><Summary label="Verification" value={profile.verified ? "Verified" : "Pending"} /><Summary label="Rating" value={Number(profile.rating).toFixed(1)} /></div> : <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">No provider business is linked to this account.</p>}</div>; }

function Stat({ icon: Icon, label, value, tone }: { icon: ElementType; label: string; value: string; tone: string }) {
  return <div className="rounded-lg border border-border bg-card p-4"><Icon className={`size-5 ${tone}`} /><p className="mt-3 font-display text-xl font-extrabold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div className="mb-6"><h1 className="text-2xl font-extrabold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>; }
function Summary({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-start gap-3 py-2 text-sm"><span className="break-words text-muted-foreground">{label}</span><span className={`${strong ? "font-display text-base font-extrabold text-primary min-[360px]:text-lg" : "font-bold"} min-w-0 break-words text-right`}>{value}</span></div>; }
function NavItem({ icon: Icon, label, active = false, onClick }: { icon: ElementType; label: string; active?: boolean; onClick: () => void }) { return <Button variant="ghost" onClick={onClick} className={`mobile-compact-label h-full min-w-0 rounded-none px-1 flex-col gap-1 text-[11px] ${active ? "text-primary" : "text-muted-foreground"}`}><Icon className="size-5 shrink-0" /><span className="max-w-full truncate">{label}</span></Button>; }
