import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

/** Resize + compress an image file to a WebP data URL (keeps the app fast). */
async function compress(file: File, max = 1280): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/webp", 0.8);
  } finally { URL.revokeObjectURL(url); }
}

export function AdminServicePhotos() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({ queryKey: ["admin-service-photos"], queryFn: async () => { const { data, error } = await supabase.from("services").select("id,name,image_url").order("sort_order"); if (error) throw error; return data ?? []; } });
  const [busy, setBusy] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const save = async (id: string, image_url: string | null) => {
    setBusy(id);
    const { error } = await supabase.from("services").update({ image_url }).eq("id", id);
    setBusy(null);
    if (error) { toast.error("Photo save nahi hui"); return; }
    await Promise.all([qc.invalidateQueries({ queryKey: ["admin-service-photos"] }), qc.invalidateQueries({ queryKey: ["service-photos"] })]);
    toast.success(image_url ? "Photo updated" : "Default photo restored");
  };
  const onFile = async (id: string, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Sirf image file chuniye"); return; }
    try { await save(id, await compress(file)); } catch { toast.error("Image read nahi ho payi"); }
  };
  return <section className="mb-8">
    <h3 className="mb-1 font-bold">Category photos</h3>
    <p className="mb-4 text-sm text-muted-foreground">Ye photos customer app ke home aur booking screen par dikhti hain.</p>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map((s) => <div key={s.id} className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="aspect-[4/3] bg-secondary">{s.image_url ? <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Default photo</div>}</div>
        <div className="flex items-center justify-between gap-2 p-3">
          <span className="font-bold">{s.name}</span>
          <div className="flex gap-1">
            <input ref={(el) => { inputs.current[s.id] = el; }} type="file" accept="image/*" className="hidden" aria-label={`Upload ${s.name} photo`} onChange={(e) => { void onFile(s.id, e.target.files?.[0]); e.target.value = ""; }} />
            <Button size="sm" disabled={busy === s.id} onClick={() => inputs.current[s.id]?.click()}><ImagePlus className="size-4" /> {busy === s.id ? "Saving…" : "Upload"}</Button>
            {s.image_url && <Button size="sm" variant="outline" aria-label="Reset" onClick={() => void save(s.id, null)}><RotateCcw className="size-4" /></Button>}
          </div>
        </div>
      </div>)}
    </div>
  </section>;
}
