import { createContext, useContext, useEffect, useState } from "react";
import { CalendarDays, ChevronRight, Languages, ShieldCheck, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import homeBanner from "@/assets/home-banner.webp";
import serviceTent from "@/assets/service-tent.webp";
import serviceDecoration from "@/assets/service-decoration.webp";

/* ---------- Language ---------- */
export type Lang = "en" | "hi";
const dict = {
  en: { home: "Home", tent: "Tent", decoration: "Decoration", catering: "Catering", cab: "Cab", greeting: "Good morning", hello: "Welcome to MyTento", services: "Our services", servicesSub: "Premium Event Planning", trending: "Trending", topRated: "Top rated", combo: "Marriage Combo", comboSub: "Tent + Decoration + Catering in one package", profile: "Profile", language: "Language", viewAll: "View all", offer: "Plan with confidence", offerTitle: "Everything your celebration needs", offerSub: "Compare verified providers near you", explore: "Explore now" },
  hi: { home: "होम", tent: "टेंट", decoration: "सजावट", catering: "केटरिंग", cab: "कैब", greeting: "सुप्रभात", hello: "MyTento में आपका स्वागत है", services: "हमारी सेवाएँ", servicesSub: "प्रीमियम इवेंट प्लानिंग", trending: "ट्रेंडिंग", topRated: "टॉप रेटेड", combo: "शादी कॉम्बो", comboSub: "टेंट + सजावट + केटरिंग एक ही पैकेज में", profile: "प्रोफ़ाइल", language: "भाषा", viewAll: "सभी देखें", offer: "भरोसे के साथ प्लान करें", offerTitle: "आपके जश्न की हर ज़रूरत", offerSub: "नज़दीकी verified providers की तुलना करें", explore: "अभी देखें" },
} as const;
export type TKey = keyof (typeof dict)["en"];
export const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });
export function tr(lang: Lang, k: TKey) { return dict[lang][k]; }
export function useT() { const { lang } = useContext(LangContext); return (k: TKey) => dict[lang][k]; }

export function LanguageToggle() {
  const { lang, setLang } = useContext(LangContext);
  return <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border bg-card p-3 min-[360px]:grid-cols-[auto_minmax(0,1fr)_auto] min-[360px]:p-4"><Languages className="size-5 text-primary" /><span className="text-sm font-semibold">{dict[lang].language}</span><div className="col-span-2 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1 min-[360px]:col-span-1">{(["en", "hi"] as const).map((l) => <Button key={l} size="sm" variant={lang === l ? "default" : "ghost"} onClick={() => setLang(l)} className="h-8 rounded-full px-3 min-[380px]:px-4">{l === "en" ? "English" : "हिंदी"}</Button>)}</div></div>;
}

