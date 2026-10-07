import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, Bell, CalendarDays, Car, Check, ChevronDown, ChevronRight, Clock3, Headphones, Home,
  MapPin, Minus, Navigation, Plus, Search, Settings, ShieldCheck, Sparkles,
  Star, Store, TentTree, UserRound, UtensilsCrossed, WalletCards, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { ClientCabScreen } from "@/components/client-requirement-panels";
import { LangContext, useT, LanguageToggle, Onboarding, ComboScreen, ProviderDetailFull, ReviewsScreen, CouponBox, discountFor, BookingTracker, tr, type Lang, type TKey } from "@/components/mytento-extras";
import decorationHero from "@/assets/decoration-hero.webp";
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
  const { data: liveProviders = [], isLoading: providersLoading } = useLiveProviders(city, service);
  const visibleProviders: LiveProvider[] = liveProviders;
  useEffect(() => { if (!localStorage.getItem("mt-onboarded")) setOnboard(true); const l = localStorage.getItem("mt-lang"); if (l === "hi" || l === "en") setLang(l); const saved = localStorage.getItem("mt-location"); if (saved) setLocation(saved); else detectLocation(); }, []);
  const chooseLocation = (value: string) => { setLocation(value); localStorage.setItem("mt-location", value); };
  const detectLocation = () => {
    const fallback = () => { try { return localStorage.getItem("mt-location") || "Lucknow, Uttar Pradesh"; } catch { return "Lucknow, Uttar Pradesh"; } };
    try {
      if (typeof navigator === "undefined" || !navigator.geolocation) { toast.error("Location is not supported on this device"); return; }
      setLocation("Detecting location…");
      let done = false;
      const safety = window.setTimeout(() => { if (!done) { done = true; setLocation(fallback()); toast.error("Could not detect location — choose your city manually"); } }, 15000);
      navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        if (done) return; done = true; window.clearTimeout(safety);
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`);
          const d = await res.json() as { city?: string; locality?: string; principalSubdivision?: string };
          const name = d?.city || d?.locality;
          chooseLocation(name ? `${name}${d.principalSubdivision ? `, ${d.principalSubdivision}` : ""}` : fallback());
        } catch { setLocation(fallback()); }
      }, () => { if (done) return; done = true; window.clearTimeout(safety); setLocation(fallback()); toast.error("Location permission denied — choose your city manually"); }, { timeout: 10000, maximumAge: 600000 });
    } catch { setLocation(fallback()); toast.error("Could not detect location — choose your city manually"); }
  };
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
         {step === "home" && <HomeScreen providers={visibleProviders} onBook={beginBooking} location={location} locationOpen={locationOpen} setLocationOpen={setLocationOpen} setLocation={chooseLocation} onDetect={detectLocation} onServices={() => go("services")} onProviders={() => go("providers")} onProvider={(i) => { setProvider(i); go("providerDetail"); }} onCombo={() => go("combo")} />}
        {step === "combo" && <ComboScreen onContinue={(name, price) => { setCombo({ name, price }); go("payment"); }} />}
         {step === "reviews" && chosenProvider && <ReviewsScreen provider={chosenProvider} />}
        {step === "services" && <ServicesScreen onBook={beginBooking} />}
        {step === "details" && service === "Cab" && <ClientCabScreen />}
         {step === "details" && service !== "Cab" && <DetailsScreen service={service} guests={guests} setGuests={setGuests} eventDate={eventDate} setEventDate={setEventDate} eventTime={eventTime} setEventTime={setEventTime} city={city} providers={visibleProviders} loading={providersLoading} onContinue={() => go("providers")} onCityChange={chooseLocation} />}
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

function useCitySearch() {
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<string[]>([]);
  const [citySearching, setCitySearching] = useState(false);
  const searchCity = async (q: string) => {
    setCityQuery(q);
    if (q.trim().length < 3) { setCityResults([]); return; }
    setCitySearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&featureType=city&q=${encodeURIComponent(q.trim())}`);
      const data = await res.json() as Array<{ display_name?: string; address?: { city?: string; town?: string; village?: string; state?: string } }>;
      const names = (data ?? []).map((d) => { const a = d.address ?? {}; const c = a.city || a.town || a.village; return c ? `${c}${a.state ? `, ${a.state}` : ""}` : (d.display_name ?? "").split(",").slice(0, 2).join(",").trim(); }).filter(Boolean);
      setCityResults([...new Set(names)]);
    } catch { setCityResults([]); } finally { setCitySearching(false); }
  };
  return { cityQuery, setCityQuery, cityResults, citySearching, searchCity };
}

