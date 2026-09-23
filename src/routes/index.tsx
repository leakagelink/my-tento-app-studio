import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ElementType, type ReactNode } from "react";
import {
  ArrowLeft, Bell, CalendarDays, Car, Check, ChevronDown, ChevronRight, Clock3, CreditCard, Headphones, Home,
  MapPin, Minus, PartyPopper, Plus, Search, Settings, ShieldCheck, Sparkles,
  Star, Store, TentTree, UserRound, UtensilsCrossed, WalletCards, X,
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
type Step = "home" | "details" | "providers" | "providerDetail" | "payment" | "success" | "bookings" | "bookingDetail" | "wallet" | "profile" | "notifications" | "services";

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
  const [location, setLocation] = useState("Lucknow, Uttar Pradesh");
  const [locationOpen, setLocationOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const chosenProvider = providers[provider] ?? providers[0];

  const go = (next: Step) => { setStep(next); window.scrollTo(0, 0); };
  const beginBooking = (name: ServiceName) => { setService(name); go("details"); };
  const goBack = () => {
    const previous: Partial<Record<Step, Step>> = { details: "home", providers: "details", providerDetail: "providers", payment: "providers", success: "home", bookings: "home", bookingDetail: "bookings", wallet: "home", profile: "home", notifications: "home", services: "home" };
    go(previous[step] ?? "home");
  };
  const tab = step === "bookings" || step === "bookingDetail" ? "bookings" : step === "wallet" ? "wallet" : step === "profile" ? "profile" : "home";

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Button variant="ghost" aria-label={step === "home" ? "My Tento home" : "Go back"} onClick={step === "home" ? undefined : goBack} className="h-auto gap-3 px-0 hover:bg-transparent">
            {step !== "home" && <ArrowLeft className="size-5 text-foreground" />}
            <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><TentTree className="size-6" /></span>
            <span className="font-display text-xl font-extrabold text-primary">my<span className="text-accent">Tento</span></span>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => go("notifications")} className="relative rounded-full bg-secondary text-primary hover:bg-secondary/80"><Bell className="size-5" />{!notificationsRead && <span className="absolute right-2 top-2 size-2 rounded-full bg-accent" />}</Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {step === "home" && <HomeScreen onBook={beginBooking} location={location} locationOpen={locationOpen} setLocationOpen={setLocationOpen} setLocation={setLocation} onServices={() => go("services")} onProviders={() => go("providers")} onProvider={(i) => { setProvider(i); go("providerDetail"); }} />}
        {step === "services" && <ServicesScreen onBook={beginBooking} />}
        {step === "details" && <DetailsScreen service={service} guests={guests} setGuests={setGuests} onContinue={() => go("providers")} />}
        {step === "providers" && <ProvidersScreen selected={provider} setSelected={setProvider} onContinue={() => go("payment")} onView={() => go("providerDetail")} />}
        {step === "providerDetail" && chosenProvider && <ProviderDetail provider={chosenProvider} onBook={() => go("details")} />}
        {step === "payment" && chosenProvider && <PaymentScreen service={service} guests={guests} provider={chosenProvider} onConfirm={() => go("success")} />}
        {step === "success" && chosenProvider && <SuccessScreen provider={chosenProvider} onHome={() => go("home")} />}
        {step === "bookings" && <BookingsScreen onTrack={() => go("bookingDetail")} />}
        {step === "bookingDetail" && <BookingDetail />}
        {step === "wallet" && <WalletScreen />}
        {step === "profile" && <ProfileScreen />}
        {step === "notifications" && <NotificationsScreen read={notificationsRead} onRead={() => setNotificationsRead(true)} onBooking={() => go("bookingDetail")} />}
      </main>

      {!(["details", "providers", "providerDetail", "payment", "success", "notifications", "services"] as Step[]).includes(step) && <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card"><div className="mx-auto grid h-18 max-w-md grid-cols-4">
        <NavItem icon={Home} label="Home" active={tab === "home"} onClick={() => go("home")} />
        <NavItem icon={CalendarDays} label="Bookings" active={tab === "bookings"} onClick={() => go("bookings")} />
        <NavItem icon={WalletCards} label="Wallet" active={tab === "wallet"} onClick={() => go("wallet")} />
        <NavItem icon={UserRound} label="Profile" active={tab === "profile"} onClick={() => go("profile")} />
      </div></nav>}
    </div>
  );
}

