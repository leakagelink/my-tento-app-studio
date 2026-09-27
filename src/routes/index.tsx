import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ElementType, type ReactNode } from "react";
import {
  ArrowLeft, Bell, CalendarDays, Car, Check, ChevronDown, ChevronRight, Clock3, CreditCard, Headphones, Home,
  MapPin, Minus, PartyPopper, Plus, Search, Settings, ShieldCheck, Sparkles,
  Star, Store, TentTree, UserRound, UtensilsCrossed, WalletCards, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import decorationHero from "@/assets/decoration-hero.jpg";
import packagePremium from "@/assets/package-premium.jpg";
import packageStandard from "@/assets/package-standard.jpg";
import packageBasic from "@/assets/package-basic.jpg";
import vehicleCab from "@/assets/vehicle-cab.png";
import vehicleAuto from "@/assets/vehicle-auto.png";
import vehicleToto from "@/assets/vehicle-toto.png";
import vehicleSuv from "@/assets/vehicle-suv.png";

const vehicleImages: Record<string, string> = { Cab: vehicleCab, Auto: vehicleAuto, Toto: vehicleToto, SUV: vehicleSuv };
const premiumImages: Record<string, string> = { "Toyota Fortuner": vehicleSuv, Scorpio: vehicleSuv, "Innova Crysta": vehicleSuv, "Toyota Camry": vehicleCab };

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
    <div className="min-h-screen bg-background pb-24 sm:py-6">
      <div className="mx-auto min-h-screen max-w-md overflow-hidden bg-card sm:min-h-[calc(100vh-3rem)] sm:rounded-lg sm:border sm:border-border sm:shadow-panel">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4">
          <Button variant="ghost" aria-label={step === "home" ? "My Tento home" : "Go back"} onClick={step === "home" ? undefined : goBack} className="h-auto gap-3 px-0 hover:bg-transparent">
            {step !== "home" && <ArrowLeft className="size-5 text-foreground" />}
            <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><TentTree className="size-6" /></span>
            <span><span className="block font-display text-xl font-extrabold text-primary">My<span className="text-accent">Tento</span></span><span className="block text-[9px] font-bold uppercase text-muted-foreground">Plan. Book. Celebrate.</span></span>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="My bookings" onClick={() => go("bookings")} className="rounded-full bg-secondary text-primary hover:bg-secondary/80"><CalendarDays className="size-5" /></Button>
            <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => go("notifications")} className="relative rounded-full bg-secondary text-primary hover:bg-secondary/80"><Bell className="size-5" />{!notificationsRead && <span className="absolute right-2 top-2 size-2 rounded-full bg-accent" />}</Button>
            <Button variant="ghost" size="icon" aria-label="Profile" onClick={() => go("profile")} className="rounded-full bg-secondary text-primary hover:bg-secondary/80"><UserRound className="size-5" /></Button>
          </div>
        </div>
      </header>

      <main className={step === "details" ? "" : "px-4 py-6"}>
        {step === "home" && <HomeScreen onBook={beginBooking} location={location} locationOpen={locationOpen} setLocationOpen={setLocationOpen} setLocation={setLocation} onServices={() => go("services")} onProviders={() => go("providers")} onProvider={(i) => { setProvider(i); go("providerDetail"); }} />}
        {step === "services" && <ServicesScreen onBook={beginBooking} />}
        {step === "details" && service === "Cab" && <CabScreen onContinue={() => go("payment")} />}
        {step === "details" && service !== "Cab" && <DetailsScreen service={service} guests={guests} setGuests={setGuests} onContinue={() => go("providers")} />}
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

      {!(["details", "providers", "providerDetail", "payment", "success", "notifications", "services"] as Step[]).includes(step) && <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card sm:left-1/2 sm:max-w-md sm:-translate-x-1/2"><div className="mx-auto grid h-18 max-w-md grid-cols-5">
        <NavItem icon={Home} label="Home" active={tab === "home"} onClick={() => go("home")} />
        <NavItem icon={TentTree} label="Tent" active={false} onClick={() => beginBooking("Tent")} />
        <NavItem icon={Sparkles} label="Decoration" active={false} onClick={() => beginBooking("Decoration")} />
        <NavItem icon={UtensilsCrossed} label="Catering" active={false} onClick={() => beginBooking("Catering")} />
        <NavItem icon={Car} label="Cab" active={false} onClick={() => beginBooking("Cab")} />
      </div></nav>}
      </div>
    </div>
  );
}

