import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, Bell, CalendarDays, Car, Check, ChevronDown, ChevronRight, Clock3, Headphones, Home,
  MapPin, Minus, Plus, Search, Settings, ShieldCheck, Sparkles,
  Star, Store, TentTree, UserRound, UtensilsCrossed, WalletCards, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { CabPriorityCard, ClientCabScreen } from "@/components/client-requirement-panels";
import { LangContext, useT, LanguageToggle, Onboarding, ComboScreen, ProviderDetailFull, ReviewsScreen, CouponBox, discountFor, BookingTracker, tr, type Lang, type TKey } from "@/components/mytento-extras";
import decorationHero from "@/assets/decoration-hero.webp";
import packagePremium from "@/assets/package-premium.webp";
import packageStandard from "@/assets/package-standard.webp";
import packageBasic from "@/assets/package-basic.webp";
import homeBanner from "@/assets/home-banner.webp";
import serviceTent from "@/assets/service-tent.webp";
import serviceDecoration from "@/assets/service-decoration.webp";
import serviceCatering from "@/assets/service-catering.webp";
import serviceCab from "@/assets/service-cab.webp";
import { supabase } from "@/integrations/supabase/client";
import { createLiveBooking, useLiveProviders, type LiveProvider } from "@/lib/live-data";
import { useAuth } from "@/hooks/use-auth";

const serviceImages: Record<ServiceName, string> = { Tent: serviceTent, Decoration: serviceDecoration, Catering: serviceCatering, Cab: serviceCab };

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
type Step = "home" | "details" | "providers" | "providerDetail" | "payment" | "success" | "bookings" | "bookingDetail" | "wallet" | "profile" | "notifications" | "services" | "combo" | "reviews";

const services: { name: ServiceName; subtitle: string; icon: ElementType; tone: string }[] = [
  { name: "Tent", subtitle: "Tent, chairs & stage", icon: TentTree, tone: "bg-brand-soft text-primary" },
  { name: "Decoration", subtitle: "Stage, flowers & lights", icon: Sparkles, tone: "bg-warm-soft text-accent" },
  { name: "Catering", subtitle: "Staff, utensils & meals", icon: UtensilsCrossed, tone: "bg-secondary text-primary" },
  { name: "Cab", subtitle: "Pickup, drop & baraat", icon: Car, tone: "bg-warm-soft text-accent" },
];