function HomeScreen({ onBook, location, locationOpen, setLocationOpen, setLocation, onServices, onProviders, onProvider }: { onBook: (name: ServiceName) => void; location: string; locationOpen: boolean; setLocationOpen: (v: boolean) => void; setLocation: (v: string) => void; onServices: () => void; onProviders: () => void; onProvider: (i: number) => void }) {
  return <div className="animate-rise-in">
    <section className="relative mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div><p className="mb-1 text-sm font-semibold text-muted-foreground">Good morning, Dheeraj</p><h1 className="max-w-xl text-3xl font-extrabold leading-tight sm:text-4xl">Everything for your event, <span className="text-primary">in one place.</span></h1></div>
      <Button variant="outline" onClick={() => setLocationOpen(!locationOpen)} className="h-auto min-w-64 justify-start gap-3 px-4 py-3 text-left"><MapPin className="size-5 text-accent" /><span className="flex-1"><span className="block text-xs font-normal text-muted-foreground">Your location</span><span className="font-bold">{location}</span></span><ChevronDown className="size-4" /></Button>
      {locationOpen && <div className="absolute right-0 top-full z-20 mt-2 w-full rounded-lg border border-border bg-card p-2 shadow-lg md:w-72">{["Lucknow, Uttar Pradesh", "Kanpur, Uttar Pradesh", "Ayodhya, Uttar Pradesh"].map(city => <Button key={city} variant="ghost" onClick={() => { setLocation(city); setLocationOpen(false); }} className="w-full justify-start">{city === location && <Check className="size-4 text-success" />}{city}</Button>)}</div>}
    </section>
    <section className="mb-8"><div className="mb-4 flex items-end justify-between"><div><p className="text-sm font-bold text-accent">BOOK YOUR EVENT</p><h2 className="text-xl font-bold">What do you need?</h2></div><Button variant="ghost" size="sm" onClick={onServices} className="text-primary">View all</Button></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{services.map(({ name, subtitle, icon: Icon, tone }) => <Button variant="outline" key={name} onClick={() => onBook(name)} className="group h-auto flex-col items-start p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"><span className={`mb-5 grid size-12 place-items-center rounded-lg ${tone}`}><Icon className="size-6" /></span><span className="font-bold">{name}</span><span className="mt-1 text-xs font-normal leading-5 text-muted-foreground">{subtitle}</span></Button>)}</div>
    </section>
    <section className="mb-8 overflow-hidden rounded-lg bg-primary p-6 text-primary-foreground md:flex md:items-center md:justify-between md:p-8"><div><p className="mb-2 text-xs font-extrabold uppercase text-primary-foreground/70">Wedding season special</p><h2 className="max-w-md text-2xl font-bold">Planning a marriage?</h2><p className="mt-2 max-w-md text-sm text-primary-foreground/75">Book tent, decoration, catering and cabs together with trusted providers.</p></div><Button onClick={() => onBook("Tent")} className="mt-5 bg-accent text-accent-foreground shadow-none hover:bg-accent/90 md:mt-0">Plan my event <PartyPopper className="size-4" /></Button></section>
    <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Top providers near you</h2><Button variant="ghost" size="sm" onClick={onProviders} className="text-primary">See all</Button></div><div className="grid gap-3 md:grid-cols-3">{providers.map((item, i) => <Button variant="outline" key={item.name} onClick={() => onProvider(i)} className="h-auto justify-start gap-4 p-4 text-left"><span className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary font-display text-sm font-bold text-primary">{item.initials}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{item.name}</span><span className="mt-1 flex items-center gap-1 text-xs font-normal text-muted-foreground"><Star className="size-3 fill-accent text-accent" /> {item.rating} · Lucknow</span></span><span className="text-xs font-bold text-primary">View</span></Button>)}</div></section>
  </div>;
}

function ServicesScreen({ onBook }: { onBook: (name: ServiceName) => void }) { return <div className="animate-rise-in"><PageTitle title="All services" subtitle="Choose what your event needs" /><div className="grid gap-3 sm:grid-cols-2">{services.map(({ name, subtitle, icon: Icon, tone }) => <Button variant="outline" key={name} onClick={() => onBook(name)} className="h-auto justify-start gap-4 p-5 text-left"><span className={`grid size-14 place-items-center rounded-lg ${tone}`}><Icon /></span><span className="flex-1"><span className="block text-base font-bold">{name}</span><span className="text-xs font-normal text-muted-foreground">{subtitle}</span></span><ChevronRight className="size-5" /></Button>)}</div></div>; }

function ProviderDetail({ provider, onBook }: { provider: (typeof providers)[number]; onBook: () => void }) { return <div className="mx-auto max-w-2xl animate-rise-in"><div className="mb-5 flex items-center gap-4"><span className="grid size-20 place-items-center rounded-lg bg-brand-soft font-display text-xl font-bold text-primary">{provider.initials}</span><div><h1 className="text-2xl font-extrabold">{provider.name}</h1><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><Star className="size-4 fill-accent text-accent" /> {provider.rating} · Verified · Lucknow</p></div></div><div className="space-y-4 rounded-lg border border-border bg-card p-5"><h2 className="font-bold">Tent package</h2><p className="text-sm leading-6 text-muted-foreground">Shamiyana, stage, 200 chairs, 20 tables, lighting and setup staff included.</p><Summary label="Capacity" value={provider.detail} /><Summary label="Package price" value={provider.price} strong /><div className="rounded-lg bg-brand-soft p-4 text-sm text-primary"><ShieldCheck className="mb-2 size-5" />Identity and service details verified by My Tento.</div><Button onClick={onBook} className="w-full">Book this provider</Button></div></div>; }

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div className="mb-6"><h1 className="text-2xl font-extrabold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>; }

function BookingsScreen({ onTrack }: { onTrack: () => void }) { return <div className="animate-rise-in"><PageTitle title="My bookings" subtitle="Upcoming and previous events" /><div className="mb-4 flex gap-2"><Button size="sm">Upcoming</Button><Button variant="outline" size="sm">Past</Button></div><div className="rounded-lg border border-border bg-card p-5"><div className="flex items-start justify-between gap-4"><div><span className="text-xs font-bold text-success">CONFIRMED</span><h2 className="mt-1 font-bold">Royal Tent House</h2><p className="mt-1 text-sm text-muted-foreground">25 Dec 2026 · 6:00 PM</p></div><TentTree className="size-7 text-primary" /></div><div className="my-4 border-t border-border" /><Summary label="Booking ID" value="MT-261225-48" /><Summary label="Location" value="Gomti Nagar" /><Button onClick={onTrack} className="mt-4 w-full">View booking & tracking</Button></div></div>; }

function BookingDetail() { return <div className="mx-auto max-w-2xl animate-rise-in"><PageTitle title="Booking details" subtitle="MT-261225-48" /><div className="rounded-lg border border-border bg-card p-5"><span className="text-xs font-bold text-success">PROVIDER CONFIRMED</span><h2 className="mt-2 text-xl font-bold">Royal Tent House</h2><p className="mt-1 text-sm text-muted-foreground">25 Dec 2026 · 6:00 PM · Gomti Nagar</p><div className="my-5 border-t border-border" /><h3 className="font-bold">Live status</h3><div className="mt-4 space-y-4">{["Booking confirmed", "Provider assigned", "Team departure", "Setup started"].map((x,i)=><div key={x} className="flex gap-3"><span className={`mt-1 size-3 rounded-full ${i < 2 ? "bg-success" : "bg-border"}`} /><div><p className="text-sm font-semibold">{x}</p><p className="text-xs text-muted-foreground">{i === 0 ? "Completed" : i === 1 ? "Rohit and team assigned" : "Updates on event day"}</p></div></div>)}</div><Button variant="outline" className="mt-6 w-full"><Headphones className="size-4" /> Contact support</Button></div></div>; }

function WalletScreen() { const [added, setAdded] = useState(false); return <div className="animate-rise-in"><PageTitle title="My wallet" subtitle="Payments, refunds and offers" /><div className="rounded-lg bg-primary p-6 text-primary-foreground"><p className="text-sm text-primary-foreground/70">Available balance</p><p className="mt-1 font-display text-3xl font-extrabold">₹1,250</p><Button onClick={() => setAdded(true)} className="mt-5 bg-accent text-accent-foreground hover:bg-accent/90">{added ? <><Check className="size-4" /> Money added</> : <><Plus className="size-4" /> Add money</>}</Button></div><section className="mt-6"><h2 className="mb-3 font-bold">Recent transactions</h2><div className="rounded-lg border border-border bg-card p-4"><Summary label="Booking advance · Royal Tent" value="− ₹5,000" /><Summary label="Refund · Cancelled cab" value="+ ₹450" /><Summary label="Wallet cashback" value="+ ₹200" /></div></section><section className="mt-6"><h2 className="mb-3 font-bold">Payment methods</h2><div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"><CreditCard className="size-5 text-primary" /><div className="flex-1"><p className="text-sm font-bold">UPI & Cards</p><p className="text-xs text-muted-foreground">Secure mock checkout</p></div><ChevronRight className="size-5" /></div></section></div>; }

function ProfileScreen() { const [editing, setEditing] = useState(false); const [help, setHelp] = useState(false); return <div className="animate-rise-in"><PageTitle title="Profile" subtitle="Your account and preferences" /><div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5"><span className="grid size-16 place-items-center rounded-full bg-brand-soft font-display text-xl font-bold text-primary">DT</span><div className="flex-1"><h2 className="font-bold">Dheeraj Tagde</h2><p className="text-sm text-muted-foreground">+91 98••• ••210</p></div><Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>{editing ? "Saved" : "Edit"}</Button></div>{editing && <div className="mt-3 rounded-lg border border-border bg-card p-4"><label className="text-xs font-bold text-muted-foreground">DISPLAY NAME</label><input aria-label="Display name" defaultValue="Dheeraj Tagde" className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary" /></div>}<div className="mt-6 space-y-2">{[{icon:MapPin,label:"Saved addresses"},{icon:Settings,label:"App settings"},{icon:Headphones,label:"Help & support"}].map(({icon:Icon,label})=><Button key={label} variant="outline" onClick={() => label === "Help & support" && setHelp(!help)} className="h-auto w-full justify-start gap-3 p-4"><Icon className="size-5 text-primary"/><span className="flex-1 text-left">{label}</span><ChevronRight className="size-5"/></Button>)}</div><p className="mt-6 mb-2 text-xs font-extrabold uppercase text-muted-foreground">Demo panels</p><div className="space-y-2"><Button variant="outline" asChild className="h-auto w-full justify-start gap-3 p-4"><Link to="/provider"><Store className="size-5 text-primary"/><span className="flex-1 text-left">Provider panel <span className="block text-xs font-normal text-muted-foreground">Bookings, calendar & earnings — demo</span></span><ChevronRight className="size-5"/></Link></Button><Button variant="outline" asChild className="h-auto w-full justify-start gap-3 p-4"><Link to="/admin"><ShieldCheck className="size-5 text-primary"/><span className="flex-1 text-left">Admin dashboard <span className="block text-xs font-normal text-muted-foreground">Platform overview & management — demo</span></span><ChevronRight className="size-5"/></Link></Button></div>{help && <div className="mt-3 rounded-lg bg-brand-soft p-4 text-sm text-primary"><p className="font-bold">My Tento Support</p><p className="mt-1">Call or chat support will be available here in the live app.</p></div>}</div>; }

function NotificationsScreen({ read, onRead, onBooking }: { read: boolean; onRead: () => void; onBooking: () => void }) { return <div className="mx-auto max-w-2xl animate-rise-in"><div className="mb-6 flex items-center justify-between"><PageTitle title="Notifications" subtitle="Booking and offer updates" /><Button variant="ghost" size="sm" onClick={onRead}>{read ? "All read" : "Mark all read"}</Button></div><div className="space-y-3"><Button variant="outline" onClick={onBooking} className="h-auto w-full justify-start gap-3 p-4 text-left"><span className={`size-2 shrink-0 rounded-full ${read ? "bg-border" : "bg-accent"}`} /><span><span className="block font-bold">Booking confirmed</span><span className="text-xs font-normal text-muted-foreground">Royal Tent House accepted your booking.</span></span></Button><div className="rounded-lg border border-border bg-card p-4"><p className="font-bold">Wedding season offer</p><p className="mt-1 text-xs text-muted-foreground">Save on event combos booked this week.</p></div></div></div>; }

function DetailsScreen({ service, guests, setGuests, onContinue }: { service: ServiceName; guests: number; setGuests: (n: number) => void; onContinue: () => void }) {
  return <div className="mx-auto max-w-2xl animate-rise-in"><StepTitle step="1 of 3" title={`${service} booking`} subtitle="Tell us about your event" />
    <div className="space-y-5 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7"><Field icon={MapPin} label="Event location"><div className="font-semibold">Gomti Nagar, Lucknow</div></Field><div className="grid gap-4 sm:grid-cols-2"><Field icon={CalendarDays} label="Event date"><input aria-label="Event date" type="date" defaultValue="2026-12-25" className="w-full bg-transparent font-semibold outline-none" /></Field><Field icon={Clock3} label="Start time"><input aria-label="Start time" type="time" defaultValue="18:00" className="w-full bg-transparent font-semibold outline-none" /></Field></div><div><label className="mb-2 block text-sm font-bold">Number of guests</label><div className="flex items-center justify-between rounded-lg border border-border p-3"><div><p className="font-bold">{guests} guests</p><p className="text-xs text-muted-foreground">We’ll show suitable packages</p></div><div className="flex items-center gap-3"><button aria-label="Remove guests" onClick={() => setGuests(Math.max(50, guests - 50))} className="grid size-9 place-items-center rounded-md bg-secondary text-primary"><Minus className="size-4" /></button><button aria-label="Add guests" onClick={() => setGuests(guests + 50)} className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><Plus className="size-4" /></button></div></div></div><Button onClick={onContinue} className="w-full">Find available providers <Search className="size-4" /></Button></div>
  </div>;
}

function ProvidersScreen({ selected, setSelected, onContinue, onView }: { selected: number; setSelected: (n: number) => void; onContinue: () => void; onView: () => void }) {
  return <div className="mx-auto max-w-2xl animate-rise-in"><StepTitle step="2 of 3" title="Choose a provider" subtitle="3 trusted providers available" /><div className="space-y-3">{providers.map((item, index) => <button key={item.name} onClick={() => setSelected(index)} className={`flex w-full items-center gap-4 rounded-lg border bg-card p-4 text-left transition ${selected === index ? "border-primary ring-2 ring-primary/15" : "border-border"}`}><span className="grid size-14 shrink-0 place-items-center rounded-lg bg-brand-soft font-display font-bold text-primary">{item.initials}</span><span className="min-w-0 flex-1"><span className="block font-bold">{item.name}</span><span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Star className="size-3 fill-accent text-accent" /> {item.rating} · Verified provider</span><span className="mt-2 block text-xs text-muted-foreground">Tent, chairs, tables & shamiyana</span></span><span className="text-right"><span className="block font-display font-bold text-primary">{item.price}</span><span className="text-xs text-muted-foreground">package</span>{selected === index && <Check className="ml-auto mt-2 size-5 text-success" />}</span></button>)}</div><div className="mt-5 grid grid-cols-2 gap-3"><Button variant="outline" onClick={onView}>View details</Button><Button onClick={onContinue}>Continue to payment</Button></div></div>;
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
function NavItem({ icon: Icon, label, active = false, onClick }: { icon: ElementType; label: string; active?: boolean; onClick: () => void }) { return <Button variant="ghost" onClick={onClick} className={`h-full rounded-none flex-col gap-1 text-[11px] ${active ? "text-primary" : "text-muted-foreground"}`}><Icon className="size-5" />{label}</Button>; }