const POPULAR_CITIES = ["Lucknow, Uttar Pradesh", "Kanpur, Uttar Pradesh", "Ayodhya, Uttar Pradesh"];

function HomeScreen({ providers, onBook, location, locationOpen, setLocationOpen, setLocation, onDetect, onServices, onProviders, onProvider, onCombo }: { providers: LiveProvider[]; onDetect: () => void; onCombo: () => void; onBook: (name: ServiceName) => void; location: string; locationOpen: boolean; setLocationOpen: (v: boolean) => void; setLocation: (v: string) => void; onServices: () => void; onProviders: () => void; onProvider: (i: number) => void }) {
  const t = useT();
  const { cityQuery, setCityQuery, cityResults, citySearching, searchCity } = useCitySearch();
  const tile = (name: ServiceName, label: string, sub: string, cls: string, badge?: string) => <button key={name} type="button" onClick={() => onBook(name)} className={`group relative min-w-0 overflow-hidden rounded-[32px] border border-background bg-secondary text-left shadow-tile transition-transform duration-300 active:scale-[0.98] ${cls}`}><img src={serviceImages[name]} alt={label} loading="lazy" width={1024} height={768} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /><span className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />{badge && <span className="absolute left-4 top-4 rounded-full bg-accent px-2.5 py-1 text-[9px] font-black uppercase tracking-tight text-accent-foreground shadow-sm">{badge}</span>}<span className="absolute bottom-5 left-5 right-3 min-w-0"><span className="block truncate font-display text-lg font-bold leading-tight text-white">{label}</span><span className="mt-0.5 block truncate text-[11px] font-medium leading-tight text-white/80">{sub}</span></span></button>;
  return <div className="animate-rise-in">
    <section className="relative mb-5">
      <button type="button" onClick={() => setLocationOpen(!locationOpen)} className="flex max-w-full items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-muted-foreground shadow-sm"><MapPin className="size-3.5 shrink-0 text-accent" /><span className="min-w-0 truncate text-[11px] font-bold uppercase tracking-widest">{location}</span><ChevronDown className="size-3 shrink-0 opacity-60" /></button>
      {locationOpen && <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-2xl border border-border bg-popover p-2 shadow-lg">
        <div className="mb-1 flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2"><Search className="size-4 shrink-0 text-muted-foreground" /><input value={cityQuery} onChange={(e) => void searchCity(e.target.value)} placeholder="Search your city…" className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground" /></div>
        {citySearching && <p className="px-3 py-2 text-xs text-muted-foreground">Searching…</p>}
        {cityResults.map(city => <Button key={city} variant="ghost" onClick={() => { setLocation(city); setLocationOpen(false); setCityQuery(""); setCityResults([]); }} className="w-full justify-start"><MapPin className="size-4 shrink-0 text-accent" /><span className="truncate">{city}</span></Button>)}
        <Button variant="ghost" onClick={() => { onDetect(); setLocationOpen(false); }} className="w-full justify-start text-primary"><Navigation className="size-4" />Use current location</Button>
        {POPULAR_CITIES.map(city => <Button key={city} variant="ghost" onClick={() => { setLocation(city); setLocationOpen(false); }} className="w-full justify-start">{city === location && <Check className="size-4 text-success" />}{city}</Button>)}
      </div>}
    </section>

    <section className="mb-5 overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-tile">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("greeting")}</p>
          <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-foreground">Welcome to <span className="text-primary">MyTento</span></h1>
        </div>
        <img src={serviceImages.Cab} alt="" width={1024} height={768} className="h-16 w-24 shrink-0 rounded-xl object-cover drop-shadow-xl" />
      </div>
    </section>

    <button type="button" onClick={() => onBook("Cab")} className="bg-festive relative mb-5 flex w-full items-center justify-between gap-3 overflow-hidden rounded-3xl p-4 text-left shadow-action">
      <span className="absolute -right-10 -top-10 size-32 rounded-full bg-white/5" />
      <span className="relative z-10 flex min-w-0 items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md"><Navigation className="size-6 rotate-45 text-white" /></span>
        <span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-widest text-blue-100">Need a ride?</span><span className="block truncate text-sm font-semibold text-white">View nearby vehicles</span></span>
      </span>
      <span className="relative z-10 flex shrink-0 items-center gap-1.5 rounded-xl bg-card px-4 py-2.5 text-[11px] font-bold text-primary shadow-sm transition-transform active:scale-95">View <ChevronRight className="size-3" /></span>
    </button>

    <button type="button" onClick={() => onBook("Tent")} className="group relative mb-8 block h-52 w-full overflow-hidden rounded-[32px] bg-secondary text-left shadow-tile">
      <img src={homeBanner} alt="Wedding venue" width={1280} height={720} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <span className="absolute bottom-5 left-6 right-6">
        <span className="mb-2 inline-block rounded-md bg-accent px-2.5 py-1 text-[9px] font-black uppercase text-accent-foreground shadow-sm">{t("offer")}</span>
        <span className="block font-display text-xl font-bold leading-tight text-white">{t("offerTitle")}</span>
        <span className="mt-1 block text-xs text-white/80">{t("offerSub")}</span>
      </span>
    </button>

    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold leading-none text-foreground">{t("services")}</h2>
          <p className="mt-1.5 truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("servicesSub")}</p>
        </div>
        <button type="button" onClick={onServices} className="flex shrink-0 items-center gap-1.5 pb-1 text-xs font-bold text-primary">{t("viewAll")}<span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10"><ChevronRight className="size-3" /></span></button>
      </div>
      <div className="grid h-[340px] grid-cols-2 grid-rows-2 gap-4">
        {tile("Tent", t("tent"), "Royal & Modern", "row-span-2", t("trending"))}
        {tile("Decoration", t("decoration"), "Theme & Floral", "")}
        {tile("Catering", t("catering"), "Lucknowi flavours", "")}
      </div>
      <button type="button" onClick={() => onBook("Cab")} className="group relative mt-4 block min-h-[112px] w-full min-w-0 overflow-hidden rounded-[28px] border border-background bg-secondary text-left shadow-tile transition-transform duration-300 active:scale-[0.98]">
        <img src={serviceImages.Cab} alt={t("cab")} loading="lazy" width={1024} height={768} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <span className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/45 to-transparent" />
        <span className="absolute inset-y-0 left-5 flex min-w-0 flex-col justify-center pr-20">
          <span className="flex min-w-0 items-center gap-2"><span className="h-4 w-1 shrink-0 rounded-full bg-accent" /><span className="truncate font-display text-xl font-bold leading-tight text-white">{t("cab")}</span></span>
          <span className="mt-1 truncate pl-3 text-xs font-medium text-white/90">Guest rides &amp; baraat</span>
        </span>
        <span className="absolute right-5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md transition-transform duration-300 group-active:scale-90"><ChevronRight className="size-5 text-white" /></span>
      </button>
    </section>

    <section className="mb-8"><button type="button" onClick={onCombo} className="bg-festive flex w-full items-center justify-between gap-4 rounded-[32px] p-6 text-left text-primary-foreground shadow-action"><span className="min-w-0 flex-1"><span className="block font-display text-2xl font-bold leading-tight">{t("combo")}</span><span className="mt-2 block text-[11px] font-bold uppercase italic tracking-wide opacity-80">{t("comboSub")}</span></span><span className="grid size-12 shrink-0 place-items-center rounded-full bg-card text-primary"><ChevronRight className="size-6" /></span></button></section>

    <section>
      <div className="mb-4 flex items-end justify-between"><h2 className="font-display text-lg font-bold text-foreground">{t("topRated")}</h2><button type="button" onClick={onProviders} className="text-xs font-semibold text-primary">View all</button></div>
      <div className="space-y-3">{providers.length === 0 ? <p className="rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground">No verified providers are available within 10 km right now.</p> : providers.map((item, i) => <Button variant="outline" type="button" key={item.id} onClick={() => onProvider(i)} className="flex h-auto w-full min-w-0 items-center justify-start gap-3 rounded-3xl bg-card p-3.5 text-left shadow-sm"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary font-display text-sm font-bold text-primary-foreground">{item.initials}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-foreground">{item.name}</span><span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-muted-foreground"><Star className="size-3 fill-accent text-accent" /> {item.rating} · {item.distance} km · <ShieldCheck className="size-3 text-success" /> Verified</span></span><ChevronRight className="size-5 shrink-0 text-primary" /></Button>)}</div>
    </section>
  </div>;
}

function ServicesScreen({ onBook }: { onBook: (name: ServiceName) => void }) { return <div className="animate-rise-in"><PageTitle title="All services" subtitle="Choose what your event needs" /><div className="grid gap-3 sm:grid-cols-2">{services.map(({ name, subtitle, icon: Icon, tone }) => <Button variant="outline" key={name} onClick={() => onBook(name)} className="h-auto justify-start gap-4 p-5 text-left"><span className={`grid size-14 place-items-center rounded-lg ${tone}`}><Icon /></span><span className="flex-1"><span className="block text-base font-bold">{name}</span><span className="text-xs font-normal text-muted-foreground">{subtitle}</span></span><ChevronRight className="size-5" /></Button>)}</div></div>; }


function PageTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div className="mb-6"><h1 className="text-2xl font-extrabold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>; }

function BookingsScreen({ userId, onTrack, onSignIn }: { userId: string | undefined; onTrack: (booking: { booking_code: string; booking_type: string; event_date: string; event_time: string; city: string; status: string; total_amount: number }) => void; onSignIn: () => void }) {
  const { data = [], isLoading } = useQuery({ queryKey: ["my-bookings", userId], enabled: Boolean(userId), queryFn: async () => { const { data: rows, error } = await supabase.from("bookings").select("id,booking_code,booking_type,event_date,event_time,city,status,total_amount,providers(business_name)").eq("customer_id", userId ?? "").order("created_at", { ascending: false }); if (error) throw error; return rows ?? []; } });
  if (!userId) return <div className="animate-rise-in"><PageTitle title="My bookings" subtitle="Sign in to view saved bookings" /><Button onClick={onSignIn} className="w-full">Sign in to continue</Button></div>;
  return <div className="animate-rise-in"><PageTitle title="My bookings" subtitle="Upcoming and previous events" />{isLoading ? <p className="text-sm text-muted-foreground">Loading bookings…</p> : data.length === 0 ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">No bookings yet. Your confirmed bookings will appear here.</p> : <div className="space-y-3">{data.map((booking) => { const provider = Array.isArray(booking.providers) ? booking.providers[0] : booking.providers; return <div key={booking.id} className="rounded-lg border border-border bg-card p-5"><div className="flex items-start justify-between gap-4"><div><span className="text-xs font-bold text-success">{booking.status.replaceAll("_", " ").toUpperCase()}</span><h2 className="mt-1 font-bold">{provider?.business_name ?? booking.booking_type}</h2><p className="mt-1 text-sm text-muted-foreground">{booking.event_date} · {booking.event_time}</p></div><TentTree className="size-7 text-primary" /></div><div className="my-4 border-t border-border" /><Summary label="Booking ID" value={booking.booking_code} /><Summary label="Amount" value={`₹${Number(booking.total_amount).toLocaleString("en-IN")}`} /><Button onClick={() => onTrack(booking)} className="mt-4 w-full">View booking status</Button></div>; })}</div>}</div>;
}


function WalletScreen({ userId }: { userId: string | undefined }) { const { data = [], isLoading } = useQuery({ queryKey: ["my-payments", userId], enabled: Boolean(userId), queryFn: async () => { const { data, error } = await supabase.from("payments").select("id,method,amount,status,created_at,bookings(booking_code)").eq("customer_id", userId ?? "").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; } }); return <div className="animate-rise-in"><PageTitle title="Payments" subtitle="Your saved payment records" />{!userId ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">Sign in to view payments.</p> : isLoading ? <p className="text-sm text-muted-foreground">Loading payments…</p> : data.length === 0 ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">No payment records yet.</p> : <div className="space-y-3">{data.map((payment) => { const booking = Array.isArray(payment.bookings) ? payment.bookings[0] : payment.bookings; return <div key={payment.id} className="rounded-lg border border-border bg-card p-4"><Summary label={booking?.booking_code ?? "Payment"} value={`₹${Number(payment.amount).toLocaleString("en-IN")}`} /><Summary label="Method" value={payment.method} /><Summary label="Status" value={payment.status.replaceAll("_", " ")} /></div>; })}</div>}</div>; }

function ProfileScreen({ userId, email }: { userId: string | undefined; email: string | undefined }) {
  const queryClient = useQueryClient(); const [editing, setEditing] = useState(false); const [help, setHelp] = useState(false); const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  const { data: profile } = useQuery({ queryKey: ["profile", userId], enabled: Boolean(userId), queryFn: async () => { const { data, error } = await supabase.from("profiles").select("full_name,phone,city").eq("id", userId ?? "").single(); if (error) throw error; setName(data.full_name); setPhone(data.phone); return data; } });
  const save = async () => { if (!userId) return; const { error } = await supabase.from("profiles").update({ full_name: name, phone }).eq("id", userId); if (error) { toast.error("Profile could not be saved"); return; } await queryClient.invalidateQueries({ queryKey: ["profile", userId] }); setEditing(false); toast.success("Profile saved"); };
  const signOut = async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); window.location.assign("/auth"); };
  const { data: isAdmin = false } = useQuery({ queryKey: ["is-admin", userId], enabled: Boolean(userId), queryFn: async () => { const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId ?? "").eq("role", "admin").maybeSingle(); return Boolean(data); } });
  const displayName = profile?.full_name || email?.split("@")[0] || "MyTento user"; const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <div className="animate-rise-in"><PageTitle title="Profile" subtitle="Your account and preferences" /><div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5"><span className="grid size-16 place-items-center rounded-full bg-brand-soft font-display text-xl font-bold text-primary">{initials}</span><div className="min-w-0 flex-1"><h2 className="truncate font-bold">{displayName}</h2><p className="truncate text-sm text-muted-foreground">{profile?.phone || email}</p></div><Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>{editing ? "Cancel" : "Edit"}</Button></div>{editing && <div className="mt-3 space-y-3 rounded-lg border border-border bg-card p-4"><label className="block text-xs font-bold text-muted-foreground">DISPLAY NAME<input aria-label="Display name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary" /></label><label className="block text-xs font-bold text-muted-foreground">PHONE<input aria-label="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary" /></label><Button onClick={() => void save()} className="w-full">Save profile</Button></div>}<div className="mt-6 space-y-2">{[{icon:MapPin,label:"Saved addresses"},{icon:Settings,label:"App settings"},{icon:Headphones,label:"Help & support"}].map(({icon:Icon,label})=><Button key={label} variant="outline" onClick={() => label === "Help & support" && setHelp(!help)} className="h-auto w-full justify-start gap-3 p-4"><Icon className="size-5 text-primary"/><span className="flex-1 text-left">{label}</span><ChevronRight className="size-5"/></Button>)}</div><p className="mt-6 mb-2 text-xs font-extrabold uppercase text-muted-foreground">Business panels</p><div className="space-y-2"><Button variant="outline" asChild className="h-auto w-full justify-start gap-3 p-4"><Link to="/provider"><Store className="size-5 text-primary"/><span className="flex-1 text-left">Provider panel</span><ChevronRight className="size-5"/></Link></Button>{isAdmin && <Button variant="outline" asChild className="h-auto w-full justify-start gap-3 p-4"><Link to="/admin"><ShieldCheck className="size-5 text-primary"/><span className="flex-1 text-left">Admin dashboard</span><ChevronRight className="size-5"/></Link></Button>}</div><LanguageToggle /><Button variant="outline" onClick={() => void signOut()} className="mt-5 w-full text-destructive">Sign out</Button>{help && <div className="mt-3 rounded-lg bg-brand-soft p-4 text-sm text-primary"><p className="font-bold">MyTento Support</p><p className="mt-1">Call or chat support will be available here soon.</p></div>}</div>;
}