function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("home");
  const [service, setService] = useState<ServiceName>("Tent");
  const [guests, setGuests] = useState(200);
  const [provider, setProvider] = useState(0);
  const [location, setLocation] = useState("Lucknow, Uttar Pradesh");
  const [locationOpen, setLocationOpen] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<{ booking_code: string; booking_type: string; event_date: string; event_time: string; city: string; status: string; total_amount: number } | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [onboard, setOnboard] = useState(false);
  const [combo, setCombo] = useState<{ name: string; price: number } | null>(null);
  const [bookingCode, setBookingCode] = useState("");
  const city = location.split(",")[0] ?? "Lucknow";
  const { data: liveProviders = [] } = useLiveProviders(city);
  const visibleProviders: LiveProvider[] = liveProviders;
  useEffect(() => { if (!localStorage.getItem("mt-onboarded")) setOnboard(true); const l = localStorage.getItem("mt-lang"); if (l === "hi" || l === "en") setLang(l); }, []);
  const changeLang = (l: Lang) => { setLang(l); localStorage.setItem("mt-lang", l); };
  const chosenProvider = visibleProviders[provider] ?? visibleProviders[0];

  const go = (next: Step) => { setStep(next); window.scrollTo(0, 0); };
  const beginBooking = (name: ServiceName) => { setService(name); setCombo(null); go("details"); };
  const goBack = () => {
    const previous: Partial<Record<Step, Step>> = { details: "home", providers: "details", providerDetail: "providers", payment: combo ? "combo" : "providers", success: "home", bookings: "home", bookingDetail: "bookings", wallet: "home", profile: "home", notifications: "home", services: "home", combo: "home", reviews: "providerDetail" };
    go(previous[step] ?? "home");
  };
  const t = (k: TKey) => tr(lang, k);
  const tab = step === "bookings" || step === "bookingDetail" ? "bookings" : step === "wallet" ? "wallet" : step === "profile" ? "profile" : "home";

  return (
    <LangContext.Provider value={{ lang, setLang: changeLang }}>
    {onboard && <Onboarding onDone={() => { setOnboard(false); localStorage.setItem("mt-onboarded", "1"); }} />}
    <div className="min-h-svh min-w-0 bg-background sm:py-6">
      <div className="mx-auto min-h-svh min-w-0 max-w-md overflow-x-clip bg-card sm:min-h-[calc(100svh-3rem)] sm:rounded-lg sm:border sm:border-border sm:shadow-panel">
      <header className="safe-top sticky top-0 z-30 border-b border-border/70 bg-card/95 backdrop-blur">
        <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:px-4">
          <Button variant="ghost" aria-label={step === "home" ? "My Tento home" : "Go back"} onClick={step === "home" ? undefined : goBack} className="h-auto min-w-0 justify-start gap-2 overflow-hidden px-0 hover:bg-transparent sm:gap-3">
            {step !== "home" && <ArrowLeft className="size-5 text-foreground" />}
             <BrandLogo priority className="size-11 max-[359px]:size-10" />
              <span className="min-w-0 text-left"><span className="block truncate font-display text-lg font-extrabold text-logo sm:text-xl">MyTento</span><span className="mobile-compact-hide block truncate text-[10px] font-bold uppercase text-muted-foreground">Plan. Book. Celebrate.</span></span>
          </Button>
           <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" aria-label="My bookings" onClick={() => go("bookings")} className="rounded-full bg-secondary text-primary hover:bg-secondary/80"><CalendarDays className="size-5" /></Button>
             <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => go("notifications")} className="rounded-full bg-secondary text-primary hover:bg-secondary/80"><Bell className="size-5" /></Button>
             <Button variant="ghost" size="icon" aria-label={user ? "Profile" : "Sign in"} onClick={() => user ? go("profile") : void navigate({ to: "/auth", search: { redirect: "/" } })} className="rounded-full bg-secondary text-primary hover:bg-secondary/80"><UserRound className="size-5" /></Button>
          </div>
        </div>
      </header>

      <main className={step === "details" ? "app-bottom-space min-w-0" : step === "combo" ? "app-bottom-space min-w-0 px-3 pt-4 min-[360px]:px-4" : "app-bottom-space min-w-0 px-3 pt-5 min-[360px]:px-4 min-[360px]:pt-6"}>
         {step === "home" && <HomeScreen providers={visibleProviders} onBook={beginBooking} location={location} locationOpen={locationOpen} setLocationOpen={setLocationOpen} setLocation={setLocation} onServices={() => go("services")} onProviders={() => go("providers")} onProvider={(i) => { setProvider(i); go("providerDetail"); }} onCombo={() => go("combo")} />}
        {step === "combo" && <ComboScreen onContinue={(name, price) => { setCombo({ name, price }); go("payment"); }} />}
         {step === "reviews" && chosenProvider && <ReviewsScreen provider={chosenProvider} />}
        {step === "services" && <ServicesScreen onBook={beginBooking} />}
        {step === "details" && service === "Cab" && <ClientCabScreen />}
         {step === "details" && service !== "Cab" && <DetailsScreen service={service} guests={guests} setGuests={setGuests} eventDate={eventDate} setEventDate={setEventDate} eventTime={eventTime} setEventTime={setEventTime} city={city} onContinue={() => go("providers")} />}
         {step === "providers" && <ProvidersScreen providers={visibleProviders} selected={provider} setSelected={setProvider} onContinue={() => go("payment")} onView={() => go("providerDetail")} />}
         {step === "providerDetail" && chosenProvider && <ProviderDetailFull provider={chosenProvider} onBook={() => go("details")} onReviews={() => go("reviews")} />}
          {step === "payment" && chosenProvider && <PaymentScreen service={combo ? combo.name : service} amount={combo ? combo.price : Number(chosenProvider.price.replace(/[^0-9]/g, ""))} guests={guests} provider={chosenProvider} eventDate={eventDate} eventTime={eventTime} city={city} onConfirm={(code) => { setBookingCode(code); go("success"); }} />}
          {step === "success" && chosenProvider && <SuccessScreen provider={chosenProvider} bookingCode={bookingCode} eventDate={eventDate} onHome={() => go("home")} />}
          {step === "bookings" && <BookingsScreen userId={user?.id} onTrack={(booking) => { setSelectedBooking(booking); go("bookingDetail"); }} onSignIn={() => { void navigate({ to: "/auth", search: { redirect: "/" } }); }} />}
          {step === "bookingDetail" && <BookingTracker booking={selectedBooking} />}
         {step === "wallet" && <WalletScreen userId={user?.id} />}
         {step === "profile" && <ProfileScreen userId={user?.id} email={user?.email} />}
          {step === "notifications" && <NotificationsScreen userId={user?.id} onBooking={() => go("bookings")} />}
      </main>

      <nav className="safe-bottom app-bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card sm:left-1/2 sm:max-w-md sm:-translate-x-1/2"><div className="mx-auto grid h-18 max-w-md grid-cols-5">
        <NavItem icon={Home} label={t("home")} active={tab === "home"} onClick={() => go("home")} />
        <NavItem icon={TentTree} label={t("tent")} active={false} onClick={() => beginBooking("Tent")} />
        <NavItem icon={Sparkles} label={t("decoration")} active={false} onClick={() => beginBooking("Decoration")} />
        <NavItem icon={UtensilsCrossed} label={t("catering")} active={false} onClick={() => beginBooking("Catering")} />
        <NavItem icon={Car} label={t("cab")} active={false} onClick={() => beginBooking("Cab")} />
      </div></nav>
      </div>
    </div>
    </LangContext.Provider>
  );
}

