import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const field = "mt-1 w-full rounded-md border border-border bg-background p-2.5 text-sm outline-none focus:border-primary";
const inr = (n: number | string) => `₹${Number(n).toLocaleString("en-IN")}`;

function Card({ title, sub, action, children }: { title: string; sub?: string; action?: ReactNode; children: ReactNode }) {
  return <section className="mt-5 rounded-lg border border-border bg-card p-4"><div className="mb-3 flex items-start justify-between gap-2"><div><h2 className="font-bold">{title}</h2>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>{action}</div>{children}</section>;
}
function Empty({ text }: { text: string }) { return <p className="text-sm text-muted-foreground">{text}</p>; }
function Row({ title, sub, active, onEdit, onToggle, onDelete }: { title: string; sub: string; active?: boolean; onEdit?: () => void; onToggle?: () => void; onDelete: () => void }) {
  return <div className="flex items-center gap-2 border-t border-border py-2.5 first:border-t-0"><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{title}</p><p className="truncate text-xs text-muted-foreground">{sub}</p></div>{onToggle && <Button size="sm" variant="outline" onClick={onToggle} className="h-8 px-2 text-xs">{active ? "Pause" : "Activate"}</Button>}{onEdit && <Button size="icon" variant="ghost" aria-label="Edit" onClick={onEdit} className="size-8"><Pencil className="size-4" /></Button>}<Button size="icon" variant="ghost" aria-label="Delete" onClick={onDelete} className="size-8 text-destructive"><Trash2 className="size-4" /></Button></div>;
}
function useInvalidate() { const qc = useQueryClient(); return (...keys: string[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] }))); }
function done(error: { message: string } | null, ok: string) { if (error) { toast.error(error.message); return false; } toast.success(ok); return true; }

/* ---------- Business profile ---------- */
export function BusinessEditor({ providerId }: { providerId: string }) {
  const inv = useInvalidate();
  const { data } = useQuery({ queryKey: ["provider-business", providerId], queryFn: async () => { const { data, error } = await supabase.from("providers").select("business_name,description,phone,city,area,logo_url,banner_url,verified").eq("id", providerId).single(); if (error) throw error; return data; } });
  const [logo, setLogo] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  useEffect(() => { void (async () => {
    for (const [path, set] of [[data?.logo_url, setLogo], [data?.banner_url, setBanner]] as const) {
      if (path) { const { data: s } = await supabase.storage.from("provider-media").createSignedUrl(path, 3600); set(s?.signedUrl ?? null); }
    }
  })(); }, [data?.logo_url, data?.banner_url]);
  if (!data) return null;

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget); const v = (k: string) => String(f.get(k) ?? "").trim();
    const { error } = await supabase.from("providers").update({ business_name: v("business_name"), description: v("description"), phone: v("phone"), city: v("city"), area: v("area") }).eq("id", providerId);
    if (done(error, "Business details saved")) await inv("provider-business", "provider-profile", "providers");
  }
  async function upload(kind: "logo_url" | "banner_url", file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    const { data: auth } = await supabase.auth.getUser(); if (!auth.user) return;
    const path = `${auth.user.id}/${kind === "logo_url" ? "logo" : "banner"}-${Date.now()}.${file.name.split(".").pop() || "jpg"}`;
    const { error } = await supabase.storage.from("provider-media").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { error: e2 } = await supabase.from("providers").update({ [kind]: path }).eq("id", providerId);
    if (done(e2, "Photo uploaded")) await inv("provider-business");
  }
  return <Card title="Business details" sub={data.verified ? "Verified by MyTento" : "Waiting for admin verification"}>
    <div className="mb-4 grid grid-cols-[auto_1fr] gap-3">
      <label className="grid size-20 cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary text-center text-[10px] text-muted-foreground">{logo ? <img src={logo} alt="Logo" className="size-full object-cover" /> : <span><Upload className="mx-auto size-4" />Logo</span>}<input type="file" accept="image/*" className="hidden" onChange={(e) => void upload("logo_url", e.target.files?.[0])} /></label>
      <label className="grid h-20 cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary text-xs text-muted-foreground">{banner ? <img src={banner} alt="Business photo" className="size-full object-cover" /> : <span className="flex items-center gap-1"><Upload className="size-4" />Business photo</span>}<input type="file" accept="image/*" className="hidden" onChange={(e) => void upload("banner_url", e.target.files?.[0])} /></label>
    </div>
    <form onSubmit={(e) => void save(e)} className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-bold">Business name<input name="business_name" required defaultValue={data.business_name} className={field} /></label>
      <label className="text-xs font-bold">Phone<input name="phone" required defaultValue={data.phone} className={field} /></label>
      <label className="text-xs font-bold">City<input name="city" required defaultValue={data.city} className={field} /></label>
      <label className="text-xs font-bold">Area<input name="area" defaultValue={data.area} className={field} /></label>
      <label className="text-xs font-bold sm:col-span-2">About<textarea name="description" rows={3} defaultValue={data.description} className={field} /></label>
      <Button type="submit" className="sm:col-span-2">Save details</Button>
    </form>
  </Card>;
}

