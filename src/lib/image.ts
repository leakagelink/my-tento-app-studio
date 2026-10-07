/** Resize + compress an image file to a WebP data URL so it can be stored and shown anywhere (web + Android). */
export async function compressImage(file: File, max = 1280, quality = 0.8): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/webp", quality);
  } finally { URL.revokeObjectURL(url); }
}

/** Only inline/absolute image values are displayable to customers. */
export const displayableImage = (v?: string | null) => (v && /^(data:image\/|https?:\/\/)/.test(v) ? v : null);
