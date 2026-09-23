import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ElementType } from "react";
import {
  ArrowLeft, Bell, CalendarDays, Check, ChevronRight, IndianRupee, ShieldCheck,
  Store, TentTree, TrendingUp, UserRound, Users, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | My Tento" },
      { name: "description", content: "My Tento admin dashboard demo — bookings, providers, users and revenue." },
      { property: "og:title", content: "Admin Dashboard | My Tento" },
      { property: "og:description", content: "Bookings, providers, users and revenue at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminApp,
});

type Tab = "overview" | "providers" | "bookings" | "users";

type AdminBooking = { id: string; customer: string; provider: string; service: string; date: string; amount: string; status: "confirmed" | "completed" | "pending" };
type AdminProvider = { name: string; service: string; city: string; rating: string; verified: boolean; initials: string };
type AdminUser = { name: string; phone: string; city: string; bookings: number; initials: string };

const initialProviders: AdminProvider[] = [
  { name: "Royal Tent House", service: "Tent & stage", city: "Lucknow", rating: "4.8", verified: true, initials: "RT" },
  { name: "Shree Tent & Decor", service: "Tent & decoration", city: "Lucknow", rating: "4.7", verified: true, initials: "ST" },
  { name: "Celebration Events", service: "Full event package", city: "Kanpur", rating: "4.9", verified: false, initials: "CE" },
  { name: "Goel Caterers", service: "Catering & bartan", city: "Lucknow", rating: "4.6", verified: false, initials: "GC" },
];

const bookings: AdminBooking[] = [
  { id: "MT-261225-48", customer: "Dheeraj Tagde", provider: "Royal Tent House", service: "Tent", date: "25 Dec 2026", amount: "₹25,000", status: "confirmed" },
  { id: "MT-261102-31", customer: "Anita Verma", provider: "Shree Tent & Decor", service: "Decoration", date: "02 Nov 2026", amount: "₹14,500", status: "pending" },
  { id: "MT-261018-09", customer: "Sandeep Yadav", provider: "Royal Tent House", service: "Tent", date: "18 Oct 2026", amount: "₹18,000", status: "completed" },
  { id: "MT-261005-77", customer: "Pooja Singh", provider: "Celebration Events", service: "Catering", date: "05 Oct 2026", amount: "₹32,000", status: "completed" },
];

const users: AdminUser[] = [
  { name: "Dheeraj Tagde", phone: "+91 98••• ••210", city: "Lucknow", bookings: 3, initials: "DT" },
  { name: "Anita Verma", phone: "+91 93••• ••402", city: "Lucknow", bookings: 1, initials: "AV" },
  { name: "Sandeep Yadav", phone: "+91 87••• ••771", city: "Barabanki", bookings: 2, initials: "SY" },
  { name: "Pooja Singh", phone: "+91 90••• ••118", city: "Kanpur", bookings: 5, initials: "PS" },
];