/* ---------- Services & prices ---------- */
export function ServicesManager({ providerId }: { providerId: string }) {
  const inv = useInvalidate();
  const { data: catalogue = [] } = useQuery({ queryKey: ["services-catalogue"], queryFn: async () => { const { data } = await supabase.from("services").select("id,name").eq("active", true).order("sort_order"); return data ?? []; } });
  const { data: rows = [] } = useQuery({ queryKey: ["my-provider-services", providerId], queryFn: async () => { const { data, error } = await supabase.from("provider_services").select("id,service_id,base_price,details,active").eq("provider_id", providerId); if (error) throw error; return data ?? []; } });
  const [edit, setEdit] = useState<(typeof rows)[number] | "new" | null>(null);
  const name = (id: string) => catalogue.find((s) => s.id === id)?.name ?? "Service";
  const refresh = () => inv("my-provider-services", "providers", "admin-provider-services");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const payload = { service_id: String(f.get("service_id")), base_price: Number(f.get("base_price")), details: String(f.get("details") ?? "").trim() };
    const { error } = edit === "new" ? await supabase.from("provider_services").insert({ ...payload, provider_id: providerId, active: true }) : await supabase.from("provider_services").update(payload).eq("id", (edit as { id: string }).id);
    if (done(error, "Service saved")) { setEdit(null); await refresh(); }
  }
  return <Card title="My services & prices" sub="Customers see active services after verification" action={<Button size="sm" onClick={() => setEdit("new")}><Plus className="size-4" />Add</Button>}>
    {edit && <form onSubmit={(e) => void submit(e)} className="mb-3 grid gap-2 rounded-md bg-secondary p-3 sm:grid-cols-3">
      <label className="text-xs font-bold">Service<select name="service_id" required defaultValue={edit !== "new" ? edit.service_id : ""} className={field}><option value="" disabled>Select</option>{catalogue.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label className="text-xs font-bold">Price (₹)<input name="base_price" type="number" min={0} required defaultValue={edit !== "new" ? edit.base_price : ""} className={field} /></label>
      <label className="text-xs font-bold">Details<input name="details" defaultValue={edit !== "new" ? edit.details : ""} placeholder="e.g. per guest, includes setup" className={field} /></label>
      <div className="flex gap-2 sm:col-span-3"><Button type="button" variant="outline" onClick={() => setEdit(null)} className="flex-1">Cancel</Button><Button type="submit" className="flex-1">Save</Button></div>
    </form>}
    {rows.length === 0 ? <Empty text="No services added yet." /> : rows.map((r) => <Row key={r.id} title={`${name(r.service_id)} · ${inr(r.base_price)}`} sub={`${r.active ? "Active" : "Paused"}${r.details ? ` · ${r.details}` : ""}`} active={r.active} onEdit={() => setEdit(r)} onToggle={async () => { const { error } = await supabase.from("provider_services").update({ active: !r.active }).eq("id", r.id); if (done(error, "Updated")) await refresh(); }} onDelete={async () => { if (!confirm("Delete this service?")) return; const { error } = await supabase.from("provider_services").delete().eq("id", r.id); if (done(error, "Deleted")) await refresh(); }} />)}
  </Card>;
}

