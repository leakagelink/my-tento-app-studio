import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ElementType } from "react";
import {
  ArrowLeft, Bell, CalendarDays, Check, ChevronRight, Clock3, Home as HomeIcon,
  IndianRupee, MapPin, Phone, Star, Store, TentTree, TrendingUp, WalletCards, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/provider")({
  head: () => ({
    meta: [
      { title: "Provider Panel | My Tento" },
      { name: "description", content: "My Tento provider panel demo — manage bookings, availability and earnings." },
      { property: "og:title", content: "Provider Panel | My Tento" },
      { property: "og:description", content: "Manage bookings, availability and earnings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProviderApp,
});

type Tab = "dashboard" | "bookings" | "calendar" | "earnings";

type ProviderBooking = {
  id: string; customer: string; phone: string; service: string; detail: string;
  date: string; time: string; area: string; amount: string; status: "new" | "confirmed" | "team" | "setup" | "done";
};

const initialBookings: ProviderBooking[] = [
  { id: "MT-261225-48", customer: "Dheeraj Tagde", phone: "+91 98••• ••210", service: "Tent booking", detail: "200 guests · shamiyana, stage, chairs", date: "25 Dec 2026", time: "6:00 PM", area: "Gomti Nagar, Lucknow", amount: "₹25,000", status: "confirmed" },
  { id: "MT-261102-31", customer: "Anita Verma", phone: "+91 93••• ••402", service: "Decoration booking", detail: "Stage flowers & lighting", date: "02 Nov 2026", time: "4:00 PM", area: "Aliganj, Lucknow", amount: "₹14,500", status: "new" },
  { id: "MT-261018-09", customer: "Sandeep Yadav", phone: "+91 87••• ••771", service: "Tent booking", detail: "150 guests · chairs & tables", date: "18 Oct 2026", time: "11:00 AM", area: "Indira Nagar, Lucknow", amount: "₹18,000", status: "done" },
];

const statusLabel: Record<ProviderBooking["status"], string> = {
  new: "NEW REQUEST", confirmed: "CONFIRMED", team: "TEAM ASSIGNED", setup: "SETUP STARTED", done: "COMPLETED",
};

function ProviderApp() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [bookings, setBookings] = useState(initialBookings);
  const [openId, setOpenId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, "free" | "booked">>({
    "Sat 26 Sep": "booked", "Sun 27 Sep": "free", "Mon 28 Sep": "free", "Tue 29 Sep": "booked", "Wed 30 Sep": "free", "Thu 01 Oct": "free",
  });
  const [paidOut, setPaidOut] = useState(false);

  const go = (next: Tab) => { setTab(next); setOpenId(null); window.scrollTo(0, 0); };
  const open = bookings.find((b) => b.id === openId) ?? null;
  const update = (id: string, status: ProviderBooking["status"]) =>
    setBookings((list) => list.map((b) => (b.id === id ? { ...b, status } : b)));

  const nextStatus: Partial<Record<ProviderBooking["status"], { label: string; next: ProviderBooking["status"] }>> = {
    new: { label: "Accept booking", next: "confirmed" },
    confirmed: { label: "Assign team", next: "team" },
    team: { label: "Start setup", next: "setup" },
    setup: { label: "Mark completed", next: "done" },
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Button variant="ghost" asChild className="h-auto gap-3 px-0 hover:bg-transparent">
            <Link to="/"><ArrowLeft className="size-5 text-foreground" /><span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><Store className="size-6" /></span><span className="font-display text-xl font-extrabold text-primary">my<span className="text-accent">Tento</span> <span className="text-sm font-bold text-muted-foreground">Provider</span></span></Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative rounded-full bg-secondary text-primary hover:bg-secondary/80"><Bell className="size-5" /><span className="absolute right-2 top-2 size-2 rounded-full bg-accent" /></Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {open ? (
          <BookingDetail booking={open} onNext={() => { const n = nextStatus[open.status]; if (n) update(open.id, n.next); else setOpenId(null); }} onClose={() => setOpenId(null)} />
        ) : tab === "dashboard" ? (
          <Dashboard bookings={bookings} onOpen={(id) => setOpenId(id)} />
        ) : tab === "bookings" ? (
          <Bookings bookings={bookings} onOpen={(id) => setOpenId(id)} />
        ) : tab === "calendar" ? (
          <Calendar availability={availability} setAvailability={setAvailability} />
        ) : (
          <Earnings paidOut={paidOut} onPayout={() => setPaidOut(true)} />
        )}
      </main>

      {!open && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card">
          <div className="mx-auto grid h-18 max-w-md grid-cols-4">
            <NavItem icon={HomeIcon} label="Dashboard" active={tab === "dashboard"} onClick={() => go("dashboard")} />
            <NavItem icon={CalendarDays} label="Bookings" active={tab === "bookings"} onClick={() => go("bookings")} />
            <NavItem icon={Clock3} label="Calendar" active={tab === "calendar"} onClick={() => go("calendar")} />
            <NavItem icon={WalletCards} label="Earnings" active={tab === "earnings"} onClick={() => go("earnings")} />
          </div>
        </nav>
      )}
    </div>
  );
}

