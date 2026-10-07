import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/image";

const inr = (n: number | null | undefined) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
const Box = ({ children }: { children: React.ReactNode }) => <div className="rounded-lg border border-border bg-card p-4">{children}</div>;
const Empty = ({ text }: { text: string }) => <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">{text}</p>;
const Head = ({ title, sub, onAdd, addLabel }: { title: string; sub: string; onAdd?: () => void; addLabel?: string }) => <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-extrabold">{title}</h2><p className="text-sm text-muted-foreground">{sub}</p></div>{onAdd && <Button onClick={onAdd}><Plus className="size-4" /> {addLabel}</Button>}</div>;

function useInv() {
  const qc = useQueryClient();
  return (...keys: string[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

/* ---------------- Offers ---------------- */
type Offer = { id: string; code: string; title: string; discount_percent: number; max_discount: number | null; active: boolean; starts_at: string | null; ends_at: string | null };
export function AdminOffers() {
  const inv = useInv();
  const { data: rows = [] } = useQuery({ queryKey: ["admin-offers"], queryFn: async () => { const { data, error } = await supabase.from("offers").select("id,code,title,discount_percent,max_discount,active,starts_at,ends_at").order("created_at", { ascending: false }); if (error) throw error; return data as Offer[]; } });
  const [edit, setEdit] = useState<Offer | "new" | null>(null);
  const cur = edit && edit !== "new" ? edit : null;
  const refresh = () => inv("admin-offers", "public-offers");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget); const v = (k: string) => String(f.get(k) ?? "").trim();
    const pct = Number(v("discount_percent"));
    if (!v("code") || !v("title") || !(pct > 0 && pct <= 100)) { toast.error("Code, title aur 1-100% discount bhariye"); return; }
    const payload = { code: v("code").toUpperCase().replace(/\s+/g, ""), title: v("title"), discount_percent: pct, max_discount: v("max_discount") ? Number(v("max_discount")) : null, starts_at: v("starts_at") ? new Date(v("starts_at")).toISOString() : null, ends_at: v("ends_at") ? new Date(`${v("ends_at")}T23:59:59`).toISOString() : null };
    const { error } = cur ? await supabase.from("offers").update(payload).eq("id", cur.id) : await supabase.from("offers").insert({ ...payload, active: true });
    if (error) { toast.error(error.message.includes("duplicate") ? "Ye code pehle se hai" : "Offer save nahi hua"); return; }
    toast.success("Offer saved"); setEdit(null); await refresh();
  }
  const toggle = async (o: Offer) => { const { error } = await supabase.from("offers").update({ active: !o.active }).eq("id", o.id); if (error) toast.error("Update nahi hua"); else await refresh(); };
  const del = async (o: Offer) => { if (!confirm(`Delete offer ${o.code}?`)) return; const { error } = await supabase.from("offers").delete().eq("id", o.id); if (error) toast.error("Delete nahi hua"); else { toast.success("Deleted"); await refresh(); } };
  return <>
    <Head title="Offers" sub="Discount codes jo customers booking par use kar sakte hain" onAdd={() => setEdit("new")} addLabel="Create offer" />
    {rows.length === 0 ? <Empty text="Abhi koi offer nahi hai. 'Create offer' se banaiye." /> : <div className="grid gap-3 lg:grid-cols-2">{rows.map((o) => <Box key={o.id}><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><b className="font-mono">{o.code}</b><p className="text-sm">{o.title}</p><p className="text-xs text-muted-foreground">{o.discount_percent}% off{o.max_discount ? ` · max ${inr(o.max_discount)}` : ""}{o.ends_at ? ` · till ${new Date(o.ends_at).toLocaleDateString("en-IN")}` : ""}</p></div><Button size="sm" variant={o.active ? "default" : "outline"} onClick={() => void toggle(o)}>{o.active ? "Active" : "Paused"}</Button><Button size="icon" variant="outline" aria-label="Edit" onClick={() => setEdit(o)}><Pencil className="size-4" /></Button><Button size="icon" variant="outline" aria-label="Delete" onClick={() => void del(o)}><Trash2 className="size-4 text-destructive" /></Button></div></Box>)}</div>}
    <Dialog open={edit !== null} onOpenChange={(o) => !o && setEdit(null)}><DialogContent><DialogHeader><DialogTitle>{cur ? "Edit offer" : "Create offer"}</DialogTitle><DialogDescription>Active offers sabhi customers ko dikhte hain.</DialogDescription></DialogHeader>
      <form key={cur?.id ?? "new"} onSubmit={(e) => void save(e)} className="grid gap-3">
        <div className="grid gap-1"><Label htmlFor="code">Coupon code</Label><Input id="code" name="code" defaultValue={cur?.code} placeholder="SHAADI10" /></div>
        <div className="grid gap-1"><Label htmlFor="title">Title</Label><Input id="title" name="title" defaultValue={cur?.title} placeholder="Wedding season 10% off" /></div>
        <div className="grid grid-cols-2 gap-3"><div className="grid gap-1"><Label htmlFor="pct">Discount %</Label><Input id="pct" name="discount_percent" type="number" min={1} max={100} defaultValue={cur?.discount_percent ?? 10} /></div><div className="grid gap-1"><Label htmlFor="max">Max discount ₹ (optional)</Label><Input id="max" name="max_discount" type="number" min={0} defaultValue={cur?.max_discount ?? ""} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div className="grid gap-1"><Label htmlFor="s">Start date (optional)</Label><Input id="s" name="starts_at" type="date" defaultValue={cur?.starts_at?.slice(0, 10) ?? ""} /></div><div className="grid gap-1"><Label htmlFor="e">End date (optional)</Label><Input id="e" name="ends_at" type="date" defaultValue={cur?.ends_at?.slice(0, 10) ?? ""} /></div></div>
        <DialogFooter><Button type="submit">Save offer</Button></DialogFooter>
      </form></DialogContent></Dialog>
  </>;
}

/* ---------------- Banners ---------------- */
type Banner = { id: string; banner_type: string; title: string; subtitle: string; image_url: string | null; active: boolean; sort_order: number };
export function AdminBanners() {
  const inv = useInv();
  const { data: rows = [] } = useQuery({ queryKey: ["admin-banners"], queryFn: async () => { const { data, error } = await supabase.from("banners").select("id,banner_type,title,subtitle,image_url,active,sort_order").order("sort_order"); if (error) throw error; return data as Banner[]; } });
  const [edit, setEdit] = useState<Banner | "new" | null>(null);
  const [img, setImg] = useState<string | null>(null);
  const cur = edit && edit !== "new" ? edit : null;
  const refresh = () => inv("admin-banners", "public-banners");
  const open = (b: Banner | "new") => { setEdit(b); setImg(b === "new" ? null : b.image_url); };
  async function pick(file?: File) { if (!file) return; try { setImg(await compressImage(file, 1280, 0.78)); } catch { toast.error("Image read nahi ho payi"); } }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget); const v = (k: string) => String(f.get(k) ?? "").trim();
    if (!v("title")) { toast.error("Title bhariye"); return; }
    const payload = { title: v("title"), subtitle: v("subtitle"), banner_type: v("banner_type") || "offer", sort_order: Number(v("sort_order") || 0), image_url: img };
    const { error } = cur ? await supabase.from("banners").update(payload).eq("id", cur.id) : await supabase.from("banners").insert({ ...payload, active: true });
    if (error) { toast.error("Banner save nahi hua"); return; }
    toast.success("Banner saved"); setEdit(null); await refresh();
  }
  const toggle = async (b: Banner) => { const { error } = await supabase.from("banners").update({ active: !b.active }).eq("id", b.id); if (error) toast.error("Update nahi hua"); else await refresh(); };
  const del = async (b: Banner) => { if (!confirm("Delete this banner?")) return; const { error } = await supabase.from("banners").delete().eq("id", b.id); if (error) toast.error("Delete nahi hua"); else { toast.success("Deleted"); await refresh(); } };
  return <>
    <Head title="Banners" sub="Customer app ke home screen par dikhne wale banners" onAdd={() => open("new")} addLabel="Create banner" />
    {rows.length === 0 ? <Empty text="Abhi koi banner nahi hai. 'Create banner' se photo upload karke banaiye." /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((b) => <div key={b.id} className="overflow-hidden rounded-lg border border-border bg-card"><div className="aspect-[16/7] bg-secondary">{b.image_url ? <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>}</div><div className="p-3"><b>{b.title}</b><p className="text-xs text-muted-foreground">{b.banner_type} · order {b.sort_order} · {b.subtitle}</p><div className="mt-3 flex gap-2"><Button size="sm" variant={b.active ? "default" : "outline"} onClick={() => void toggle(b)}>{b.active ? "Active" : "Paused"}</Button><Button size="icon" variant="outline" aria-label="Edit" onClick={() => open(b)}><Pencil className="size-4" /></Button><Button size="icon" variant="outline" aria-label="Delete" onClick={() => void del(b)}><Trash2 className="size-4 text-destructive" /></Button></div></div></div>)}</div>}
    <Dialog open={edit !== null} onOpenChange={(o) => !o && setEdit(null)}><DialogContent><DialogHeader><DialogTitle>{cur ? "Edit banner" : "Create banner"}</DialogTitle><DialogDescription>Wide photo (16:7) sabse achhi dikhti hai.</DialogDescription></DialogHeader>
      <form key={cur?.id ?? "new"} onSubmit={(e) => void save(e)} className="grid gap-3">
        <label className="grid aspect-[16/7] cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary text-sm text-muted-foreground">{img ? <img src={img} alt="Banner preview" className="h-full w-full object-cover" /> : <span className="flex items-center gap-2"><ImagePlus className="size-5" /> Banner photo upload karein</span>}<input type="file" accept="image/*" aria-label="Banner image" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} /></label>
        <div className="grid gap-1"><Label htmlFor="bt">Title</Label><Input id="bt" name="title" defaultValue={cur?.title} placeholder="Wedding season offer" /></div>
        <div className="grid gap-1"><Label htmlFor="bs">Subtitle</Label><Input id="bs" name="subtitle" defaultValue={cur?.subtitle} placeholder="Tent + decoration par 10% off" /></div>
        <div className="grid grid-cols-2 gap-3"><div className="grid gap-1"><Label htmlFor="ty">Type</Label><select id="ty" name="banner_type" defaultValue={cur?.banner_type ?? "offer"} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="offer">Offer</option><option value="update">Update</option><option value="announcement">Announcement</option></select></div><div className="grid gap-1"><Label htmlFor="so">Order</Label><Input id="so" name="sort_order" type="number" defaultValue={cur?.sort_order ?? rows.length} /></div></div>
        <DialogFooter><Button type="submit">Save banner</Button></DialogFooter>
      </form></DialogContent></Dialog>
  </>;
}