/* ---------- Equipment / inventory ---------- */
export function InventoryManager({ providerId }: { providerId: string }) {
  const inv = useInvalidate();
  const { data: rows = [] } = useQuery({ queryKey: ["my-inventory", providerId], queryFn: async () => { const { data, error } = await supabase.from("inventory_items").select("id,category,name,price,active").eq("provider_id", providerId).order("created_at"); if (error) throw error; return data ?? []; } });
  const [edit, setEdit] = useState<(typeof rows)[number] | "new" | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const payload = { name: String(f.get("name")).trim(), category: String(f.get("category")).trim(), price: Number(f.get("price")) };
    const { error } = edit === "new" ? await supabase.from("inventory_items").insert({ ...payload, provider_id: providerId, active: true }) : await supabase.from("inventory_items").update(payload).eq("id", (edit as { id: string }).id);
    if (done(error, "Item saved")) { setEdit(null); await inv("my-inventory"); }
  }
  return <Card title="Equipment & items" sub="Chairs, lights, sound, gadgets with per-unit price" action={<Button size="sm" onClick={() => setEdit("new")}><Plus className="size-4" />Add</Button>}>
    {edit && <form onSubmit={(e) => void submit(e)} className="mb-3 grid gap-2 rounded-md bg-secondary p-3 sm:grid-cols-3">
      <label className="text-xs font-bold">Item name<input name="name" required defaultValue={edit !== "new" ? edit.name : ""} className={field} /></label>
      <label className="text-xs font-bold">Category<input name="category" required defaultValue={edit !== "new" ? edit.category : ""} placeholder="Furniture, Lighting…" className={field} /></label>
      <label className="text-xs font-bold">Price per unit (₹)<input name="price" type="number" min={0} required defaultValue={edit !== "new" ? edit.price : ""} className={field} /></label>
      <div className="flex gap-2 sm:col-span-3"><Button type="button" variant="outline" onClick={() => setEdit(null)} className="flex-1">Cancel</Button><Button type="submit" className="flex-1">Save</Button></div>
    </form>}
    {rows.length === 0 ? <Empty text="No equipment added yet." /> : rows.map((r) => <Row key={r.id} title={`${r.name} · ${inr(r.price)}`} sub={`${r.category} · ${r.active ? "Active" : "Paused"}`} active={r.active} onEdit={() => setEdit(r)} onToggle={async () => { const { error } = await supabase.from("inventory_items").update({ active: !r.active }).eq("id", r.id); if (done(error, "Updated")) await inv("my-inventory"); }} onDelete={async () => { if (!confirm("Delete this item?")) return; const { error } = await supabase.from("inventory_items").delete().eq("id", r.id); if (done(error, "Deleted")) await inv("my-inventory"); }} />)}
  </Card>;
}

/* ---------- Vehicles ---------- */
export function VehiclesManager({ providerId }: { providerId: string }) {
  const inv = useInvalidate();
  const { data: rows = [] } = useQuery({ queryKey: ["my-vehicles", providerId], queryFn: async () => { const { data, error } = await supabase.from("vehicles").select("id,vehicle_type,vehicle_number,seats,base_fare,per_km_rate,active").eq("provider_id", providerId).order("created_at"); if (error) throw error; return data ?? []; } });
  const [edit, setEdit] = useState<(typeof rows)[number] | "new" | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const payload = { vehicle_type: String(f.get("vehicle_type")), vehicle_number: String(f.get("vehicle_number")).trim().toUpperCase(), seats: Number(f.get("seats")), base_fare: Number(f.get("base_fare")), per_km_rate: Number(f.get("per_km_rate")) };
    const { error } = edit === "new" ? await supabase.from("vehicles").insert({ ...payload, provider_id: providerId, active: true }) : await supabase.from("vehicles").update(payload).eq("id", (edit as { id: string }).id);
    if (done(error, "Vehicle saved")) { setEdit(null); await inv("my-vehicles", "vehicles", "admin-vehicles"); }
  }
  return <Card title="My vehicles" sub="Vehicle number, seats and fares" action={<Button size="sm" onClick={() => setEdit("new")}><Plus className="size-4" />Add</Button>}>
    {edit && <form onSubmit={(e) => void submit(e)} className="mb-3 grid grid-cols-2 gap-2 rounded-md bg-secondary p-3 sm:grid-cols-5">
      <label className="text-xs font-bold">Type<select name="vehicle_type" defaultValue={edit !== "new" ? edit.vehicle_type : "Cab"} className={field}>{["Toto", "Auto", "Cab", "SUV", "Tempo Traveller", "Bus"].map((t) => <option key={t}>{t}</option>)}</select></label>
      <label className="text-xs font-bold">Number<input name="vehicle_number" required defaultValue={edit !== "new" ? edit.vehicle_number : ""} placeholder="UP32 AB 1234" className={field} /></label>
      <label className="text-xs font-bold">Seats<input name="seats" type="number" min={1} required defaultValue={edit !== "new" ? edit.seats : 4} className={field} /></label>
      <label className="text-xs font-bold">Base fare ₹<input name="base_fare" type="number" min={0} required defaultValue={edit !== "new" ? edit.base_fare : ""} className={field} /></label>
      <label className="text-xs font-bold">Per km ₹<input name="per_km_rate" type="number" min={0} step="0.5" required defaultValue={edit !== "new" ? edit.per_km_rate : ""} className={field} /></label>
      <div className="col-span-2 flex gap-2 sm:col-span-5"><Button type="button" variant="outline" onClick={() => setEdit(null)} className="flex-1">Cancel</Button><Button type="submit" className="flex-1">Save</Button></div>
    </form>}
    {rows.length === 0 ? <Empty text="No vehicles added yet." /> : rows.map((r) => <Row key={r.id} title={`${r.vehicle_type} · ${r.vehicle_number}`} sub={`${r.seats} seats · ${inr(r.base_fare)} + ${inr(r.per_km_rate)}/km · ${r.active ? "Active" : "Paused"}`} active={r.active} onEdit={() => setEdit(r)} onToggle={async () => { const { error } = await supabase.from("vehicles").update({ active: !r.active }).eq("id", r.id); if (done(error, "Updated")) await inv("my-vehicles", "vehicles"); }} onDelete={async () => { if (!confirm("Delete this vehicle?")) return; const { error } = await supabase.from("vehicles").delete().eq("id", r.id); if (done(error, "Deleted")) await inv("my-vehicles", "vehicles"); }} />)}
  </Card>;
}