function Dashboard({ bookings, onOpen }: { bookings: ProviderBooking[]; onOpen: (id: string) => void }) {
  const pending = bookings.filter((b) => b.status === "new");
  const upcoming = bookings.filter((b) => b.status === "confirmed" || b.status === "team");
  return (
    <div className="animate-rise-in">
      <div className="mb-6 flex items-center gap-4 rounded-lg border border-border bg-card p-5">
        <span className="grid size-14 place-items-center rounded-lg bg-brand-soft font-display font-bold text-primary">RT</span>
        <div className="flex-1"><h1 className="font-bold">Royal Tent House</h1><p className="flex items-center gap-1 text-sm text-muted-foreground"><Star className="size-3 fill-accent text-accent" /> 4.8 · Verified partner · Lucknow</p></div>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Bell} label="New requests" value={String(pending.length)} tone="text-accent" />
        <Stat icon={CalendarDays} label="Upcoming events" value={String(upcoming.length)} tone="text-primary" />
        <Stat icon={IndianRupee} label="This month" value="₹68,500" tone="text-primary" />
        <Stat icon={TrendingUp} label="Rating" value="4.8 ★" tone="text-accent" />
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
      <PageTitle title="My bookings" subtitle="All bookings assigned to Royal Tent House" />
      <div className="space-y-3">{bookings.map((b) => <RequestCard key={b.id} booking={b} onOpen={() => onOpen(b.id)} />)}</div>
    </div>
  );
}

function RequestCard({ booking, onOpen }: { booking: ProviderBooking; onOpen: () => void }) {
  const tone = booking.status === "new" ? "text-accent" : booking.status === "done" ? "text-muted-foreground" : "text-success";
  return (
    <button onClick={onOpen} className="flex w-full items-start gap-4 rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:shadow-sm">
      <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><TentTree className="size-6" /></span>
      <span className="min-w-0 flex-1">
        <span className={`text-xs font-bold ${tone}`}>{statusLabel[booking.status]}</span>
        <span className="mt-0.5 block font-bold">{booking.customer} · {booking.service}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{booking.date} · {booking.time} · {booking.area}</span>
      </span>
      <span className="text-right"><span className="block font-display font-bold text-primary">{booking.amount}</span><ChevronRight className="ml-auto mt-1 size-4 text-muted-foreground" /></span>
    </button>
  );
}

function BookingDetail({ booking, onNext, onClose }: { booking: ProviderBooking; onNext: () => void; onClose: () => void }) {
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
          <Button variant="outline" onClick={onClose}>{booking.status === "new" ? "Decline" : "Close"}</Button>
          <Button onClick={onNext}>{action ? action.label : "Completed"}</Button>
        </div>
      </div>
    </div>
  );
}

function Calendar({ availability, setAvailability }: { availability: Record<string, "free" | "booked">; setAvailability: (v: Record<string, "free" | "booked">) => void }) {
  return (
    <div className="animate-rise-in">
      <PageTitle title="Availability calendar" subtitle="Tap a date to mark it free or booked" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(availability).map(([day, state]) => (
          <button key={day} onClick={() => setAvailability({ ...availability, [day]: state === "free" ? "booked" : "free" })}
            className={`flex items-center justify-between rounded-lg border p-4 text-left transition ${state === "booked" ? "border-primary bg-secondary" : "border-border bg-card"}`}>
            <span><span className="block font-bold">{day}</span><span className="text-xs text-muted-foreground">October 2026</span></span>
            <span className={`flex items-center gap-1 text-xs font-bold ${state === "booked" ? "text-primary" : "text-success"}`}>{state === "booked" ? <><X className="size-3" /> Booked</> : <><Check className="size-3" /> Available</>}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Earnings({ paidOut, onPayout }: { paidOut: boolean; onPayout: () => void }) {
  return (
    <div className="animate-rise-in">
      <PageTitle title="Earnings" subtitle="Payouts and transactions" />
      <div className="rounded-lg bg-primary p-6 text-primary-foreground">
        <p className="text-sm text-primary-foreground/70">Available for payout</p>
        <p className="mt-1 font-display text-3xl font-extrabold">₹21,300</p>
        <Button onClick={onPayout} className="mt-5 bg-accent text-accent-foreground hover:bg-accent/90">{paidOut ? <><Check className="size-4" /> Payout requested</> : "Request payout"}</Button>
      </div>
      <section className="mt-6"><h2 className="mb-3 font-bold">This month</h2>
        <div className="grid grid-cols-2 gap-3"><Stat icon={TrendingUp} label="Total earned" value="₹68,500" tone="text-primary" /><Stat icon={IndianRupee} label="Service fee (8%)" value="− ₹5,480" tone="text-muted-foreground" /></div>
      </section>
      <section className="mt-6"><h2 className="mb-3 font-bold">Recent transactions</h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <Summary label="Booking MT-261225-48 · advance" value="+ ₹5,000" />
          <Summary label="Booking MT-261018-09 · full payment" value="+ ₹18,000" />
          <Summary label="Payout to bank ••4321" value="− ₹40,000" />
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: ElementType; label: string; value: string; tone: string }) {
  return <div className="rounded-lg border border-border bg-card p-4"><Icon className={`size-5 ${tone}`} /><p className="mt-3 font-display text-xl font-extrabold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div className="mb-6"><h1 className="text-2xl font-extrabold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>; }
function Summary({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className="flex items-center justify-between gap-4 py-2 text-sm"><span className="text-muted-foreground">{label}</span><span className={strong ? "font-display text-lg font-extrabold text-primary" : "text-right font-bold"}>{value}</span></div>; }
function NavItem({ icon: Icon, label, active = false, onClick }: { icon: ElementType; label: string; active?: boolean; onClick: () => void }) { return <Button variant="ghost" onClick={onClick} className={`h-full rounded-none flex-col gap-1 text-[11px] ${active ? "text-primary" : "text-muted-foreground"}`}><Icon className="size-5" />{label}</Button>; }