function HomeScreen({ onBook, location, locationOpen, setLocationOpen, setLocation, onServices, onProviders, onProvider }: { onBook: (name: ServiceName) => void; location: string; locationOpen: boolean; setLocationOpen: (v: boolean) => void; setLocation: (v: string) => void; onServices: () => void; onProviders: () => void; onProvider: (i: number) => void }) {
  return <div className="animate-rise-in">
    <section className="relative mb-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Good morning</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-primary">Hello, Dheeraj!</h1>
      <div className="relative mt-4">
        <Button variant="outline" onClick={() => setLocationOpen(!locationOpen)} className="h-auto w-fit gap-2 rounded-2xl border-border/60 bg-card px-4 py-2.5 shadow-sm"><MapPin className="size-4 text-primary" /><span className="text-xs font-bold text-primary">{location}</span><ChevronDown className="size-3 text-primary" /></Button>
        {locationOpen && <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-border bg-card p-2 shadow-lg">{["Lucknow, Uttar Pradesh", "Kanpur, Uttar Pradesh", "Ayodhya, Uttar Pradesh"].map(city => <Button key={city} variant="ghost" onClick={() => { setLocation(city); setLocationOpen(false); }} className="w-full justify-start">{city === location && <Check className="size-4 text-success" />}{city}</Button>)}</div>}
      </div>
    </section>

    <section className="relative mb-8 overflow-hidden rounded-[28px] bg-primary p-6 text-primary-foreground">
      <div className="relative z-10">
        <span className="rounded-full bg-accent px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-accent-foreground">Special offer</span>
        <h2 className="mt-3 w-3/4 font-display text-lg font-bold leading-tight">Wedding Season Spectacular Deals</h2>
        <p className="mt-2 text-[11px] text-primary-foreground/70">Get up to 20% off on your first booking</p>
        <Button onClick={() => onBook("Tent")} className="mt-4 rounded-xl bg-card px-5 py-2.5 text-[11px] font-bold text-primary shadow-lg hover:bg-secondary">Explore now</Button>
      </div>
      <div className="absolute -bottom-6 -right-6 size-36 rounded-full bg-primary-foreground/10 blur-2xl" />
      <div className="absolute right-4 top-4 size-16 rounded-full border-[12px] border-primary-foreground/5" />
    </section>

    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between"><h2 className="font-display text-sm font-black uppercase tracking-wider text-primary">Our services</h2><Button variant="ghost" size="sm" onClick={onServices} className="text-[10px] font-bold text-primary">View all</Button></div>
      <div className="grid grid-cols-2 gap-4">{services.map(({ name, subtitle, icon: Icon, tone }) => <Button variant="outline" key={name} onClick={() => onBook(name)} className="group h-auto flex-col items-start rounded-[24px] border-border/50 bg-card p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"><span className={`mb-4 grid size-12 place-items-center rounded-2xl ${tone}`}><Icon className="size-6" /></span><span className="text-sm font-bold text-primary">{name}</span><span className="mt-1 text-[11px] font-medium leading-4 text-muted-foreground">{subtitle}</span></Button>)}</div>
    </section>

    <section>
      <div className="mb-4 flex items-end justify-between"><h2 className="font-display text-sm font-black uppercase tracking-wider text-primary">Top rated</h2><Button variant="ghost" size="sm" onClick={onProviders} className="text-[10px] font-bold text-primary">View all</Button></div>
      <div className="space-y-3">{providers.map((item, i) => <Button variant="outline" key={item.name} onClick={() => onProvider(i)} className="h-auto w-full items-center gap-4 rounded-[22px] border-border/50 bg-card p-3.5 text-left shadow-sm"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-soft font-display text-sm font-bold text-primary">{item.initials}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-primary">{item.name}</span><span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-muted-foreground"><Star className="size-3 fill-accent text-accent" /> {item.rating} · Lucknow</span><span className="mt-2 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-[8px] font-bold uppercase text-primary">Verified</span></span><span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-primary"><ChevronRight className="size-5" /></span></Button>)}</div>
    </section>
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

const servicePackages: Record<Exclude<ServiceName, "Cab">, { name: string; detail: string; price: number; image?: string }[]> = {
  Decoration: [
    { name: "Premium", detail: "Full setup + grand stage", price: 25000, image: packagePremium },
    { name: "Standard", detail: "Stage + main hall", price: 15000, image: packageStandard },
    { name: "Basic", detail: "Elegant stage only", price: 10000, image: packageBasic },
    { name: "Custom", detail: "As per your need", price: 0 },
  ],
  Tent: [
    { name: "Royal Shamiyana", detail: "Premium tent + full setup", price: 30000, image: packagePremium },
    { name: "Standard Tent", detail: "Tent + chairs + tables", price: 18000, image: packageStandard },
    { name: "Basic Canopy", detail: "Simple tent setup", price: 12000, image: packageBasic },
    { name: "Custom", detail: "Type, size, design & colour", price: 0 },
  ],
  Catering: [
    { name: "Full Catering", detail: "Food, snacks, drinks & staff", price: 20000, image: packagePremium },
    { name: "Cooking Master", detail: "Experienced cook only", price: 8000, image: packageStandard },
    { name: "Bartan Only", detail: "Utensils & serving items", price: 6000, image: packageBasic },
    { name: "Custom", detail: "Menu as per your need", price: 0 },
  ],
};

const serviceAddOns: Record<Exclude<ServiceName, "Cab">, { name: string; price: number }[]> = {
  Decoration: [
    { name: "Stage Setup", price: 5000 }, { name: "Lighting Setup", price: 3000 }, { name: "Flower Decoration", price: 4000 },
    { name: "DJ / Sound System", price: 6000 }, { name: "Photography", price: 5000 }, { name: "LED Screen", price: 7000 },
  ],
  Tent: [
    { name: "DJ Sound + Light Setup", price: 6000 }, { name: "Night Light + Gate Light", price: 3500 }, { name: "Mineral Water (Branded / Normal)", price: 2000 },
    { name: "Normal Decoration", price: 4000 }, { name: "All Catering Facility", price: 15000 }, { name: "Catering Staff Only", price: 5000 },
  ],
  Catering: [
    { name: "Mineral Water (Branded / Normal)", price: 2000 }, { name: "DJ Speakers", price: 5000 }, { name: "Extra Serving Staff", price: 3000 }, { name: "Snacks & Drinks Counter", price: 4000 },
  ],
};

function DetailsScreen({ service, guests, setGuests, onContinue }: { service: ServiceName; guests: number; setGuests: (n: number) => void; onContinue: () => void }) {
  const key = (service === "Cab" ? "Tent" : service) as Exclude<ServiceName, "Cab">;
  const packages = servicePackages[key];
  const addOnOptions = serviceAddOns[key];
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [addOns, setAddOns] = useState<string[]>([addOnOptions[0]?.name ?? ""]);
  const selected = packages[selectedPackage] ?? packages[0];
  const addOnTotal = addOnOptions.filter((item) => addOns.includes(item.name)).reduce((total, item) => total + item.price, 0);
  const total = (selected?.price ?? 0) + addOnTotal;
  const isQuote = (selected?.price ?? 0) === 0;
  const toggleAddOn = (name: string) => setAddOns((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);

  return <div className="animate-rise-in pb-40">
    <section className="relative h-56 overflow-hidden bg-primary">
      <img src={decorationHero} alt="Premium wedding decoration stage" width={1600} height={900} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-primary-foreground">
        <span className="mb-3 grid size-11 place-items-center rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur"><Sparkles className="size-5" /></span>
        <h1 className="text-2xl font-extrabold">{service}</h1>
        <p className="mt-1 max-w-xs text-xs leading-5 text-primary-foreground/80">Make your event unforgettable with trusted professionals and beautiful setups.</p>
      </div>
    </section>

    <div className="space-y-8 px-5 py-6">
      <section>
        <SectionHeading number="1" title="Event Details" subtitle="Tell us about your event" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2 flex items-center gap-3 rounded-lg border border-border bg-muted p-3"><span className="grid size-9 place-items-center rounded-md bg-card text-primary shadow-sm"><MapPin className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase text-muted-foreground">Location</p><p className="truncate text-sm font-bold">Gomti Nagar, Lucknow</p></div><ChevronDown className="size-4 text-muted-foreground" /></div>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3"><CalendarDays className="size-4 shrink-0 text-primary" /><span className="min-w-0"><span className="block text-[10px] font-bold uppercase text-muted-foreground">Date</span><input aria-label="Event date" type="date" defaultValue="2026-12-25" className="w-full bg-transparent text-xs font-bold outline-none" /></span></label>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3"><Clock3 className="size-4 shrink-0 text-primary" /><span className="min-w-0"><span className="block text-[10px] font-bold uppercase text-muted-foreground">Time</span><input aria-label="Start time" type="time" defaultValue="18:00" className="w-full bg-transparent text-xs font-bold outline-none" /></span></label>
          <div className="col-span-2 flex items-center justify-between rounded-lg border border-border bg-muted p-3"><div><p className="text-[10px] font-bold uppercase text-muted-foreground">Number of guests</p><p className="text-sm font-bold">{guests} guests</p></div><div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Remove guests" onClick={() => setGuests(Math.max(50, guests - 50))} className="size-8 min-h-8"><Minus className="size-4" /></Button><Button size="icon" aria-label="Add guests" onClick={() => setGuests(guests + 50)} className="size-8 min-h-8"><Plus className="size-4" /></Button></div></div>
        </div>
      </section>

      <section>
        <SectionHeading number="2" title={`Choose ${service} Package`} subtitle="Select your preferred style" />
        <div className="-mx-1 mt-4 flex snap-x gap-3 overflow-x-auto px-1 pb-4">
          {packages.map((item, index) => <Button key={item.name} variant="outline" onClick={() => setSelectedPackage(index)} className={`h-auto min-w-44 snap-start flex-col items-stretch overflow-hidden p-1.5 text-left ${selectedPackage === index ? "border-primary ring-4 ring-secondary" : "border-border"}`}>
            <span className="relative block h-28 overflow-hidden rounded-md">{item.image ? <img src={item.image} alt={`${item.name} ${service} package`} loading="lazy" width={1024} height={768} className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center bg-brand-soft"><Sparkles className="size-8 text-primary" /></span>}{selectedPackage === index && <span className="absolute left-2 top-2 grid size-5 place-items-center rounded-full border-2 border-primary-foreground bg-primary text-primary-foreground"><Check className="size-3" /></span>}</span>
            <span className="block w-full px-2 pb-2 pt-2"><span className="block text-xs font-extrabold">{item.name} {service}</span><span className="mt-0.5 block text-[10px] font-medium text-muted-foreground">{item.detail}</span><span className="mt-2 block font-display text-sm font-extrabold text-primary">{item.price === 0 ? "Get Quote" : `₹ ${item.price.toLocaleString("en-IN")}`}</span></span>
          </Button>)}
        </div>
      </section>

      <section>
        <SectionHeading number="+" title="Add-on Services" subtitle="Enhance your event experience" muted />
        <div className="mt-4 grid gap-2 rounded-lg bg-muted p-3">
          {addOnOptions.map((item) => { const active = addOns.includes(item.name); return <Button key={item.name} variant="outline" onClick={() => toggleAddOn(item.name)} className={`h-auto justify-between p-3 ${active ? "border-primary bg-card ring-2 ring-secondary" : "bg-card"}`}><span className="flex items-center gap-3"><span className={`grid size-5 place-items-center rounded-sm border-2 ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{active && <Check className="size-3" />}</span><span className="text-xs font-bold">{item.name}</span></span><span className="text-xs font-extrabold text-primary">+₹ {item.price.toLocaleString("en-IN")}</span></Button> })}
        </div>
      </section>
    </div>

    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 p-4 backdrop-blur sm:left-1/2 sm:max-w-md sm:-translate-x-1/2">
      <div className="flex items-center justify-between rounded-lg bg-primary p-3 shadow-action"><div className="pl-2 text-primary-foreground"><p className="text-[10px] font-bold uppercase text-primary-foreground/70">{isQuote ? "Custom package" : "Total amount"}</p><p className="font-display text-xl font-extrabold">{isQuote ? "Get Quote" : `₹ ${total.toLocaleString("en-IN")}`}</p></div><Button onClick={onContinue} className="bg-card px-5 text-primary shadow-none hover:bg-secondary">{isQuote ? "Request quote" : "Book now"} <ChevronRight className="size-4" /></Button></div>
    </div>
  </div>;
}

function SectionHeading({ number, title, subtitle, muted = false }: { number: string; title: string; subtitle: string; muted?: boolean }) { return <div className="flex items-center gap-3"><span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${muted ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground shadow-action"}`}>{number}</span><div><h2 className="text-base font-extrabold leading-none">{title}</h2><p className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">{subtitle}</p></div></div>; }

function ProvidersScreen({ selected, setSelected, onContinue, onView }: { selected: number; setSelected: (n: number) => void; onContinue: () => void; onView: () => void }) {
  return <div className="mx-auto max-w-2xl animate-rise-in"><StepTitle step="2 of 3" title="Choose a provider" subtitle="3 trusted providers available" /><div className="space-y-3">{providers.map((item, index) => <button key={item.name} onClick={() => setSelected(index)} className={`flex w-full items-center gap-4 rounded-lg border bg-card p-4 text-left transition ${selected === index ? "border-primary ring-2 ring-primary/15" : "border-border"}`}><span className="grid size-14 shrink-0 place-items-center rounded-lg bg-brand-soft font-display font-bold text-primary">{item.initials}</span><span className="min-w-0 flex-1"><span className="block font-bold">{item.name}</span><span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Star className="size-3 fill-accent text-accent" /> {item.rating} · Verified provider</span><span className="mt-2 block text-xs text-muted-foreground">Tent, chairs, tables & shamiyana</span></span><span className="text-right"><span className="block font-display font-bold text-primary">{item.price}</span><span className="text-xs text-muted-foreground">package</span>{selected === index && <Check className="ml-auto mt-2 size-5 text-success" />}</span></button>)}</div><div className="mt-5 grid grid-cols-2 gap-3"><Button variant="outline" onClick={onView}>View details</Button><Button onClick={onContinue}>Continue to payment</Button></div></div>;
}

function PaymentScreen({ service, guests, provider, onConfirm }: { service: ServiceName; guests: number; provider: (typeof providers)[number]; onConfirm: () => void }) {
  const [pay, setPay] = useState("advance");
  const methods = [{ id: "online", label: "Pay full online (UPI / Card)" }, { id: "advance", label: "Pay 20% advance online" }, { id: "cash", label: "Cash / pay provider" }];
  return <div className="mx-auto max-w-2xl animate-rise-in"><StepTitle step="3 of 3" title="Confirm & pay" subtitle="Review your booking details" /><div className="rounded-lg border border-border bg-card p-5"><h3 className="mb-4 font-bold">Booking summary</h3><Summary label="Service" value={service} /><Summary label="Provider" value={provider.name} /><Summary label="Date & time" value="25 Dec 2026 · 6:00 PM" /><Summary label="Guests" value={`${guests}`} /><div className="mt-4 border-t border-border pt-4"><Summary label="Package total" value={provider.price} strong /></div></div><div className="mt-4 rounded-lg border border-border bg-card p-5"><h3 className="mb-3 font-bold">Payment method</h3>{methods.map(({ id, label }) => <button key={id} onClick={() => setPay(id)} className={`mb-2 flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm font-semibold ${pay === id ? "border-primary bg-secondary" : "border-border"}`}><span className={`grid size-5 place-items-center rounded-full border ${pay === id ? "border-primary" : "border-border"}`}>{pay === id && <span className="size-2.5 rounded-full bg-primary" />}</span>{label}</button>)}</div><div className="mt-4 flex gap-3 rounded-lg bg-brand-soft p-4 text-sm text-primary"><ShieldCheck className="size-5 shrink-0" /><p>Your booking is protected. Provider details are shared after confirmation.</p></div><Button onClick={onConfirm} className="mt-5 w-full">Confirm booking</Button></div>;
}

function SuccessScreen({ provider, onHome }: { provider: (typeof providers)[number]; onHome: () => void }) {
  return <div className="mx-auto max-w-lg animate-rise-in py-10 text-center"><span className="mx-auto grid size-20 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-10" /></span><p className="mt-6 text-sm font-bold text-success">BOOKING CONFIRMED</p><h1 className="mt-2 text-3xl font-extrabold">Your event is in good hands.</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{provider.name} has received your booking. Confirmation was sent by WhatsApp, SMS and app notification.</p><div className="mt-7 rounded-lg border border-border bg-card p-5 text-left"><Summary label="Booking ID" value="MT-261225-48" /><Summary label="Provider" value={provider.name} /><Summary label="Event date" value="25 Dec 2026" /><div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-brand-soft p-3"><div><p className="text-[10px] font-bold uppercase text-muted-foreground">Provider contact</p><p className="text-sm font-extrabold text-primary">+91 94150 12345</p></div><Button size="sm" asChild><a href="tel:+919415012345"><Headphones className="size-4" /> Call now</a></Button></div></div><Button onClick={onHome} className="mt-5 w-full">Back to home</Button></div>;
}

function StepTitle({ step, title, subtitle }: { step: string; title: string; subtitle: string }) { return <div className="mb-6"><p className="text-xs font-extrabold uppercase text-accent">{step}</p><h1 className="mt-1 text-2xl font-extrabold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full bg-primary ${step.startsWith("1") ? "w-1/3" : step.startsWith("2") ? "w-2/3" : "w-full"}`} /></div></div>; }
function Field({ icon: Icon, label, children }: { icon: ElementType; label: string; children: ReactNode }) { return <div><label className="mb-2 block text-sm font-bold">{label}</label><div className="flex items-center gap-3 rounded-lg border border-border p-3"><Icon className="size-5 text-primary" /><div className="min-w-0 flex-1 text-sm">{children}</div></div></div>; }
function Summary({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className="flex items-center justify-between gap-4 py-2 text-sm"><span className="text-muted-foreground">{label}</span><span className={strong ? "font-display text-lg font-extrabold text-primary" : "text-right font-bold"}>{value}</span></div>; }
function NavItem({ icon: Icon, label, active = false, onClick }: { icon: ElementType; label: string; active?: boolean; onClick: () => void }) { return <Button variant="ghost" onClick={onClick} className={`h-full rounded-none flex-col gap-1 text-[11px] ${active ? "text-primary" : "text-muted-foreground"}`}><Icon className="size-5" />{label}</Button>; }

function CabScreen({ onContinue }: { onContinue: () => void }) {
  const [mode, setMode] = useState<"daily" | "marriage">("daily");
  const [vehicle, setVehicle] = useState("Cab");
  const [count, setCount] = useState("5");
  const [pickup, setPickup] = useState("Gomti Nagar, Lucknow");
  const [drop, setDrop] = useState("Charbagh Railway Station, Lucknow");
  const [premium, setPremium] = useState("Toyota Fortuner");
  const swap = () => { setPickup(drop); setDrop(pickup); };
  const field = "w-full rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-primary";
  return (
    <div className="mx-auto max-w-2xl animate-rise-in">
      <p className="text-xs font-extrabold text-accent">2 OF 3</p>
      <h1 className="text-3xl font-extrabold">Cab Booking</h1>
      <p className="mt-1 text-sm text-muted-foreground">Choose your booking type and fill in the details</p>
      <div className="mt-4 h-1.5 rounded-full bg-border"><div className="h-full w-1/2 rounded-full bg-primary" /></div>
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg border border-border bg-card p-1.5">
        {(["daily", "marriage"] as const).map((m) => <Button key={m} variant={mode === m ? "default" : "ghost"} onClick={() => setMode(m)}>{m === "daily" ? <><Car className="size-4" /> Daily Ride</> : <><PartyPopper className="size-4" /> Marriage Function</>}</Button>)}
      </div>
      <div className="mt-4 space-y-5 rounded-lg border border-border bg-card p-4">
        {mode === "daily" ? (
          <section><h2 className="font-bold">1. Select Vehicle Type</h2><p className="text-xs text-muted-foreground">Choose the vehicle you need for your daily ride</p>
            <div className="mt-3 grid grid-cols-4 gap-2">{["Cab", "Auto", "Toto", "SUV"].map((v) => <Button key={v} variant={vehicle === v ? "default" : "outline"} onClick={() => setVehicle(v)} className="h-24 flex-col gap-1 p-2"><img src={vehicleImages[v]} alt={v} loading="lazy" className="h-14 w-full object-contain" />{v}</Button>)}</div></section>
        ) : (
          <section><h2 className="font-bold">1. Select Number of Vehicles</h2><p className="text-xs text-muted-foreground">How many vehicles do you need for your function?</p>
            <div className="mt-3 grid grid-cols-5 gap-2">{["5", "6", "7", "8", "10+"].map((v) => <Button key={v} variant={count === v ? "default" : "outline"} onClick={() => setCount(v)}>{v}</Button>)}</div></section>
        )}
        <label className="block"><span className="flex items-center gap-2 text-sm font-bold"><MapPin className="size-4 text-primary" /> 2. {mode === "daily" ? "Current" : "Pickup"} Location</span><input aria-label="Pickup location" value={pickup} onChange={(e) => setPickup(e.target.value)} className={`mt-2 ${field}`} /></label>
        <label className="block"><span className="flex items-center justify-between text-sm font-bold"><span className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> 3. Drop Location</span><Button type="button" variant="outline" size="sm" onClick={swap} aria-label="Swap locations">⇅</Button></span><input aria-label="Drop location" value={drop} onChange={(e) => setDrop(e.target.value)} className={`mt-2 ${field}`} /></label>
        {mode === "daily" ? (
          <div className="grid grid-cols-2 gap-3">
            <label><span className="text-sm font-bold">4. Passengers</span><select aria-label="Passengers" defaultValue="2" className={`mt-2 ${field}`}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select></label>
            <label><span className="text-sm font-bold">5. Preference</span><select aria-label="Vehicle preference" className={`mt-2 ${field}`}><option>Economy (Normal)</option><option>Comfort</option><option>Premium</option></select></label>
          </div>
        ) : (
          <>
            <label className="block"><span className="flex items-center gap-2 text-sm font-bold"><Clock3 className="size-4 text-primary" /> 4. Function Duration</span><select aria-label="Function duration" defaultValue="4 Hours" className={`mt-2 ${field}`}>{["2 Hours", "4 Hours", "6 Hours", "8 Hours", "Full Day"].map((d) => <option key={d}>{d}</option>)}</select></label>
            <section className="rounded-lg bg-brand-soft p-3"><h2 className="text-sm font-bold">Select Premium Vehicles (Marriage Function)</h2><p className="text-xs text-muted-foreground">Luxury cars for your special day</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{([["Toyota Fortuner", "7 Seater"], ["Scorpio", "7 Seater"], ["Innova Crysta", "7 Seater"], ["Toyota Camry", "5 Seater"]] as const).map(([n, s]) => <Button key={n} variant={premium === n ? "default" : "outline"} onClick={() => setPremium(n)} className="h-auto flex-col gap-1 p-3"><img src={premiumImages[n]} alt={n} loading="lazy" className="h-12 w-full object-contain" /><span className="text-xs font-bold">{n}</span><span className="text-[10px] opacity-80">({s}) · Premium</span></Button>)}</div></section>
          </>
        )}
        <Button onClick={onContinue} className="w-full" size="lg"><Car className="size-4" /> {mode === "daily" ? "Book Ride" : "Book Marriage Function"} <ChevronRight className="size-4" /></Button>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-card p-4"><ShieldCheck className="size-8 text-primary" /><div><p className="text-sm font-bold">{mode === "daily" ? "Safe • Affordable • Reliable" : "Make Your Special Day More Special"}</p><p className="text-xs text-muted-foreground">{mode === "daily" ? "Your daily commute, our priority" : "Premium cars for weddings, receptions & special events"}</p></div></div>
    </div>
  );
}