/* ---------- Team ---------- */
export function useTeam(providerId?: string) {
  return useQuery({ queryKey: ["my-team", providerId], enabled: Boolean(providerId), queryFn: async () => { const { data, error } = await supabase.from("team_members").select("id,name,phone,role,active").eq("provider_id", providerId ?? "").order("created_at"); if (error) throw error; return data ?? []; } });
}
export function TeamManager({ providerId }: { providerId: string }) {
  const inv = useInvalidate();
  const { data: rows = [] } = useTeam(providerId);
  const [adding, setAdding] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const { error } = await supabase.from("team_members").insert({ provider_id: providerId, name: String(f.get("name")).trim(), phone: String(f.get("phone")).trim(), role: String(f.get("role")).trim() });
    if (done(error, "Team member added")) { setAdding(false); await inv("my-team"); }
  }
  return <Card title="My team" sub="Assign these members to bookings" action={<Button size="sm" onClick={() => setAdding(true)}><Plus className="size-4" />Add</Button>}>
    {adding && <form onSubmit={(e) => void submit(e)} className="mb-3 grid gap-2 rounded-md bg-secondary p-3 sm:grid-cols-3">
      <label className="text-xs font-bold">Name<input name="name" required className={field} /></label>
      <label className="text-xs font-bold">Phone<input name="phone" className={field} /></label>
      <label className="text-xs font-bold">Role<input name="role" placeholder="Team lead, Driver…" className={field} /></label>
      <div className="flex gap-2 sm:col-span-3"><Button type="button" variant="outline" onClick={() => setAdding(false)} className="flex-1">Cancel</Button><Button type="submit" className="flex-1">Save</Button></div>
    </form>}
    {rows.length === 0 ? <Empty text="No team members yet." /> : rows.map((r) => <Row key={r.id} title={r.name} sub={[r.role, r.phone].filter(Boolean).join(" · ") || "Team member"} onDelete={async () => { if (!confirm("Remove this member?")) return; const { error } = await supabase.from("team_members").delete().eq("id", r.id); if (done(error, "Removed")) await inv("my-team"); }} />)}
  </Card>;
}