function HomeScreen({ providers, onBook, location, locationOpen, setLocationOpen, setLocation, onServices, onProviders, onProvider, onCombo }: { providers: LiveProvider[]; onCombo: () => void; onBook: (name: ServiceName) => void; location: string; locationOpen: boolean; setLocationOpen: (v: boolean) => void; setLocation: (v: string) => void; onServices: () => void; onProviders: () => void; onProvider: (i: number) => void }) {
  const t = useT();
  const tile = (name: ServiceName, label: string, sub: string, cls: string, badge?: string) => <button key={name} type="button" onClick={() => onBook(name)} className={`group relative min-w-0 overflow-hidden rounded-[28px] border border-background bg-secondary text-left shadow-tile transition-transform duration-300 group-active:scale-[0.98] ${cls}`}><img src={serviceImages[name]} alt={label} loading="lazy" width={1024} height={768} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /><span className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/25 to-transparent" />{badge && <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[9px] font-bold uppercase tracking-tight text-accent-foreground shadow-sm">{badge}</span>}<span className="absolute bottom-4 left-4 right-3 min-w-0"><span className="block truncate font-display text-lg font-bold leading-tight text-white">{label}</span><span className="mt-0.5 block truncate text-[11px] font-medium leading-tight text-white/80">{sub}</span></span></button>;
  return <div className="animate-rise-in">
    <section className="relative mb-6">
      <div className="relative">
        <button type="button" onClick={() => setLocationOpen(!locationOpen)} className="flex max-w-full items-center gap-1.5 text-muted-foreground"><MapPin className="size-3.5 shrink-0 text-primary" /><span className="min-w-0 truncate text-xs font-medium uppercase tracking-wide">{location}</span><ChevronDown className="size-3 shrink-0" /></button>
        {locationOpen && <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-border bg-popover p-2 shadow-lg">{["Lucknow, Uttar Pradesh", "Kanpur, Uttar Pradesh", "Ayodhya, Uttar Pradesh"].map(city => <Button key={city} variant="ghost" onClick={() => { setLocation(city); setLocationOpen(false); }} className="w-full justify-start">{city === location && <Check className="size-4 text-success" />}{city}</Button>)}</div>}
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("greeting")}</p>
       <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">{t("hello")}</h1>
    </section>

    <CabPriorityCard onOpen={() => onBook("Cab")} />

    <button type="button" onClick={() => onBook("Tent")} className="relative mb-8 block h-40 w-full overflow-hidden rounded-[32px] bg-secondary text-left">
      <img src={homeBanner} alt="Wedding venue" width={1280} height={720} className="absolute inset-0 h-full w-full object-cover" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
      <span className="absolute bottom-5 left-6 right-6">
        <span className="rounded bg-accent px-2 py-0.5 text-[9px] font-black uppercase text-accent-foreground">{t("offer")}</span>
        <span className="mt-1.5 block font-display text-lg font-bold leading-tight text-white">{t("offerTitle")}</span>
        <span className="block text-xs text-white/80">{t("offerSub")}</span>
      </span>
    </button>

    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-bold leading-none text-primary">{t("services")}</h2>
          <p className="mt-1.5 truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("servicesSub")}</p>
        </div>
        <button type="button" onClick={onServices} className="flex shrink-0 items-center gap-1.5 pb-1 text-sm font-bold text-primary">{t("viewAll")}<span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10"><ChevronRight className="size-3" /></span></button>
      </div>
      <div className="grid grid-cols-2 grid-rows-[repeat(3,minmax(110px,1fr))] gap-3">
        {tile("Tent", t("tent"), "Royal & Modern", "row-span-2", t("trending"))}
        {tile("Decoration", t("decoration"), "Theme & Floral", "")}
        {tile("Catering", t("catering"), "Lucknowi flavours", "")}
        <button type="button" onClick={() => onBook("Cab")} className="group relative col-span-2 min-h-[112px] min-w-0 overflow-hidden rounded-[28px] border border-background bg-secondary text-left shadow-tile transition-transform duration-300 group-active:scale-[0.98]">
          <img src={serviceImages["Cab"]} alt={t("cab")} loading="lazy" width={1024} height={768} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          <span className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/45 to-transparent" />
          <span className="absolute inset-y-0 left-5 flex min-w-0 flex-col justify-center pr-20">
            <span className="flex min-w-0 items-center gap-2"><span className="h-4 w-1 shrink-0 rounded-full bg-accent" /><span className="truncate font-display text-xl font-bold leading-tight text-white">{t("cab")}</span></span>
            <span className="mt-1 truncate pl-3 text-xs font-medium text-white/90">Guest rides &amp; baraat</span>
          </span>
          <span className="absolute right-5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md transition-transform duration-300 group-active:scale-90"><ChevronRight className="size-5 text-white" /></span>
        </button>
      </div>
    </section>

    <section className="mb-8"><button type="button" onClick={onCombo} className="flex w-full items-center justify-between gap-4 rounded-[32px] bg-primary p-6 text-left text-primary-foreground shadow-action"><span className="min-w-0 flex-1"><span className="block font-display text-2xl font-bold leading-tight">{t("combo")}</span><span className="mt-2 block text-[11px] font-bold uppercase italic tracking-wide opacity-80">{t("comboSub")}</span></span><span className="grid size-12 shrink-0 place-items-center rounded-full bg-background text-primary"><ChevronRight className="size-6" /></span></button></section>

    <section>
      <div className="mb-4 flex items-end justify-between"><h2 className="font-display text-lg font-bold text-foreground">{t("topRated")}</h2><button type="button" onClick={onProviders} className="text-xs font-semibold text-primary">View all</button></div>
        <div className="space-y-3">{providers.length === 0 ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">No verified providers are available within 10 km right now.</p> : providers.map((item, i) => <Button variant="outline" type="button" key={item.id} onClick={() => onProvider(i)} className="flex h-auto w-full min-w-0 items-center justify-start gap-3 rounded-3xl bg-card p-3.5 text-left shadow-sm"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary font-display text-sm font-bold text-primary-foreground">{item.initials}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-foreground">{item.name}</span><span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-muted-foreground"><Star className="size-3 fill-primary text-primary" /> {item.rating} · {item.distance} km · <ShieldCheck className="size-3 text-success" /> Verified</span></span><ChevronRight className="size-5 shrink-0 text-primary" /></Button>)}</div>
    </section>
  </div>;
}