/* ---------- Onboarding / Splash ---------- */
const slides = [
  { img: homeBanner, title: "Plan your dream event", text: "Tent, decoration, catering and cabs — everything for your function in one app." },
  { img: serviceTent, title: "Verified local providers", text: "Compare prices, ratings, reviews and photos of trusted providers near you." },
  { img: serviceDecoration, title: "Save every booking", text: "Send a booking request and follow its latest status inside MyTento." },
];
export function Onboarding({ onDone }: { onDone: () => void }) {
  const [splash, setSplash] = useState(true);
  const [i, setI] = useState(0);
  useEffect(() => { const t = setTimeout(() => setSplash(false), 600); return () => clearTimeout(t); }, []);
  if (splash) return <div className="safe-top safe-bottom fixed inset-0 z-50 grid place-items-center bg-primary text-primary-foreground"><div className="animate-rise-in text-center"><BrandLogo priority className="mx-auto size-52 drop-shadow-sm" /><p className="mt-3 text-xs font-bold uppercase tracking-widest text-primary-foreground/70">Plan. Book. Celebrate.</p></div></div>;
  const s = slides[i] ?? slides[0]!;
  const last = i === slides.length - 1;
  return <div className="safe-top safe-bottom fixed inset-0 z-50 flex justify-center overflow-y-auto bg-background"><div className="flex min-h-full w-full max-w-md flex-col bg-card">
    <div className="relative min-h-48 flex-[1_1_55svh] overflow-hidden"><img key={s.img} src={s.img} alt={s.title} className="h-full w-full animate-rise-in object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" /><Button variant="ghost" size="sm" onClick={onDone} className="absolute right-4 top-4 rounded-full bg-card/80">Skip</Button></div>
    <div className="flex flex-1 flex-col px-5 pb-5 min-[360px]:px-6 min-[360px]:pb-8"><div className="mb-5 flex gap-2">{slides.map((_, n) => <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? "w-8 bg-primary" : "w-3 bg-border"}`} />)}</div>
      <h1 key={s.title} className="animate-rise-in font-display text-3xl font-extrabold text-primary">{s.title}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{s.text}</p>
      <Button size="lg" className="mt-auto w-full" onClick={() => (last ? onDone() : setI(i + 1))}>{last ? "Get started" : "Next"} <ChevronRight className="size-4" /></Button></div>
  </div></div>;
}

/* ---------- Marriage Combo ---------- */
export function ComboScreen({ onContinue }: { onContinue: (name: string, price: number) => void }) {
  void onContinue;
  return <div className="animate-rise-in"><h1 className="text-2xl font-extrabold">Marriage Combo</h1><p className="mt-1 text-sm text-muted-foreground">Live combo packages</p><p className="mt-5 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">No combo packages are available right now.</p></div>;
}

/* ---------- Provider detail: gallery, dates, reviews ---------- */
type Prov = { id?: string; name: string; detail: string; price: string; rating: string; initials: string; phone?: string; logo?: string | null; banner?: string | null };
export function ProviderDetailFull({ provider, onBook, onReviews }: { provider: Prov; onBook: () => void; onReviews: () => void }) {
  return <div className="mx-auto max-w-2xl animate-rise-in pb-4">
    <div className="mb-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 min-[360px]:gap-4"><span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-soft font-display text-xl font-bold text-primary min-[360px]:size-20">{provider.logo ? <img src={provider.logo} alt="" className="size-full rounded-[inherit] object-cover" /> : provider.initials}</span><div className="min-w-0"><h1 className="break-words text-xl font-extrabold min-[360px]:text-2xl">{provider.name}</h1><p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"><Star className="size-4 shrink-0 fill-accent text-accent" /> {provider.rating} · Verified</p>{provider.phone && <p className="break-words text-xs text-muted-foreground">{provider.phone}</p>}</div></div>
    <h2 className="mb-2 font-bold">Service gallery</h2>{provider.banner ? <img src={provider.banner} alt={`${provider.name} photo`} className="aspect-video w-full rounded-lg border border-border object-cover" /> : <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">This provider has not uploaded any service photos yet.</p>}
    <h2 className="mb-2 mt-6 flex items-center gap-2 font-bold"><CalendarDays className="size-4 text-primary" /> Availability</h2><p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">No availability dates have been published by this provider.</p>
    <div className="mb-2 mt-6 flex items-center justify-between"><h2 className="font-bold">Ratings & reviews</h2><Button variant="ghost" size="sm" onClick={onReviews}>See all <ChevronRight className="size-4" /></Button></div>
    <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Reviews appear after completed customer bookings.</p>
    <div className="mt-4 space-y-2 rounded-lg border border-border bg-card p-4 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Capacity</span><b>{provider.detail}</b></div><div className="flex justify-between"><span className="text-muted-foreground">Starting price</span><b className="text-primary">{provider.price}</b></div></div>
    <div className="mt-4 flex gap-2 rounded-lg bg-brand-soft p-4 text-sm text-primary"><ShieldCheck className="size-5 shrink-0" />Identity and service details verified by My Tento.</div>
    <Button onClick={onBook} className="mt-4 w-full" size="lg">Book this provider</Button>
  </div>;
}

export function ReviewsScreen({ provider }: { provider: Prov }) {
  return <div className="mx-auto max-w-2xl animate-rise-in"><h1 className="text-2xl font-extrabold">Reviews</h1><p className="mb-5 text-sm text-muted-foreground">{provider.name}</p><p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">No verified reviews yet.</p></div>;
}

/* ---------- Coupons ---------- */
export function discountFor(code: string | null, amount: number) {
  void code; void amount; return 0;
}
export function CouponBox({ applied, setApplied }: { applied: string | null; setApplied: (c: string | null) => void }) {
  void applied; void setApplied; return null;
}

/* ---------- Live tracking ---------- */
export function BookingTracker({ booking }: { booking?: { booking_code: string; booking_type: string; event_date: string; event_time: string; city: string; status: string; total_amount: number } | null }) {
  if (!booking) return <div className="mx-auto max-w-2xl animate-rise-in"><h1 className="text-2xl font-extrabold">Booking details</h1><p className="mt-5 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">Select a saved booking to view its current status.</p></div>;
  return <div className="mx-auto max-w-2xl animate-rise-in"><h1 className="text-2xl font-extrabold">{booking.booking_type} booking</h1><p className="mt-1 text-sm text-muted-foreground">{booking.booking_code}</p><div className="mt-5 rounded-lg border border-border bg-card p-5"><p className="text-xs font-bold uppercase text-primary">{booking.status.replaceAll("_", " ")}</p><p className="mt-3 font-bold">{booking.event_date} · {booking.event_time}</p><p className="text-sm text-muted-foreground">{booking.city}</p><p className="mt-4 font-display text-xl font-extrabold text-primary">₹{Number(booking.total_amount).toLocaleString("en-IN")}</p></div></div>;
}
