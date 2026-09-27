import { createContext, useContext, useEffect, useState } from "react";
import { CalendarDays, Check, ChevronRight, Languages, PartyPopper, ShieldCheck, Sparkles, Star, TentTree, Tag, Truck, UtensilsCrossed, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import homeBanner from "@/assets/home-banner.jpg";
import serviceTent from "@/assets/service-tent.jpg";
import serviceDecoration from "@/assets/service-decoration.jpg";
import serviceCatering from "@/assets/service-catering.jpg";
import packagePremium from "@/assets/package-premium.jpg";
import packageStandard from "@/assets/package-standard.jpg";
import packageBasic from "@/assets/package-basic.jpg";

/* ---------- Language ---------- */
export type Lang = "en" | "hi";
const dict = {
  en: { home: "Home", tent: "Tent", decoration: "Decoration", catering: "Catering", cab: "Cab", greeting: "Good morning", hello: "Hello, Dheeraj!", services: "Our services", topRated: "Top rated", combo: "Marriage Combo", comboSub: "Tent + Decoration + Catering in one package", profile: "Profile", language: "Language", viewAll: "View all", offer: "Special offer", offerTitle: "Wedding Season Spectacular Deals", offerSub: "Get up to 20% off on your first booking", explore: "Explore now" },
  hi: { home: "होम", tent: "टेंट", decoration: "सजावट", catering: "केटरिंग", cab: "कैब", greeting: "सुप्रभात", hello: "नमस्ते, धीरज!", services: "हमारी सेवाएँ", topRated: "टॉप रेटेड", combo: "शादी कॉम्बो", comboSub: "टेंट + सजावट + केटरिंग एक ही पैकेज में", profile: "प्रोफ़ाइल", language: "भाषा", viewAll: "सभी देखें", offer: "खास ऑफ़र", offerTitle: "शादी सीज़न के शानदार ऑफ़र", offerSub: "पहली बुकिंग पर 20% तक की छूट", explore: "अभी देखें" },
} as const;
export type TKey = keyof (typeof dict)["en"];
export const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });
export function tr(lang: Lang, k: TKey) { return dict[lang][k]; }
export function useT() { const { lang } = useContext(LangContext); return (k: TKey) => dict[lang][k]; }

export function LanguageToggle() {
  const { lang, setLang } = useContext(LangContext);
  return <div className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-card p-4"><Languages className="size-5 text-primary" /><span className="flex-1 text-sm font-semibold">{dict[lang].language}</span><div className="grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">{(["en", "hi"] as const).map((l) => <Button key={l} size="sm" variant={lang === l ? "default" : "ghost"} onClick={() => setLang(l)} className="h-8 rounded-full px-4">{l === "en" ? "English" : "हिंदी"}</Button>)}</div></div>;
}