function AdminApp() {
  const [tab, setTab] = useState<Tab>("overview");
  const [providers, setProviders] = useState(initialProviders);

  const toggle = (name: string) => setProviders((list) => list.map((p) => (p.name === name ? { ...p, verified: !p.verified } : p)));
  const go = (next: Tab) => { setTab(next); window.scrollTo(0, 0); };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Button variant="ghost" asChild className="h-auto gap-3 px-0 hover:bg-transparent">
            <Link to="/"><ArrowLeft className="size-5 text-foreground" /><span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="size-6" /></span><span className="font-display text-xl font-extrabold text-primary">my<span className="text-accent">Tento</span> <span className="text-sm font-bold text-muted-foreground">Admin</span></span></Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative rounded-full bg-secondary text-primary hover:bg-secondary/80"><Bell className="size-5" /><span className="absolute right-2 top-2 size-2 rounded-full bg-accent" /></Button>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
          {([["overview", "Overview"], ["providers", "Providers"], ["bookings", "Bookings"], ["users", "Users"]] as [Tab, string][]).map(([id, label]) => (
            <Button key={id} variant="ghost" size="sm" onClick={() => go(id)} className={`rounded-b-none border-b-2 ${tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{label}</Button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {tab === "overview" && <Overview />}
        {tab === "providers" && <Providers providers={providers} onToggle={toggle} />}
        {tab === "bookings" && <Bookings />}
        {tab === "users" && <Users />}
      </main>
    </div>
  );
}

function Overview() {
  return (
    <div className="animate-rise-in">
      <div className="mb-6"><h1 className="text-2xl font-extrabold">Platform overview</h1><p className="mt-1 text-sm text-muted-foreground">Live mock data — Lucknow region, September 2026</p></div>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={CalendarDays} label="Total bookings" value="1,284" tone="text-primary" sub="+124 this month" />
        <Stat icon={Store} label="Active providers" value="86" tone="text-accent" sub="12 pending verify" />
        <Stat icon={IndianRupee} label="Revenue (Sept)" value="₹9.4L" tone="text-primary" sub="₹75K platform fee" />
        <Stat icon={Users} label="App users" value="5,730" tone="text-accent" sub="+410 this week" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section><h2 className="mb-3 text-lg font-bold">Latest bookings</h2>
          <div className="space-y-3">{bookings.slice(0, 3).map((b) => <BookingRow key={b.id} booking={b} />)}</div>
        </section>
        <section><h2 className="mb-3 text-lg font-bold">Provider approvals waiting</h2>
          <div className="rounded-lg border border-border bg-card p-4">
            {initialProviders.filter((p) => !p.verified).map((p) => (
              <div key={p.name} className="flex items-center gap-3 py-2"><span className="grid size-10 place-items-center rounded-lg bg-brand-soft font-display text-xs font-bold text-primary">{p.initials}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{p.name}</p><p className="text-xs text-muted-foreground">{p.service} · {p.city}</p></div><span className="text-xs font-bold text-accent">Pending</span></div>
            ))}
            <p className="mt-2 text-xs text-muted-foreground">Verify from the Providers tab.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Providers({ providers, onToggle }: { providers: AdminProvider[]; onToggle: (name: string) => void }) {
  return (
    <div className="animate-rise-in">
      <div className="mb-6"><h1 className="text-2xl font-extrabold">Providers</h1><p className="mt-1 text-sm text-muted-foreground">Verify partners and manage listings</p></div>
      <div className="space-y-3">
        {providers.map((p) => (
          <div key={p.name} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-brand-soft font-display text-sm font-bold text-primary">{p.initials}</span>
            <div className="min-w-0 flex-1"><p className="truncate font-bold">{p.name}</p><p className="text-xs text-muted-foreground">{p.service} · {p.city} · ★ {p.rating}</p></div>
            <Button variant={p.verified ? "outline" : "default"} size="sm" onClick={() => onToggle(p.name)}>
              {p.verified ? <><Check className="size-4" /> Verified</> : <><X className="size-4" /> Verify</>}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bookings() {
  return (
    <div className="animate-rise-in">
      <div className="mb-6"><h1 className="text-2xl font-extrabold">Bookings</h1><p className="mt-1 text-sm text-muted-foreground">All customer bookings across providers</p></div>
      <div className="space-y-3">{bookings.map((b) => <BookingRow key={b.id} booking={b} />)}</div>
    </div>
  );
}

function BookingRow({ booking }: { booking: AdminBooking }) {
  const tone = booking.status === "confirmed" ? "text-success" : booking.status === "pending" ? "text-accent" : "text-muted-foreground";
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><TentTree className="size-6" /></span>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-bold ${tone}`}>{booking.status.toUpperCase()}</p>
        <p className="mt-0.5 truncate text-sm font-bold">{booking.service} · {booking.id}</p>
        <p className="text-xs text-muted-foreground">{booking.customer} → {booking.provider} · {booking.date}</p>
      </div>
      <span className="font-display text-sm font-extrabold text-primary">{booking.amount}</span>
    </div>
  );
}

function Users() {
  return (
    <div className="animate-rise-in">
      <div className="mb-6"><h1 className="text-2xl font-extrabold">Users</h1><p className="mt-1 text-sm text-muted-foreground">Registered customers on the platform</p></div>
      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.name} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-soft font-display text-sm font-bold text-primary">{u.initials}</span>
            <div className="min-w-0 flex-1"><p className="truncate font-bold">{u.name}</p><p className="text-xs text-muted-foreground">{u.phone} · {u.city}</p></div>
            <div className="flex items-center gap-1 text-sm font-bold text-primary"><UserRound className="size-4" /> {u.bookings}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone, sub }: { icon: ElementType; label: string; value: string; tone: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Icon className={`size-5 ${tone}`} />
      <p className="mt-3 font-display text-xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="mt-1 flex items-center gap-1 text-xs font-bold text-success"><TrendingUp className="size-3" /> {sub}</p>}
    </div>
  );
}

function ChevronHint() { return <ChevronRight className="size-4 text-muted-foreground" />; }
void ChevronHint;