function NotificationsScreen({ userId, onBooking }: { userId: string | undefined; onBooking: () => void }) { const queryClient = useQueryClient(); const { data = [], isLoading } = useQuery({ queryKey: ["notifications", userId], enabled: Boolean(userId), queryFn: async () => { const { data, error } = await supabase.from("notifications").select("id,title,message,read_at,created_at").eq("user_id", userId ?? "").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; } }); const markRead = async () => { if (!userId) return; const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null); if (error) { toast.error("Notifications could not be updated"); return; } await queryClient.invalidateQueries({ queryKey: ["notifications", userId] }); }; return <div className="mx-auto max-w-2xl animate-rise-in"><div className="mb-6 flex items-center justify-between"><PageTitle title="Notifications" subtitle="Booking and account updates" />{data.some((item) => !item.read_at) && <Button variant="ghost" size="sm" onClick={() => void markRead()}>Mark all read</Button>}</div>{!userId ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">Sign in to view notifications.</p> : isLoading ? <p className="text-sm text-muted-foreground">Loading notifications…</p> : data.length === 0 ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">No notifications yet.</p> : <div className="space-y-3">{data.map((item) => <Button key={item.id} variant="outline" onClick={onBooking} className="h-auto w-full justify-start gap-3 p-4 text-left"><span className={`size-2 shrink-0 rounded-full ${item.read_at ? "bg-border" : "bg-accent"}`} /><span><span className="block font-bold">{item.title}</span><span className="text-xs font-normal text-muted-foreground">{item.message}</span></span></Button>)}</div>}</div>; }