/* ---------- Onboarding / Splash ---------- */
const slides = [
  { img: homeBanner, title: "Plan your dream event", text: "Tent, decoration, catering and cabs — everything for your function in one app." },
  { img: serviceTent, title: "Verified local providers", text: "Compare prices, ratings, reviews and photos of trusted providers near you." },
  { img: serviceDecoration, title: "Book & pay your way", text: "Pay online, advance or cash. Get confirmation on WhatsApp, SMS and app." },
];
export function Onboarding({ onDone }: { onDone: () => void }) {
  const [splash, setSplash] = useState(true);
  const [i, setI] = useState(0);
  useEffect(() => { const t = setTimeout(() => setSplash(false), 1400); return () => clearTimeout(t); }, []);
  if (splash) return <div className="fixed inset-0 z-50 grid place-items-center bg-primary text-primary-foreground"><div className="animate-rise-in text-center"><span className="mx-auto grid size-20 place-items-center rounded-2xl bg-card text-primary shadow-panel"><TentTree className="size-11" /></span><p className="mt-5 font-display text-3xl font-extrabold">My<span className="text-accent">Tento</span></p><p className="mt-1 text-xs font-bold uppercase tracking-widest text-primary-foreground/70">Plan. Book. Celebrate.</p></div></div>;
  const s = slides[i] ?? slides[0]!;
  const last = i === slides.length - 1;
  return <div className="fixed inset-0 z-50 flex justify-center bg-background"><div className="flex w-full max-w-md flex-col bg-card">
    <div className="relative h-[55vh] overflow-hidden"><img key={s.img} src={s.img} alt={s.title} className="h-full w-full animate-rise-in object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" /><Button variant="ghost" size="sm" onClick={onDone} className="absolute right-4 top-4 rounded-full bg-card/80">Skip</Button></div>
    <div className="flex flex-1 flex-col px-6 pb-8"><div className="mb-5 flex gap-2">{slides.map((_, n) => <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? "w-8 bg-primary" : "w-3 bg-border"}`} />)}</div>
      <h1 key={s.title} className="animate-rise-in font-display text-3xl font-extrabold text-primary">{s.title}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{s.text}</p>
      <Button size="lg" className="mt-auto w-full" onClick={() => (last ? onDone() : setI(i + 1))}>{last ? "Get started" : "Next"} <ChevronRight className="size-4" /></Button></div>
  </div></div>;
}

/* ---------- Marriage Combo ---------- */
export const combos = [
  { name: "Silver Combo", price: 45000, was: 52000, img: packageBasic, items: ["Standard tent for 200 guests", "Stage + entry gate decoration", "Veg buffet with 12 items"] },
  { name: "Gold Combo", price: 75000, was: 88000, img: packageStandard, items: ["Royal shamiyana for 400 guests", "Mandap, haldi & birthday stage", "Full catering + serving staff", "DJ + RGB night lights"] },
  { name: "Platinum Combo", price: 120000, was: 142000, img: packagePremium, items: ["Luxury tent for 700 guests", "Premium floral theme decoration", "Multi-cuisine catering + counters", "DJ, LED screen & photography", "Branded mineral water"] },
];
export function ComboScreen({ onContinue }: { onContinue: (name: string, price: number) => void }) {
  const [sel, setSel] = useState(1);
  const [date, setDate] = useState("2026-12-25");
  const [guests, setGuests] = useState(400);
  const c = combos[sel] ?? combos[1]!;
  return <div className="animate-rise-in pb-28">
    <div className="relative mb-5 overflow-hidden rounded-[24px] text-primary-foreground"><img src={homeBanner} alt="Wedding combo" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/40" /><div className="relative p-5"><span className="rounded-full bg-accent px-2.5 py-1 text-[9px] font-black uppercase text-accent-foreground">Save up to 15%</span><h1 className="mt-3 font-display text-2xl font-extrabold">Marriage Combo</h1><p className="mt-1 text-xs text-primary-foreground/80">Tent + Decoration + Catering — one booking, one provider team</p><div className="mt-3 flex gap-2">{[TentTree, Sparkles, UtensilsCrossed].map((I, n) => <span key={n} className="grid size-9 place-items-center rounded-full bg-card/20"><I className="size-4" /></span>)}</div></div></div>
    <div className="mb-5 grid grid-cols-2 gap-3"><label className="rounded-lg border border-border p-3"><span className="text-[10px] font-bold uppercase text-muted-foreground">Event date</span><input aria-label="Combo date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full bg-transparent text-sm font-bold outline-none" /></label><div className="rounded-lg border border-border p-3"><span className="text-[10px] font-bold uppercase text-muted-foreground">Guests</span><div className="mt-1 flex items-center justify-between"><button aria-label="Fewer guests" onClick={() => setGuests(Math.max(100, guests - 50))} className="font-bold text-primary">−</button><span className="text-sm font-bold">{guests}</span><button aria-label="More guests" onClick={() => setGuests(guests + 50)} className="font-bold text-primary">+</button></div></div></div>
    <div className="space-y-3">{combos.map((x, n) => <button key={x.name} onClick={() => setSel(n)} className={`w-full overflow-hidden rounded-[20px] border bg-card text-left transition ${sel === n ? "border-primary ring-2 ring-primary/20" : "border-border"}`}><div className="flex gap-3 p-3"><img src={x.img} alt={x.name} loading="lazy" className="size-20 rounded-xl object-cover" /><div className="flex-1"><div className="flex items-center justify-between"><p className="font-extrabold text-primary">{x.name}</p>{sel === n && <Check className="size-5 text-success" />}</div><p className="text-xs text-muted-foreground line-through">₹{x.was.toLocaleString("en-IN")}</p><p className="font-display text-lg font-extrabold">₹{x.price.toLocaleString("en-IN")}</p></div></div><ul className="space-y-1 border-t border-border px-4 py-3">{x.items.map((it) => <li key={it} className="flex items-center gap-2 text-xs"><Check className="size-3.5 text-success" />{it}</li>)}</ul></button>)}</div>
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card p-4 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2"><div className="flex items-center gap-3"><div className="flex-1"><p className="text-[10px] font-bold uppercase text-muted-foreground">{c.name} · {guests} guests</p><p className="font-display text-xl font-extrabold text-primary">₹{c.price.toLocaleString("en-IN")}</p></div><Button size="lg" onClick={() => onContinue(c.name, c.price)}>Book combo <ChevronRight className="size-4" /></Button></div></div>
  </div>;
}

/* ---------- Provider detail: gallery, dates, reviews ---------- */
export const reviews = [
  { name: "Anita Verma", rating: 5, date: "12 Nov 2026", text: "Tent aur stage bahut sundar tha. Team time par aayi aur setup perfect kiya." },
  { name: "Sandeep Yadav", rating: 5, date: "18 Oct 2026", text: "Catering staff very polite, food quality excellent. Highly recommended!" },
  { name: "Priya Singh", rating: 4, date: "02 Oct 2026", text: "Decoration was beautiful, lights thodi der se lagi but overall great experience." },
  { name: "Rahul Mishra", rating: 5, date: "21 Sep 2026", text: "Best price in Lucknow for full wedding setup. Will book again." },
];
type Prov = { name: string; detail: string; price: string; rating: string; initials: string };
const gallery = [serviceTent, serviceDecoration, serviceCatering, packagePremium, packageStandard, homeBanner];
const booked = [3, 7, 8, 14, 20, 25, 26];
export function ProviderDetailFull({ provider, onBook, onReviews }: { provider: Prov; onBook: () => void; onReviews: () => void }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [day, setDay] = useState<number | null>(null);
  return <div className="mx-auto max-w-2xl animate-rise-in pb-4">
    <div className="mb-5 flex items-center gap-4"><span className="grid size-20 place-items-center rounded-2xl bg-brand-soft font-display text-xl font-bold text-primary">{provider.initials}</span><div><h1 className="text-2xl font-extrabold">{provider.name}</h1><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><Star className="size-4 fill-accent text-accent" /> {provider.rating} (128 reviews) · Verified</p><p className="text-xs text-muted-foreground">Gomti Nagar, Lucknow · +91 94150 12345</p></div></div>
    <h2 className="mb-2 font-bold">Service gallery</h2>
    <div className="grid grid-cols-3 gap-2">{gallery.map((g, n) => <button key={n} onClick={() => setPhoto(g)} aria-label={`Open photo ${n + 1}`} className="overflow-hidden rounded-xl"><img src={g} alt={`Work ${n + 1}`} loading="lazy" className="aspect-square w-full object-cover transition hover:scale-105" /></button>)}</div>
    {photo && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/80 p-4" onClick={() => setPhoto(null)}><img src={photo} alt="Gallery" className="max-h-[80vh] rounded-2xl" /><Button size="icon" variant="secondary" aria-label="Close photo" className="absolute right-4 top-4 rounded-full"><X /></Button></div>}
    <h2 className="mb-2 mt-6 flex items-center gap-2 font-bold"><CalendarDays className="size-4 text-primary" /> Available dates · December 2026</h2>
    <div className="rounded-lg border border-border bg-card p-3"><div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground">{["M", "T", "W", "T", "F", "S", "S"].map((d, n) => <span key={n}>{d}</span>)}</div><div className="mt-1 grid grid-cols-7 gap-1">{Array.from({ length: 31 }, (_, n) => n + 1).map((d) => { const b = booked.includes(d); return <button key={d} disabled={b} onClick={() => setDay(d)} className={`aspect-square rounded-md text-xs font-bold ${b ? "bg-muted text-muted-foreground line-through" : day === d ? "bg-primary text-primary-foreground" : "bg-brand-soft text-primary"}`}>{d}</button>; })}</div><div className="mt-3 flex gap-4 text-[10px] text-muted-foreground"><span className="flex items-center gap-1"><span className="size-2.5 rounded bg-brand-soft" /> Available</span><span className="flex items-center gap-1"><span className="size-2.5 rounded bg-muted" /> Booked</span>{day && <span className="font-bold text-primary">Selected: {day} Dec</span>}</div></div>
    <div className="mb-2 mt-6 flex items-center justify-between"><h2 className="font-bold">Ratings & reviews</h2><Button variant="ghost" size="sm" onClick={onReviews}>See all <ChevronRight className="size-4" /></Button></div>
    <ReviewCard r={reviews[0]!} />
    <div className="mt-4 space-y-2 rounded-lg border border-border bg-card p-4 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Capacity</span><b>{provider.detail}</b></div><div className="flex justify-between"><span className="text-muted-foreground">Starting price</span><b className="text-primary">{provider.price}</b></div></div>
    <div className="mt-4 flex gap-2 rounded-lg bg-brand-soft p-4 text-sm text-primary"><ShieldCheck className="size-5 shrink-0" />Identity and service details verified by My Tento.</div>
    <Button onClick={onBook} className="mt-4 w-full" size="lg">Book this provider</Button>
  </div>;
}
function Stars({ n }: { n: number }) { return <span className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-3.5 ${i < n ? "fill-accent text-accent" : "text-border"}`} />)}</span>; }
function ReviewCard({ r }: { r: (typeof reviews)[number] }) { return <div className="rounded-lg border border-border bg-card p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-brand-soft text-xs font-bold text-primary">{r.name.split(" ").map((w) => w[0]).join("")}</span><div className="flex-1"><p className="text-sm font-bold">{r.name}</p><p className="text-[10px] text-muted-foreground">{r.date}</p></div><Stars n={r.rating} /></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{r.text}</p></div>; }