function ServicesScreen({ onBook }: { onBook: (name: ServiceName) => void }) { return <div className="animate-rise-in"><PageTitle title="All services" subtitle="Choose what your event needs" /><div className="grid gap-3 sm:grid-cols-2">{services.map(({ name, subtitle, icon: Icon, tone }) => <Button variant="outline" key={name} onClick={() => onBook(name)} className="h-auto justify-start gap-4 p-5 text-left"><span className={`grid size-14 place-items-center rounded-lg ${tone}`}><Icon /></span><span className="flex-1"><span className="block text-base font-bold">{name}</span><span className="text-xs font-normal text-muted-foreground">{subtitle}</span></span><ChevronRight className="size-5" /></Button>)}</div></div>; }


function PageTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div className="mb-6"><h1 className="text-2xl font-extrabold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>; }

function BookingsScreen({ userId, onTrack, onSignIn }: { userId: string | undefined; onTrack: () => void; onSignIn: () => void }) {
  const { data = [], isLoading } = useQuery({ queryKey: ["my-bookings", userId], enabled: Boolean(userId), queryFn: async () => { const { data: rows, error } = await supabase.from("bookings").select("id,booking_code,booking_type,event_date,event_time,city,status,total_amount,providers(business_name)").eq("customer_id", userId ?? "").order("created_at", { ascending: false }); if (error) throw error; return rows ?? []; } });
  if (!userId) return <div className="animate-rise-in"><PageTitle title="My bookings" subtitle="Sign in to view saved bookings" /><Button onClick={onSignIn} className="w-full">Sign in to continue</Button></div>;
  return <div className="animate-rise-in"><PageTitle title="My bookings" subtitle="Upcoming and previous events" />{isLoading ? <p className="text-sm text-muted-foreground">Loading bookings…</p> : data.length === 0 ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">No bookings yet. Your confirmed bookings will appear here.</p> : <div className="space-y-3">{data.map((booking) => { const provider = Array.isArray(booking.providers) ? booking.providers[0] : booking.providers; return <div key={booking.id} className="rounded-lg border border-border bg-card p-5"><div className="flex items-start justify-between gap-4"><div><span className="text-xs font-bold text-success">{booking.status.replaceAll("_", " ").toUpperCase()}</span><h2 className="mt-1 font-bold">{provider?.business_name ?? booking.booking_type}</h2><p className="mt-1 text-sm text-muted-foreground">{booking.event_date} · {booking.event_time}</p></div><TentTree className="size-7 text-primary" /></div><div className="my-4 border-t border-border" /><Summary label="Booking ID" value={booking.booking_code} /><Summary label="Amount" value={`₹${Number(booking.total_amount).toLocaleString("en-IN")}`} /><Button onClick={onTrack} className="mt-4 w-full">View booking & tracking</Button></div>; })}</div>}</div>;
}


function WalletScreen({ userId }: { userId: string | undefined }) { const { data = [], isLoading } = useQuery({ queryKey: ["my-payments", userId], enabled: Boolean(userId), queryFn: async () => { const { data, error } = await supabase.from("payments").select("id,method,amount,status,created_at,bookings(booking_code)").eq("customer_id", userId ?? "").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; } }); return <div className="animate-rise-in"><PageTitle title="Payments" subtitle="Your saved payment records" />{!userId ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">Sign in to view payments.</p> : isLoading ? <p className="text-sm text-muted-foreground">Loading payments…</p> : data.length === 0 ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">No payment records yet.</p> : <div className="space-y-3">{data.map((payment) => { const booking = Array.isArray(payment.bookings) ? payment.bookings[0] : payment.bookings; return <div key={payment.id} className="rounded-lg border border-border bg-card p-4"><Summary label={booking?.booking_code ?? "Payment"} value={`₹${Number(payment.amount).toLocaleString("en-IN")}`} /><Summary label="Method" value={payment.method} /><Summary label="Status" value={payment.status.replaceAll("_", " ")} /></div>; })}</div>}</div>; }

function ProfileScreen({ userId, email }: { userId: string | undefined; email: string | undefined }) {
  const queryClient = useQueryClient(); const [editing, setEditing] = useState(false); const [help, setHelp] = useState(false); const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  const { data: profile } = useQuery({ queryKey: ["profile", userId], enabled: Boolean(userId), queryFn: async () => { const { data, error } = await supabase.from("profiles").select("full_name,phone,city").eq("id", userId ?? "").single(); if (error) throw error; setName(data.full_name); setPhone(data.phone); return data; } });
  const save = async () => { if (!userId) return; const { error } = await supabase.from("profiles").update({ full_name: name, phone }).eq("id", userId); if (error) { toast.error("Profile could not be saved"); return; } await queryClient.invalidateQueries({ queryKey: ["profile", userId] }); setEditing(false); toast.success("Profile saved"); };
  const signOut = async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); window.location.assign("/auth"); };
  const displayName = profile?.full_name || email?.split("@")[0] || "MyTento user"; const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <div className="animate-rise-in"><PageTitle title="Profile" subtitle="Your account and preferences" /><div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5"><span className="grid size-16 place-items-center rounded-full bg-brand-soft font-display text-xl font-bold text-primary">{initials}</span><div className="min-w-0 flex-1"><h2 className="truncate font-bold">{displayName}</h2><p className="truncate text-sm text-muted-foreground">{profile?.phone || email}</p></div><Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>{editing ? "Cancel" : "Edit"}</Button></div>{editing && <div className="mt-3 space-y-3 rounded-lg border border-border bg-card p-4"><label className="block text-xs font-bold text-muted-foreground">DISPLAY NAME<input aria-label="Display name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary" /></label><label className="block text-xs font-bold text-muted-foreground">PHONE<input aria-label="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary" /></label><Button onClick={() => void save()} className="w-full">Save profile</Button></div>}<div className="mt-6 space-y-2">{[{icon:MapPin,label:"Saved addresses"},{icon:Settings,label:"App settings"},{icon:Headphones,label:"Help & support"}].map(({icon:Icon,label})=><Button key={label} variant="outline" onClick={() => label === "Help & support" && setHelp(!help)} className="h-auto w-full justify-start gap-3 p-4"><Icon className="size-5 text-primary"/><span className="flex-1 text-left">{label}</span><ChevronRight className="size-5"/></Button>)}</div><p className="mt-6 mb-2 text-xs font-extrabold uppercase text-muted-foreground">Business panels</p><div className="space-y-2"><Button variant="outline" asChild className="h-auto w-full justify-start gap-3 p-4"><Link to="/provider"><Store className="size-5 text-primary"/><span className="flex-1 text-left">Provider panel</span><ChevronRight className="size-5"/></Link></Button><Button variant="outline" asChild className="h-auto w-full justify-start gap-3 p-4"><Link to="/admin"><ShieldCheck className="size-5 text-primary"/><span className="flex-1 text-left">Admin dashboard</span><ChevronRight className="size-5"/></Link></Button></div><LanguageToggle /><Button variant="outline" onClick={() => void signOut()} className="mt-5 w-full text-destructive">Sign out</Button>{help && <div className="mt-3 rounded-lg bg-brand-soft p-4 text-sm text-primary"><p className="font-bold">MyTento Support</p><p className="mt-1">Call or chat support will be available here soon.</p></div>}</div>;
}