/* ---------- Reviews ---------- */
export function ReviewsList({ providerId }: { providerId: string }) {
  const { data: rows = [] } = useQuery({ queryKey: ["my-reviews", providerId], queryFn: async () => { const { data, error } = await supabase.from("reviews").select("id,rating,comment,created_at").eq("provider_id", providerId).order("created_at", { ascending: false }); if (error) throw error; return data ?? []; } });
  return <Card title="Customer reviews" sub={`${rows.length} review${rows.length === 1 ? "" : "s"}`}>
    {rows.length === 0 ? <Empty text="No reviews yet. Reviews appear after completed bookings." /> : rows.map((r) => <div key={r.id} className="border-t border-border py-2.5 first:border-t-0"><p className="flex items-center gap-1 text-sm font-bold">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-accent text-accent" : "text-border"}`} />)}<span className="ml-2 text-xs font-normal text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-IN")}</span></p>{r.comment && <p className="mt-1 text-sm">{r.comment}</p>}</div>)}
  </Card>;
}

/* ---------- Calendar editor ---------- */
export function CalendarEditor({ providerId, availability }: { providerId: string; availability: { id: string; available_date: string; status: string }[] }) {
  const inv = useInvalidate();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const map = new Map(availability.map((a) => [a.available_date, a]));
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = month.getDay();
  const today = new Date().toISOString().slice(0, 10);
  const key = (d: number) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  async function cycle(date: string) {
    const cur = map.get(date);
    const next = !cur ? "available" : cur.status === "available" ? "booked" : null;
    const { error } = next === null ? await supabase.from("provider_availability").delete().eq("id", cur!.id) : cur ? await supabase.from("provider_availability").update({ status: next }).eq("id", cur.id) : await supabase.from("provider_availability").insert({ provider_id: providerId, available_date: date, status: next });
    if (error) return toast.error(error.message);
    await inv("provider-availability");
  }
  return <div className="rounded-lg border border-border bg-card p-4">
    <div className="mb-3 flex items-center justify-between"><Button size="sm" variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</Button><p className="font-bold">{month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p><Button size="sm" variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</Button></div>
    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted-foreground">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
    <div className="mt-1 grid grid-cols-7 gap-1">{Array.from({ length: offset }, (_, i) => <span key={`e${i}`} />)}{Array.from({ length: days }, (_, i) => { const date = key(i + 1); const s = map.get(date)?.status; const past = date < today; return <button key={date} disabled={past} onClick={() => void cycle(date)} className={`aspect-square rounded-md text-sm font-bold transition disabled:opacity-30 ${s === "available" ? "bg-success/15 text-success" : s === "booked" ? "bg-destructive/15 text-destructive" : "bg-secondary"}`}>{i + 1}</button>; })}</div>
    <div className="mt-3 flex flex-wrap gap-3 text-xs"><span className="flex items-center gap-1"><span className="size-3 rounded bg-success/30" />Available</span><span className="flex items-center gap-1"><span className="size-3 rounded bg-destructive/30" />Already booked</span><span className="flex items-center gap-1"><span className="size-3 rounded bg-secondary" />Not set</span></div>
    <p className="mt-2 text-xs text-muted-foreground">Tap a date: Not set → Available → Booked → Not set</p>
  </div>;
}

/* ---------- Booking extras: customer contact + team ---------- */
export function BookingExtras({ bookingCode, providerId, status }: { bookingCode: string; providerId: string; status: string }) {
  const inv = useInvalidate();
  const accepted = !["new", "declined"].includes(status);
  const { data: contact } = useQuery({ queryKey: ["booking-contact", bookingCode, accepted], enabled: accepted, queryFn: async () => { const { data } = await supabase.rpc("get_booking_customer_contact", { _booking_code: bookingCode }); return data?.[0] ?? null; } });
  const { data: team = [] } = useTeam(providerId);
  const { data: assigned } = useQuery({ queryKey: ["booking-team", bookingCode], queryFn: async () => { const { data } = await supabase.from("bookings").select("assigned_team_member_id").eq("booking_code", bookingCode).maybeSingle(); return data?.assigned_team_member_id ?? ""; } });
  return <div className="mt-4 space-y-3">
    <div className="rounded-lg bg-secondary p-3 text-sm">{accepted ? contact ? <><p className="font-bold">{contact.full_name || "Customer"}</p>{contact.phone ? <a href={`tel:${contact.phone}`} className="font-semibold text-primary">{contact.phone}</a> : <p className="text-muted-foreground">Phone not added by customer</p>}</> : <p className="text-muted-foreground">Loading contact…</p> : <p className="text-muted-foreground">Customer contact is shown after you accept.</p>}</div>
    {accepted && <label className="block text-xs font-bold">Assigned team member<select value={assigned ?? ""} onChange={async (e) => { const { error } = await supabase.from("bookings").update({ assigned_team_member_id: e.target.value || null }).eq("booking_code", bookingCode); if (done(error, "Team updated")) await inv("booking-team"); }} className={field}><option value="">Not assigned</option>{team.map((m) => <option key={m.id} value={m.id}>{m.name}{m.role ? ` (${m.role})` : ""}</option>)}</select>{team.length === 0 && <span className="mt-1 block font-normal text-muted-foreground">Add team members in Profile first.</span>}</label>}
  </div>;
}