function DetailsScreen({ service, guests, setGuests, eventDate, setEventDate, eventTime, setEventTime, city, providers, loading, onContinue, onCityChange }: { service: ServiceName; guests: number; setGuests: (n: number) => void; eventDate: string; setEventDate: (value: string) => void; eventTime: string; setEventTime: (value: string) => void; city: string; providers: LiveProvider[]; loading: boolean; onContinue: () => void; onCityChange: (value: string) => void }) {
  const [cityEdit, setCityEdit] = useState(false);
  const { cityQuery, setCityQuery, cityResults, citySearching, searchCity } = useCitySearch();
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

    <div className="px-5 py-6">
      <section>
        <SectionHeading number="1" title="Event Details" subtitle="Tell us about your event" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2 flex items-center gap-3 rounded-lg border border-border bg-muted p-3"><span className="grid size-9 place-items-center rounded-md bg-card text-primary shadow-sm"><MapPin className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase text-muted-foreground">City</p><p className="truncate text-sm font-bold">{city}</p></div></div>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3"><CalendarDays className="size-4 shrink-0 text-primary" /><span className="min-w-0"><span className="block text-[10px] font-bold uppercase text-muted-foreground">Event date</span><input aria-label="Event date" type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="w-full bg-transparent text-xs font-bold outline-none" /></span></label>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3"><Clock3 className="size-4 shrink-0 text-primary" /><span className="min-w-0"><span className="block text-[10px] font-bold uppercase text-muted-foreground">Time</span><input aria-label="Start time" type="time" value={eventTime} onChange={(event) => setEventTime(event.target.value)} className="w-full bg-transparent text-xs font-bold outline-none" /></span></label>
          <div className="col-span-2 flex items-center justify-between rounded-lg border border-border bg-muted p-3"><div><p className="text-[10px] font-bold uppercase text-muted-foreground">Number of guests · steps of 20</p><p className="text-sm font-bold">{guests} guests</p></div><div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Remove 20 guests" onClick={() => setGuests(Math.max(20, guests - 20))} className="size-8 min-h-8"><Minus className="size-4" /></Button><Button size="icon" aria-label="Add 20 guests" onClick={() => setGuests(guests + 20)} className="size-8 min-h-8"><Plus className="size-4" /></Button></div></div>
        </div>
      </section>

      <section className="mt-6">
        <SectionHeading number="2" title={`Available ${service} providers`} subtitle={`Verified · within 10 km of ${city}`} />
        <div className="mt-4 space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Loading providers…</p> : providers.length === 0 ? <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">No {service.toLowerCase()} providers available in {city} yet. Try Lucknow, or add one from the admin panel.</p> : providers.map((item) => <div key={item.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3"><span className="grid size-12 shrink-0 place-items-center rounded-lg bg-brand-soft font-display font-bold text-primary">{item.initials}</span><div className="min-w-0 flex-1"><p className="truncate font-bold">{item.name}</p><p className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="size-3 shrink-0 fill-accent text-accent" /> {item.rating} · {item.distance} km</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.detail}</p></div><p className="shrink-0 font-display font-bold text-primary">{item.price}</p></div>)}
        </div>
        {providers.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Choose date and time above, then tap “Choose provider” to book.</p>}
      </section>
    </div>

    <div className="above-bottom-nav sticky z-20 border-t border-border bg-card/95 px-3 py-3 backdrop-blur min-[360px]:px-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-primary p-3 shadow-action"><div className="min-w-0 pl-1 text-primary-foreground min-[360px]:pl-2"><p className="text-[10px] font-bold uppercase text-primary-foreground/70">Next</p><p className="font-display text-base font-extrabold">Compare live providers</p></div><Button disabled={!eventDate || !eventTime} onClick={onContinue} className="shrink-0 bg-card px-3 text-primary shadow-none hover:bg-secondary min-[360px]:px-5">Choose provider <ChevronRight className="size-4" /></Button></div>
    </div>
  </div>;
}

function SectionHeading({ number, title, subtitle, muted = false }: { number: string; title: string; subtitle: string; muted?: boolean }) { return <div className="flex items-center gap-3"><span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${muted ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground shadow-action"}`}>{number}</span><div><h2 className="text-base font-extrabold leading-none">{title}</h2><p className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">{subtitle}</p></div></div>; }

function ProvidersScreen({ providers, selected, setSelected, onContinue, onView }: { providers: LiveProvider[]; selected: number; setSelected: (n: number) => void; onContinue: () => void; onView: () => void }) {
  return <div className="mx-auto max-w-2xl animate-rise-in"><StepTitle step="2 of 3" title="Choose a provider" subtitle={`${providers.length} verified providers within 10 km`} /><div className="mb-4 flex items-center gap-2 rounded-lg bg-brand-soft p-3 text-xs font-bold text-primary"><MapPin className="size-4" /> Showing nearby providers only · 10 km radius</div><div className="space-y-3">{providers.map((item, index) => <Button variant="outline" key={`${item.id}-${item.name}`} onClick={() => setSelected(index)} className={`grid h-auto w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center justify-normal gap-3 rounded-lg bg-card p-3 text-left transition min-[380px]:grid-cols-[auto_minmax(0,1fr)_auto] min-[380px]:gap-4 min-[380px]:p-4 ${selected === index ? "border-primary ring-2 ring-primary/15" : "border-border"}`}><span className="grid size-12 shrink-0 place-items-center rounded-lg bg-brand-soft font-display font-bold text-primary min-[380px]:size-14">{item.initials}</span><span className="min-w-0 flex-1"><span className="block break-words font-bold">{item.name}</span><span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Star className="size-3 shrink-0 fill-accent text-accent" /> {item.rating} · Verified · {item.distance} km away</span><span className="mt-2 block text-xs text-muted-foreground">{item.detail}</span></span><span className="col-span-2 flex items-center justify-between text-right min-[380px]:col-span-1 min-[380px]:block"><span className="block font-display font-bold text-primary">{item.price}</span><span className="text-xs text-muted-foreground">package</span>{selected === index && <Check className="ml-auto mt-2 size-5 text-success" />}</span></Button>)}</div><div className="mt-5 grid grid-cols-1 gap-3 min-[340px]:grid-cols-2"><Button variant="outline" onClick={onView}>View details</Button><Button disabled={providers.length === 0} onClick={onContinue}>Continue to payment</Button></div></div>;
}

function PaymentScreen({ service, amount, guests, provider, eventDate, eventTime, city, onConfirm }: { service: string; amount: number; guests: number; provider: LiveProvider; eventDate: string; eventTime: string; city: string; onConfirm: (bookingCode: string) => void }) {
  const [coupon, setCoupon] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const off = discountFor(coupon, amount); const final = amount - off; const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const confirm = async () => { setBusy(true); try { const booking = await createLiveBooking({ providerId: provider.id, bookingType: service, guests, totalAmount: final, paymentMethod: "cash", eventDate, eventTime, city }); onConfirm(booking.booking_code); } catch (error) { if (error instanceof Error && error.message === "SIGN_IN_REQUIRED") { toast.error("Please sign in before confirming your booking"); window.location.assign("/auth?redirect=/"); } else toast.error("Booking could not be saved. Please try again."); } finally { setBusy(false); } };
  return <div className="mx-auto max-w-2xl animate-rise-in"><StepTitle step="3 of 3" title="Confirm booking" subtitle="Review your booking details" /><div className="rounded-lg border border-border bg-card p-5"><h3 className="mb-4 font-bold">Booking summary</h3><Summary label="Service" value={service} /><Summary label="Provider" value={provider.name} /><Summary label="Date & time" value={`${eventDate} · ${eventTime}`} /><Summary label="City" value={city} /><Summary label="Guests" value={`${guests}`} /><div className="mt-4 border-t border-border pt-4"><Summary label="Package price" value={fmt(amount)} />{off > 0 && <Summary label={`Coupon (${coupon})`} value={`− ${fmt(off)}`} />}<Summary label="Total payable" value={fmt(final)} strong /></div></div><CouponBox applied={coupon} setApplied={setCoupon} /><div className="mt-4 rounded-lg border border-border bg-card p-5"><h3 className="font-bold">Payment method</h3><p className="mt-2 text-sm text-muted-foreground">Cash / pay provider. Online payment is not active yet.</p></div><div className="mt-4 flex gap-3 rounded-lg bg-brand-soft p-4 text-sm text-primary"><ShieldCheck className="size-5 shrink-0" /><p>Your booking request and pending payment record will be saved securely.</p></div><Button disabled={busy || !provider.id || !eventDate || !eventTime} onClick={() => void confirm()} className="mt-5 w-full">{busy ? "Saving booking…" : "Confirm booking"}</Button></div>;
}

function SuccessScreen({ provider, bookingCode, eventDate, onHome }: { provider: LiveProvider; bookingCode: string; eventDate: string; onHome: () => void }) {
    return <div className="mx-auto max-w-lg animate-rise-in py-10 text-center"><span className="mx-auto grid size-20 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-10" /></span><p className="mt-6 text-sm font-bold text-success">BOOKING SAVED</p><h1 className="mt-2 text-3xl font-extrabold">Your event is in good hands.</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{provider.name} has received your booking request. Updates will appear in My Bookings.</p><div className="mt-7 rounded-lg border border-border bg-card p-5 text-left"><Summary label="Booking ID" value={bookingCode} /><Summary label="Provider" value={provider.name} /><Summary label="Event date" value={eventDate} /><div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-brand-soft p-3"><div><p className="text-[10px] font-bold uppercase text-muted-foreground">Provider contact</p><p className="text-sm font-extrabold text-primary">{provider.phone}</p></div><Button size="sm" asChild><a href={`tel:${provider.phone.replace(/\s/g, "")}`}><Headphones className="size-4" /> Call now</a></Button></div></div><Button onClick={onHome} className="mt-5 w-full">Back to home</Button></div>;
}

function StepTitle({ step, title, subtitle }: { step: string; title: string; subtitle: string }) { return <div className="mb-6"><p className="text-xs font-extrabold uppercase text-accent">{step}</p><h1 className="mt-1 text-2xl font-extrabold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full bg-primary ${step.startsWith("1") ? "w-1/3" : step.startsWith("2") ? "w-2/3" : "w-full"}`} /></div></div>; }
function Field({ icon: Icon, label, children }: { icon: ElementType; label: string; children: ReactNode }) { return <div><label className="mb-2 block text-sm font-bold">{label}</label><div className="flex items-center gap-3 rounded-lg border border-border p-3"><Icon className="size-5 text-primary" /><div className="min-w-0 flex-1 text-sm">{children}</div></div></div>; }
function Summary({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-start gap-3 py-2 text-sm"><span className="break-words text-muted-foreground">{label}</span><span className={`${strong ? "font-display text-base font-extrabold text-primary min-[360px]:text-lg" : "font-bold"} min-w-0 break-words text-right`}>{value}</span></div>; }
function NavItem({ icon: Icon, label, active = false, onClick }: { icon: ElementType; label: string; active?: boolean; onClick: () => void }) { return <Button variant="ghost" onClick={onClick} className={`mobile-compact-label h-full min-w-0 rounded-none px-1 flex-col gap-1 text-[11px] ${active ? "text-primary" : "text-muted-foreground"}`}><Icon className="size-5 shrink-0" /><span className="max-w-full truncate">{label}</span></Button>; }