export function ReviewsScreen({ provider }: { provider: Prov }) {
  const [list, setList] = useState(reviews);
  const [text, setText] = useState("");
  const [rate, setRate] = useState(5);
  const bars = [5, 4, 3, 2, 1].map((s) => [s, s === 5 ? 78 : s === 4 ? 16 : s === 3 ? 4 : 1] as const);
  return <div className="mx-auto max-w-2xl animate-rise-in"><h1 className="text-2xl font-extrabold">Reviews</h1><p className="mb-5 text-sm text-muted-foreground">{provider.name}</p>
    <div className="flex items-center gap-5 rounded-lg border border-border bg-card p-4"><div className="text-center"><p className="font-display text-4xl font-extrabold text-primary">{provider.rating}</p><Stars n={5} /><p className="mt-1 text-[10px] text-muted-foreground">{120 + list.length} reviews</p></div><div className="flex-1 space-y-1">{bars.map(([s, p]) => <div key={s} className="flex items-center gap-2 text-[10px]"><span className="w-2">{s}</span><div className="h-1.5 flex-1 rounded-full bg-secondary"><div className="h-full rounded-full bg-accent" style={{ width: `${p}%` }} /></div></div>)}</div></div>
    <div className="mt-4 rounded-lg border border-border bg-card p-4"><p className="text-sm font-bold">Write a review</p><div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map((s) => <button key={s} aria-label={`${s} stars`} onClick={() => setRate(s)}><Star className={`size-6 ${s <= rate ? "fill-accent text-accent" : "text-border"}`} /></button>)}</div><textarea aria-label="Review text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Share your experience..." className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary" rows={3} /><Button className="mt-2 w-full" disabled={!text.trim()} onClick={() => { setList([{ name: "Dheeraj Tagde", rating: rate, date: "Today", text }, ...list]); setText(""); }}>Post review</Button></div>
    <div className="mt-4 space-y-3">{list.map((r, n) => <ReviewCard key={n} r={r} />)}</div>
  </div>;
}