/* ---------------- Cab control ---------------- */
type Vehicle = { id: string; vehicle_type: string; vehicle_number: string; seats: number; base_fare: number; per_km_rate: number; active: boolean; created_at: string; providers: { business_name: string; phone: string; city: string; area: string; verified: boolean } | null };
export function AdminCabs() {
  const inv = useInv();
  const { data: rows = [] } = useQuery({ queryKey: ["admin-vehicles"], queryFn: async () => { const { data, error } = await supabase.from("vehicles").select("id,vehicle_type,vehicle_number,seats,base_fare,per_km_rate,active,created_at,providers(business_name,phone,city,area,verified)").order("created_at", { ascending: false }); if (error) throw error; return data as unknown as Vehicle[]; } });
  const [view, setView] = useState<Vehicle | null>(null);
  const [editing, setEditing] = useState(false);
  const toggle = async (v: Vehicle) => { const { error } = await supabase.from("vehicles").update({ active: !v.active }).eq("id", v.id); if (error) toast.error("Update nahi hua"); else { await inv("admin-vehicles", "public-vehicles"); setView((x) => (x?.id === v.id ? { ...x, active: !v.active } : x)); } };
  async function saveRates(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!view) return; const f = new FormData(e.currentTarget);
    const payload = { base_fare: Number(f.get("base_fare")), per_km_rate: Number(f.get("per_km_rate")), seats: Number(f.get("seats")) };
    const { error } = await supabase.from("vehicles").update(payload).eq("id", view.id);
    if (error) { toast.error("Rates save nahi hue"); return; }
    toast.success("Rates updated"); setView({ ...view, ...payload }); setEditing(false); await inv("admin-vehicles", "public-vehicles");
  }
  const D = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0"><span className="text-muted-foreground">{k}</span><span className="text-right font-semibold">{v}</span></div>;
  return <>
    <Head title="Cab control" sub="Sabhi vehicles, unke provider aur rates" />
    {rows.length === 0 ? <Empty text="Abhi koi vehicle registered nahi hai." /> : <div className="grid gap-3 lg:grid-cols-2">{rows.map((v) => <Box key={v.id}><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><b>{v.vehicle_type} · {v.vehicle_number}</b><p className="text-xs text-muted-foreground">{v.providers?.business_name ?? "No provider"} · {v.providers?.city ?? "—"} · {v.seats} seats</p><p className="text-xs text-muted-foreground">{inr(v.base_fare)} base + {inr(v.per_km_rate)}/km</p></div><Button size="sm" variant="outline" onClick={() => { setView(v); setEditing(false); }}><Eye className="size-4" /> View</Button><Button size="sm" variant={v.active ? "default" : "outline"} onClick={() => void toggle(v)}>{v.active ? "Active" : "Paused"}</Button></div></Box>)}</div>}
    <Dialog open={view !== null} onOpenChange={(o) => !o && setView(null)}><DialogContent>{view && <><DialogHeader><DialogTitle>{view.vehicle_type} · {view.vehicle_number}</DialogTitle><DialogDescription>Vehicle aur provider details verify karein.</DialogDescription></DialogHeader>
      {editing ? <form onSubmit={(e) => void saveRates(e)} className="grid gap-3"><div className="grid grid-cols-3 gap-3"><div className="grid gap-1"><Label htmlFor="bf">Base fare ₹</Label><Input id="bf" name="base_fare" type="number" min={0} defaultValue={view.base_fare} /></div><div className="grid gap-1"><Label htmlFor="pk">Per km ₹</Label><Input id="pk" name="per_km_rate" type="number" min={0} step="0.5" defaultValue={view.per_km_rate} /></div><div className="grid gap-1"><Label htmlFor="se">Seats</Label><Input id="se" name="seats" type="number" min={1} defaultValue={view.seats} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button><Button type="submit">Save rates</Button></DialogFooter></form> : <>
      <div><D k="Vehicle type" v={view.vehicle_type} /><D k="Vehicle number" v={view.vehicle_number} /><D k="Seats" v={view.seats} /><D k="Base fare" v={inr(view.base_fare)} /><D k="Per km rate" v={inr(view.per_km_rate)} /><D k="Status" v={view.active ? "Active" : "Paused"} /><D k="Added on" v={new Date(view.created_at).toLocaleDateString("en-IN")} /><D k="Provider" v={view.providers?.business_name ?? "—"} /><D k="Provider phone" v={view.providers?.phone ? <a className="text-primary underline" href={`tel:${view.providers.phone}`}>{view.providers.phone}</a> : "—"} /><D k="City / area" v={`${view.providers?.city ?? "—"}${view.providers?.area ? ` · ${view.providers.area}` : ""}`} /><D k="Provider verified" v={view.providers?.verified ? "Yes" : "No"} /></div>
      <DialogFooter><Button variant="outline" onClick={() => setEditing(true)}><Pencil className="size-4" /> Edit rates</Button><Button variant={view.active ? "outline" : "default"} onClick={() => void toggle(view)}>{view.active ? "Pause vehicle" : "Activate vehicle"}</Button></DialogFooter></>}
    </>}</DialogContent></Dialog>
  </>;
}
