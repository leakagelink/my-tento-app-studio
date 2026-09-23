import { createFileRoute } from "@tanstack/react-router";
import { useState, type ElementType, type ReactNode } from "react";
import {
  ArrowLeft, Bell, CalendarDays, Car, Check, ChevronDown, Clock3, Home,
  MapPin, Minus, PartyPopper, Plus, Search, ShieldCheck, Sparkles,
  Star, Store, TentTree, UserRound, UtensilsCrossed, WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Tento | Event Services, One Platform" },
      { name: "description", content: "Book tents, decoration, catering and cabs for your event with trusted local providers." },
      { property: "og:title", content: "My Tento | Event Services, One Platform" },
      { property: "og:description", content: "Book trusted event services in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type ServiceName = "Tent" | "Decoration" | "Catering" | "Cab";
type Step = "home" | "details" | "providers" | "payment" | "success";

const services: { name: ServiceName; subtitle: string; icon: ElementType; tone: string }[] = [
  { name: "Tent", subtitle: "Tent, chairs & stage", icon: TentTree, tone: "bg-brand-soft text-primary" },
  { name: "Decoration", subtitle: "Stage, flowers & lights", icon: Sparkles, tone: "bg-warm-soft text-accent" },
  { name: "Catering", subtitle: "Staff, utensils & meals", icon: UtensilsCrossed, tone: "bg-secondary text-primary" },
  { name: "Cab", subtitle: "Pickup, drop & baraat", icon: Car, tone: "bg-warm-soft text-accent" },
];

const providers = [
  { name: "Royal Tent House", detail: "Up to 200 guests", price: "₹25,000", rating: "4.8", initials: "RT" },
  { name: "Shree Tent & Decor", detail: "Up to 200 guests", price: "₹20,000", rating: "4.7", initials: "ST" },
  { name: "Celebration Events", detail: "Up to 250 guests", price: "₹28,500", rating: "4.9", initials: "CE" },
];

function Index() {
  const [step, setStep] = useState<Step>("home");
  const [service, setService] = useState<ServiceName>("Tent");
  const [guests, setGuests] = useState(200);
  const [provider, setProvider] = useState(0);
  const chosenProvider = providers[provider] ?? providers[0];

  const beginBooking = (name: ServiceName) => { setService(name); setStep("details"); window.scrollTo(0, 0); };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button aria-label={step === "home" ? "My Tento home" : "Go back"} onClick={() => step === "home" ? undefined : setStep(step === "details" ? "home" : step === "providers" ? "details" : "providers")} className="flex items-center gap-3">
            {step !== "home" && <ArrowLeft className="size-5 text-foreground" />}
            <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><TentTree className="size-6" /></span>
            <span className="font-display text-xl font-extrabold text-primary">my<span className="text-accent">Tento</span></span>
          </button>
          <button aria-label="Notifications" className="relative grid size-10 place-items-center rounded-full bg-secondary text-primary"><Bell className="size-5" /><span className="absolute right-2 top-2 size-2 rounded-full bg-accent" /></button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {step === "home" && <HomeScreen onBook={beginBooking} />}
        {step === "details" && <DetailsScreen service={service} guests={guests} setGuests={setGuests} onContinue={() => setStep("providers")} />}
        {step === "providers" && <ProvidersScreen selected={provider} setSelected={setProvider} onContinue={() => setStep("payment")} />}
        {step === "payment" && chosenProvider && <PaymentScreen service={service} guests={guests} provider={chosenProvider} onConfirm={() => setStep("success")} />}
        {step === "success" && chosenProvider && <SuccessScreen provider={chosenProvider} onHome={() => setStep("home")} />}
      </main>

      {step === "home" && <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card"><div className="mx-auto grid h-18 max-w-md grid-cols-4">
        <NavItem icon={Home} label="Home" active /><NavItem icon={CalendarDays} label="Bookings" /><NavItem icon={WalletCards} label="Wallet" /><NavItem icon={UserRound} label="Profile" />
      </div></nav>}
    </div>
  );
}

function HomeScreen({ onBook }: { onBook: (name: ServiceName) => void }) {
  return <div className="animate-rise-in">
    <section className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div><p className="mb-1 text-sm font-semibold text-muted-foreground">Good morning, Dheeraj</p><h1 className="max-w-xl text-3xl font-extrabold leading-tight sm:text-4xl">Everything for your event, <span className="text-primary">in one place.</span></h1></div>
      <button className="flex min-w-64 items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left shadow-sm"><MapPin className="size-5 text-accent" /><span className="flex-1"><span className="block text-xs text-muted-foreground">Your location</span><span className="font-bold">Lucknow, Uttar Pradesh</span></span><ChevronDown className="size-4" /></button>
    </section>
    <section className="mb-8"><div className="mb-4 flex items-end justify-between"><div><p className="text-sm font-bold text-accent">BOOK YOUR EVENT</p><h2 className="text-xl font-bold">What do you need?</h2></div><button className="text-sm font-bold text-primary">View all</button></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{services.map(({ name, subtitle, icon: Icon, tone }) => <button key={name} onClick={() => onBook(name)} className="group rounded-lg border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"><span className={`mb-5 grid size-12 place-items-center rounded-lg ${tone}`}><Icon className="size-6" /></span><h3 className="font-bold">{name}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p></button>)}</div>
    </section>
    <section className="mb-8 overflow-hidden rounded-lg bg-primary p-6 text-primary-foreground md:flex md:items-center md:justify-between md:p-8"><div><p className="mb-2 text-xs font-extrabold uppercase text-primary-foreground/70">Wedding season special</p><h2 className="max-w-md text-2xl font-bold">Planning a marriage?</h2><p className="mt-2 max-w-md text-sm text-primary-foreground/75">Book tent, decoration, catering and cabs together with trusted providers.</p></div><Button onClick={() => onBook("Tent")} className="mt-5 bg-accent text-accent-foreground shadow-none hover:bg-accent/90 md:mt-0">Plan my event <PartyPopper className="size-4" /></Button></section>
    <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Top providers near you</h2><button className="text-sm font-bold text-primary">See all</button></div><div className="grid gap-3 md:grid-cols-3">{providers.map((item) => <article key={item.name} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"><span className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary font-display text-sm font-bold text-primary">{item.initials}</span><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold">{item.name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Star className="size-3 fill-accent text-accent" /> {item.rating} · Lucknow</p></div><span className="text-xs font-bold text-primary">View</span></article>)}</div></section>
  </div>;
}

function DetailsScreen({ service, guests, setGuests, onContinue }: { service: ServiceName; guests: number; setGuests: (n: number) => void; onContinue: () => void }) {
  return <div className="mx-auto max-w-2xl animate-rise-in"><StepTitle step="1 of 3" title={`${service} booking`} subtitle="Tell us about your event" />
    <div className="space-y-5 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7"><Field icon={MapPin} label="Event location"><div className="font-semibold">Gomti Nagar, Lucknow</div></Field><div className="grid gap-4 sm:grid-cols-2"><Field icon={CalendarDays} label="Event date"><input aria-label="Event date" type="date" defaultValue="2026-12-25" className="w-full bg-transparent font-semibold outline-none" /></Field><Field icon={Clock3} label="Start time"><input aria-label="Start time" type="time" defaultValue="18:00" className="w-full bg-transparent font-semibold outline-none" /></Field></div><div><label className="mb-2 block text-sm font-bold">Number of guests</label><div className="flex items-center justify-between rounded-lg border border-border p-3"><div><p className="font-bold">{guests} guests</p><p className="text-xs text-muted-foreground">We’ll show suitable packages</p></div><div className="flex items-center gap-3"><button aria-label="Remove guests" onClick={() => setGuests(Math.max(50, guests - 50))} className="grid size-9 place-items-center rounded-md bg-secondary text-primary"><Minus className="size-4" /></button><button aria-label="Add guests" onClick={() => setGuests(guests + 50)} className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><Plus className="size-4" /></button></div></div></div><Button onClick={onContinue} className="w-full">Find available providers <Search className="size-4" /></Button></div>
  </div>;
}

function ProvidersScreen({ selected, setSelected, onContinue }: { selected: number; setSelected: (n: number) => void; onContinue: () => void }) {
  return <div className="mx-auto max-w-2xl animate-rise-in"><StepTitle step="2 of 3" title="Choose a provider" subtitle="3 trusted providers available" /><div className="space-y-3">{providers.map((item, index) => <button key={item.name} onClick={() => setSelected(index)} className={`flex w-full items-center gap-4 rounded-lg border bg-card p-4 text-left transition ${selected === index ? "border-primary ring-2 ring-primary/15" : "border-border"}`}><span className="grid size-14 shrink-0 place-items-center rounded-lg bg-brand-soft font-display font-bold text-primary">{item.initials}</span><span className="min-w-0 flex-1"><span className="block font-bold">{item.name}</span><span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Star className="size-3 fill-accent text-accent" /> {item.rating} · Verified provider</span><span className="mt-2 block text-xs text-muted-foreground">Tent, chairs, tables & shamiyana</span></span><span className="text-right"><span className="block font-display font-bold text-primary">{item.price}</span><span className="text-xs text-muted-foreground">package</span>{selected === index && <Check className="ml-auto mt-2 size-5 text-success" />}</span></button>)}</div><Button onClick={onContinue} className="mt-5 w-full">Continue to payment</Button></div>;
}

function PaymentScreen({ service, guests, provider, onConfirm }: { service: ServiceName; guests: number; provider: (typeof providers)[number]; onConfirm: () => void }) {
  const [pay, setPay] = useState("advance");
  const methods = [{ id: "advance", label: "Pay 20% advance online" }, { id: "cash", label: "Cash / pay provider" }];
  return <div className="mx-auto max-w-2xl animate-rise-in"><StepTitle step="3 of 3" title="Confirm & pay" subtitle="Review your booking details" /><div className="rounded-lg border border-border bg-card p-5"><h3 className="mb-4 font-bold">Booking summary</h3><Summary label="Service" value={service} /><Summary label="Provider" value={provider.name} /><Summary label="Date & time" value="25 Dec 2026 · 6:00 PM" /><Summary label="Guests" value={`${guests}`} /><div className="mt-4 border-t border-border pt-4"><Summary label="Package total" value={provider.price} strong /></div></div><div className="mt-4 rounded-lg border border-border bg-card p-5"><h3 className="mb-3 font-bold">Payment method</h3>{methods.map(({ id, label }) => <button key={id} onClick={() => setPay(id)} className={`mb-2 flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm font-semibold ${pay === id ? "border-primary bg-secondary" : "border-border"}`}><span className={`grid size-5 place-items-center rounded-full border ${pay === id ? "border-primary" : "border-border"}`}>{pay === id && <span className="size-2.5 rounded-full bg-primary" />}</span>{label}</button>)}</div><div className="mt-4 flex gap-3 rounded-lg bg-brand-soft p-4 text-sm text-primary"><ShieldCheck className="size-5 shrink-0" /><p>Your booking is protected. Provider details are shared after confirmation.</p></div><Button onClick={onConfirm} className="mt-5 w-full">Confirm booking</Button></div>;
}

function SuccessScreen({ provider, onHome }: { provider: (typeof providers)[number]; onHome: () => void }) {
  return <div className="mx-auto max-w-lg animate-rise-in py-10 text-center"><span className="mx-auto grid size-20 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-10" /></span><p className="mt-6 text-sm font-bold text-success">BOOKING CONFIRMED</p><h1 className="mt-2 text-3xl font-extrabold">Your event is in good hands.</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{provider.name} has received your booking. Confirmation was sent by WhatsApp, SMS and app notification.</p><div className="mt-7 rounded-lg border border-border bg-card p-5 text-left"><Summary label="Booking ID" value="MT-261225-48" /><Summary label="Provider" value={provider.name} /><Summary label="Event date" value="25 Dec 2026" /></div><Button onClick={onHome} className="mt-5 w-full">Back to home</Button></div>;
}

function StepTitle({ step, title, subtitle }: { step: string; title: string; subtitle: string }) { return <div className="mb-6"><p className="text-xs font-extrabold uppercase text-accent">{step}</p><h1 className="mt-1 text-2xl font-extrabold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full bg-primary ${step.startsWith("1") ? "w-1/3" : step.startsWith("2") ? "w-2/3" : "w-full"}`} /></div></div>; }
function Field({ icon: Icon, label, children }: { icon: ElementType; label: string; children: ReactNode }) { return <div><label className="mb-2 block text-sm font-bold">{label}</label><div className="flex items-center gap-3 rounded-lg border border-border p-3"><Icon className="size-5 text-primary" /><div className="min-w-0 flex-1 text-sm">{children}</div></div></div>; }
function Summary({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className="flex items-center justify-between gap-4 py-2 text-sm"><span className="text-muted-foreground">{label}</span><span className={strong ? "font-display text-lg font-extrabold text-primary" : "text-right font-bold"}>{value}</span></div>; }
function NavItem({ icon: Icon, label, active = false }: { icon: ElementType; label: string; active?: boolean }) { return <button className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${active ? "text-primary" : "text-muted-foreground"}`}><Icon className="size-5" />{label}</button>; }