function NotificationsScreen({ userId, read, onRead, onBooking }: { userId: string | undefined; read: boolean; onRead: () => void; onBooking: () => void }) { const { data = [], isLoading } = useQuery({ queryKey: ["notifications", userId], enabled: Boolean(userId), queryFn: async () => { const { data, error } = await supabase.from("notifications").select("id,title,message,read_at,created_at").eq("user_id", userId ?? "").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; } }); return <div className="mx-auto max-w-2xl animate-rise-in"><div className="mb-6 flex items-center justify-between"><PageTitle title="Notifications" subtitle="Booking and account updates" />{data.length > 0 && <Button variant="ghost" size="sm" onClick={onRead}>{read ? "All read" : "Mark all read"}</Button>}</div>{!userId ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">Sign in to view notifications.</p> : isLoading ? <p className="text-sm text-muted-foreground">Loading notifications…</p> : data.length === 0 ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">No notifications yet.</p> : <div className="space-y-3">{data.map((item) => <Button key={item.id} variant="outline" onClick={onBooking} className="h-auto w-full justify-start gap-3 p-4 text-left"><span className={`size-2 shrink-0 rounded-full ${item.read_at || read ? "bg-border" : "bg-accent"}`} /><span><span className="block font-bold">{item.title}</span><span className="text-xs font-normal text-muted-foreground">{item.message}</span></span></Button>)}</div>}</div>; }

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
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>(() => addOnOptions[0] ? { [addOnOptions[0].name]: 1 } : {});
  const [selectedDay, setSelectedDay] = useState(25);
  const selected = packages[selectedPackage] ?? packages[0];
  const addOnTotal = addOnOptions.reduce((total, item) => total + item.price * (addOnQuantities[item.name] ?? 0), 0);
  const total = (selected?.price ?? 0) + addOnTotal;
  const isQuote = (selected?.price ?? 0) === 0;
  const bookedDays = [3, 7, 8, 14, 20, 26];
  const setQuantity = (name: string, quantity: number) => setAddOnQuantities((current) => ({ ...current, [name]: Math.max(0, Math.min(20, quantity)) }));

  return <div className="animate-rise-in pb-24">
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
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3"><CalendarDays className="size-4 shrink-0 text-primary" /><span className="min-w-0"><span className="block text-[10px] font-bold uppercase text-muted-foreground">Selected date</span><span className="text-xs font-bold">{selectedDay} Dec 2026</span></span></div>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3"><Clock3 className="size-4 shrink-0 text-primary" /><span className="min-w-0"><span className="block text-[10px] font-bold uppercase text-muted-foreground">Time</span><input aria-label="Start time" type="time" defaultValue="18:00" className="w-full bg-transparent text-xs font-bold outline-none" /></span></label>
          <div className="col-span-2 flex items-center justify-between rounded-lg border border-border bg-muted p-3"><div><p className="text-[10px] font-bold uppercase text-muted-foreground">Number of guests · steps of 20</p><p className="text-sm font-bold">{guests} guests</p></div><div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Remove 20 guests" onClick={() => setGuests(Math.max(20, guests - 20))} className="size-8 min-h-8"><Minus className="size-4" /></Button><Button size="icon" aria-label="Add 20 guests" onClick={() => setGuests(guests + 20)} className="size-8 min-h-8"><Plus className="size-4" /></Button></div></div>
        </div>
        <div className="mt-3 rounded-lg border border-border bg-card p-3"><div className="flex items-center justify-between"><div><p className="text-sm font-bold">December 2026 availability</p><p className="text-[10px] text-muted-foreground">Booked dates cannot be selected</p></div><CalendarDays className="size-5 text-primary" /></div><div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground">{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="mt-1 grid grid-cols-7 gap-1">{Array.from({ length: 31 }, (_, index) => index + 1).map((day) => { const booked = bookedDays.includes(day); return <Button key={day} size="icon" variant="ghost" disabled={booked} aria-label={booked ? `${day} December booked` : `${day} December available`} onClick={() => setSelectedDay(day)} className={`aspect-square h-auto min-h-8 w-full min-w-0 rounded-md p-0 text-xs ${booked ? "bg-destructive/10 text-destructive line-through" : selectedDay === day ? "bg-primary text-primary-foreground" : "bg-success/10 text-success"}`}>{day}</Button>; })}</div><div className="mt-3 flex flex-wrap gap-3 text-[10px] font-semibold"><span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-success/20" /> Available</span><span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-destructive/20" /> Already booked</span><span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-primary" /> Selected</span></div></div>
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
          {addOnOptions.map((item) => { const quantity = addOnQuantities[item.name] ?? 0; return <div key={item.name} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border bg-card p-3 ${quantity > 0 ? "border-primary ring-2 ring-secondary" : "border-border"}`}><div className="min-w-0"><p className="break-words text-xs font-bold">{item.name}</p><p className="mt-1 text-[10px] font-extrabold text-primary">₹{item.price.toLocaleString("en-IN")} each · ₹{(item.price * quantity).toLocaleString("en-IN")}</p></div><div className="flex items-center gap-1"><Button size="icon" variant="outline" aria-label={`Remove ${item.name}`} disabled={quantity === 0} onClick={() => setQuantity(item.name, quantity - 1)} className="size-8"><Minus className="size-3" /></Button><span className="w-6 text-center text-sm font-bold">{quantity}</span><Button size="icon" aria-label={`Add ${item.name}`} onClick={() => setQuantity(item.name, quantity + 1)} className="size-8"><Plus className="size-3" /></Button></div></div> })}
        </div>
      </section>
    </div>

    <div className="above-bottom-nav sticky z-20 border-t border-border bg-card/95 px-3 py-3 backdrop-blur min-[360px]:px-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-primary p-3 shadow-action"><div className="min-w-0 pl-1 text-primary-foreground min-[360px]:pl-2"><p className="truncate text-[10px] font-bold uppercase text-primary-foreground/70">{isQuote ? "Custom package" : "Total amount"}</p><p className="truncate font-display text-lg font-extrabold min-[360px]:text-xl">{isQuote ? "Get Quote" : `₹ ${total.toLocaleString("en-IN")}`}</p></div><Button onClick={onContinue} className="shrink-0 bg-card px-3 text-primary shadow-none hover:bg-secondary min-[360px]:px-5">{isQuote ? "Request quote" : "Book now"} <ChevronRight className="size-4" /></Button></div>
    </div>
  </div>;
}

function SectionHeading({ number, title, subtitle, muted = false }: { number: string; title: string; subtitle: string; muted?: boolean }) { return <div className="flex items-center gap-3"><span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${muted ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground shadow-action"}`}>{number}</span><div><h2 className="text-base font-extrabold leading-none">{title}</h2><p className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">{subtitle}</p></div></div>; }

function ProvidersScreen({ providers, selected, setSelected, onContinue, onView }: { providers: LiveProvider[]; selected: number; setSelected: (n: number) => void; onContinue: () => void; onView: () => void }) {
  return <div className="mx-auto max-w-2xl animate-rise-in"><StepTitle step="2 of 3" title="Choose a provider" subtitle={`${providers.length} verified providers within 10 km`} /><div className="mb-4 flex items-center gap-2 rounded-lg bg-brand-soft p-3 text-xs font-bold text-primary"><MapPin className="size-4" /> Showing nearby providers only · 10 km radius</div><div className="space-y-3">{providers.map((item, index) => <Button variant="outline" key={`${item.id}-${item.name}`} onClick={() => setSelected(index)} className={`grid h-auto w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center justify-normal gap-3 rounded-lg bg-card p-3 text-left transition min-[380px]:grid-cols-[auto_minmax(0,1fr)_auto] min-[380px]:gap-4 min-[380px]:p-4 ${selected === index ? "border-primary ring-2 ring-primary/15" : "border-border"}`}><span className="grid size-12 shrink-0 place-items-center rounded-lg bg-brand-soft font-display font-bold text-primary min-[380px]:size-14">{item.initials}</span><span className="min-w-0 flex-1"><span className="block break-words font-bold">{item.name}</span><span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Star className="size-3 shrink-0 fill-accent text-accent" /> {item.rating} · Verified · {item.distance} km away</span><span className="mt-2 block text-xs text-muted-foreground">{item.detail}</span></span><span className="col-span-2 flex items-center justify-between text-right min-[380px]:col-span-1 min-[380px]:block"><span className="block font-display font-bold text-primary">{item.price}</span><span className="text-xs text-muted-foreground">package</span>{selected === index && <Check className="ml-auto mt-2 size-5 text-success" />}</span></Button>)}</div><div className="mt-5 grid grid-cols-1 gap-3 min-[340px]:grid-cols-2"><Button variant="outline" onClick={onView}>View details</Button><Button disabled={providers.length === 0} onClick={onContinue}>Continue to payment</Button></div></div>;
}

function PaymentScreen({ service, amount, guests, provider, onConfirm }: { service: string; amount: number; guests: number; provider: LiveProvider; onConfirm: (bookingCode: string) => void }) {
  const [pay, setPay] = useState("advance");
  const [coupon, setCoupon] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const off = discountFor(coupon, amount); const final = amount - off; const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const methods = [{ id: "online", label: "Pay full online (UPI / Card)" }, { id: "advance", label: "Pay 20% advance online" }, { id: "cash", label: "Cash / pay provider" }];
  const confirm = async () => { setBusy(true); try { const booking = await createLiveBooking({ providerId: provider.id, bookingType: service, guests, totalAmount: final, paymentMethod: pay === "cash" ? "cash" : pay === "advance" ? "advance" : "razorpay" }); onConfirm(booking.booking_code); } catch (error) { if (error instanceof Error && error.message === "SIGN_IN_REQUIRED") { toast.error("Please sign in before confirming your booking"); window.location.assign("/auth?redirect=/"); } else toast.error("Booking could not be saved. Please try again."); } finally { setBusy(false); } };
  return <div className="mx-auto max-w-2xl animate-rise-in"><StepTitle step="3 of 3" title="Confirm & pay" subtitle="Review your booking details" /><div className="rounded-lg border border-border bg-card p-5"><h3 className="mb-4 font-bold">Booking summary</h3><Summary label="Service" value={service} /><Summary label="Provider" value={provider.name} /><Summary label="Date & time" value="25 Dec 2026 · 6:00 PM" /><Summary label="Guests" value={`${guests}`} /><div className="mt-4 border-t border-border pt-4"><Summary label="Package price" value={fmt(amount)} />{off > 0 && <Summary label={`Coupon (${coupon})`} value={`− ${fmt(off)}`} />}<Summary label="Total payable" value={fmt(final)} strong />{pay === "advance" && <Summary label="Pay now (20%)" value={fmt(Math.round(final * 0.2))} />}</div></div><CouponBox applied={coupon} setApplied={setCoupon} /><div className="mt-4 rounded-lg border border-border bg-card p-5"><h3 className="mb-3 font-bold">Payment method</h3>{methods.map(({ id, label }) => <button type="button" key={id} onClick={() => setPay(id)} className={`mb-2 flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm font-semibold ${pay === id ? "border-primary bg-secondary" : "border-border"}`}><span className={`grid size-5 place-items-center rounded-full border ${pay === id ? "border-primary" : "border-border"}`}>{pay === id && <span className="size-2.5 rounded-full bg-primary" />}</span>{label}</button>)}</div><div className="mt-4 flex gap-3 rounded-lg bg-brand-soft p-4 text-sm text-primary"><ShieldCheck className="size-5 shrink-0" /><p>Your booking is protected. Provider details are shared after confirmation.</p></div><Button disabled={busy || !provider.id} onClick={() => void confirm()} className="mt-5 w-full">{busy ? "Saving booking…" : "Confirm booking"}</Button></div>;
}

function SuccessScreen({ provider, bookingCode, onHome }: { provider: LiveProvider; bookingCode: string; onHome: () => void }) {
    return <div className="mx-auto max-w-lg animate-rise-in py-10 text-center"><span className="mx-auto grid size-20 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-10" /></span><p className="mt-6 text-sm font-bold text-success">BOOKING SAVED</p><h1 className="mt-2 text-3xl font-extrabold">Your event is in good hands.</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{provider.name} has received your booking request. Updates will appear in My Bookings.</p><div className="mt-7 rounded-lg border border-border bg-card p-5 text-left"><Summary label="Booking ID" value={bookingCode} /><Summary label="Provider" value={provider.name} /><Summary label="Event date" value="25 Dec 2026" /><div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-brand-soft p-3"><div><p className="text-[10px] font-bold uppercase text-muted-foreground">Provider contact</p><p className="text-sm font-extrabold text-primary">{provider.phone}</p></div><Button size="sm" asChild><a href={`tel:${provider.phone.replace(/\s/g, "")}`}><Headphones className="size-4" /> Call now</a></Button></div></div><Button onClick={onHome} className="mt-5 w-full">Back to home</Button></div>;
}

function StepTitle({ step, title, subtitle }: { step: string; title: string; subtitle: string }) { return <div className="mb-6"><p className="text-xs font-extrabold uppercase text-accent">{step}</p><h1 className="mt-1 text-2xl font-extrabold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full bg-primary ${step.startsWith("1") ? "w-1/3" : step.startsWith("2") ? "w-2/3" : "w-full"}`} /></div></div>; }
function Field({ icon: Icon, label, children }: { icon: ElementType; label: string; children: ReactNode }) { return <div><label className="mb-2 block text-sm font-bold">{label}</label><div className="flex items-center gap-3 rounded-lg border border-border p-3"><Icon className="size-5 text-primary" /><div className="min-w-0 flex-1 text-sm">{children}</div></div></div>; }
function Summary({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-start gap-3 py-2 text-sm"><span className="break-words text-muted-foreground">{label}</span><span className={`${strong ? "font-display text-base font-extrabold text-primary min-[360px]:text-lg" : "font-bold"} min-w-0 break-words text-right`}>{value}</span></div>; }
function NavItem({ icon: Icon, label, active = false, onClick }: { icon: ElementType; label: string; active?: boolean; onClick: () => void }) { return <Button variant="ghost" onClick={onClick} className={`mobile-compact-label h-full min-w-0 rounded-none px-1 flex-col gap-1 text-[11px] ${active ? "text-primary" : "text-muted-foreground"}`}><Icon className="size-5 shrink-0" /><span className="max-w-full truncate">{label}</span></Button>; }

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