/* ---------- Coupons ---------- */
export const coupons = [
  { code: "MYTENTO20", pct: 20, max: 5000, text: "20% off up to ₹5,000 on first booking" },
  { code: "WEDDING10", pct: 10, max: 10000, text: "10% off up to ₹10,000 on wedding combos" },
  { code: "FESTIVE500", pct: 0, flat: 500, max: 500, text: "Flat ₹500 off on any booking" },
];
export function discountFor(code: string | null, amount: number) {
  const c = coupons.find((x) => x.code === code); if (!c) return 0;
  return c.flat ?? Math.min(Math.round((amount * c.pct) / 100), c.max);
}
export function CouponBox({ applied, setApplied }: { applied: string | null; setApplied: (c: string | null) => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const apply = (c: string) => { const u = c.trim().toUpperCase(); if (coupons.some((x) => x.code === u)) { setApplied(u); setErr(""); setOpen(false); } else setErr("Invalid coupon code"); };
  if (applied) return <div className="mt-4 flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 p-4"><Tag className="size-5 text-success" /><div className="flex-1"><p className="text-sm font-bold text-success">{applied} applied</p><p className="text-xs text-muted-foreground">{coupons.find((x) => x.code === applied)?.text}</p></div><Button size="sm" variant="ghost" onClick={() => setApplied(null)}>Remove</Button></div>;
  return <div className="mt-4 rounded-lg border border-border bg-card p-4"><p className="mb-2 flex items-center gap-2 text-sm font-bold"><Tag className="size-4 text-accent" /> Apply coupon</p><div className="flex gap-2"><input aria-label="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code e.g. MYTENTO20" className="flex-1 rounded-md border border-border bg-background px-3 text-sm uppercase outline-none focus:border-primary" /><Button onClick={() => apply(code)}>Apply</Button></div>{err && <p className="mt-2 text-xs font-semibold text-destructive">{err}</p>}<Button variant="link" size="sm" className="mt-1 px-0" onClick={() => setOpen(!open)}>{open ? "Hide offers" : "View available offers"}</Button>{open && <div className="space-y-2">{coupons.map((c) => <div key={c.code} className="flex items-center gap-3 rounded-lg border border-dashed border-accent/60 bg-warm-soft p-3"><div className="flex-1"><p className="text-sm font-extrabold text-accent">{c.code}</p><p className="text-xs text-muted-foreground">{c.text}</p></div><Button size="sm" variant="outline" onClick={() => apply(c.code)}>Apply</Button></div>)}</div>}</div>;
}

/* ---------- Live tracking ---------- */
const stages = [
  { icon: Check, title: "Booking confirmed", sub: "Payment received · 25 Nov, 10:12 AM" },
  { icon: ShieldCheck, title: "Provider confirmed", sub: "Royal Tent House accepted" },
  { icon: Truck, title: "Team भेजा गया", sub: "Rohit & 6 members on the way" },
  { icon: Wrench, title: "Setup शुरू", sub: "Tent & stage being installed" },
  { icon: PartyPopper, title: "Ready for event", sub: "Enjoy your celebration!" },
];
export function BookingTracker() {
  const [done, setDone] = useState(2);
  const pct = Math.round(((done - 1) / (stages.length - 1)) * 100);
  return <div className="mx-auto max-w-2xl animate-rise-in"><h1 className="text-2xl font-extrabold">Booking details</h1><p className="mb-5 text-sm text-muted-foreground">MT-261225-48</p>
    <div className="rounded-lg border border-border bg-card p-5"><span className="rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-bold uppercase text-success">{stages[done - 1]?.title}</span><h2 className="mt-3 text-xl font-bold">Royal Tent House</h2><p className="text-sm text-muted-foreground">25 Dec 2026 · 6:00 PM · Gomti Nagar</p>
      <div className="mt-5"><div className="mb-1 flex justify-between text-xs font-bold"><span>Live progress</span><span className="text-primary">{pct}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700" style={{ width: `${pct}%` }} /></div></div>
      <div className="mt-6 space-y-0">{stages.map((s, n) => { const ok = n < done; const cur = n === done - 1; const I = s.icon; return <div key={s.title} className="flex gap-3"><div className="flex flex-col items-center"><span className={`grid size-9 place-items-center rounded-full ${ok ? "bg-success text-primary-foreground" : "bg-secondary text-muted-foreground"} ${cur ? "ring-4 ring-success/25" : ""}`}><I className="size-4" /></span>{n < stages.length - 1 && <span className={`h-8 w-0.5 ${n < done - 1 ? "bg-success" : "bg-border"}`} />}</div><div className="pt-1.5"><p className={`text-sm font-bold ${ok ? "" : "text-muted-foreground"}`}>{s.title}</p><p className="text-xs text-muted-foreground">{ok ? s.sub : "Pending"}</p></div></div>; })}</div>
      <Button variant="outline" className="mt-5 w-full" disabled={done === stages.length} onClick={() => setDone(done + 1)}>{done === stages.length ? "Event ready ✓" : "Simulate next update (demo)"}</Button>
      <Button asChild className="mt-2 w-full"><a href="tel:+919415012345">Call provider · +91 94150 12345</a></Button>
    </div>
  </div>;
}
