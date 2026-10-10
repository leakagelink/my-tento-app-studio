import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type LatLng = { lat: number; lng: number };

const pin = (color: string, label: string) =>
  L.divIcon({
    className: "",
    iconSize: [30, 40],
    iconAnchor: [15, 38],
    html: `<div style="display:flex;flex-direction:column;align-items:center"><div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.35);display:grid;place-items:center;color:#fff;font:800 11px sans-serif">${label}</div><div style="width:3px;height:10px;background:${color}"></div></div>`,
  });

export default function CabRideMap({ pickup, drop, route, onPick }: { pickup: LatLng | null; drop: LatLng | null; route: [number, number][]; onPick: (p: LatLng) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layers = useRef<L.LayerGroup | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: false, attributionControl: false }).setView([26.85, 80.95], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => pickRef.current({ lat: e.latlng.lat, lng: e.latlng.lng }));
    layers.current = L.layerGroup().addTo(m);
    map.current = m;
    setTimeout(() => m.invalidateSize(), 200);
    return () => { m.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current, g = layers.current;
    if (!m || !g) return;
    g.clearLayers();
    if (pickup) L.marker([pickup.lat, pickup.lng], { icon: pin("#16a34a", "P") }).addTo(g);
    if (drop) L.marker([drop.lat, drop.lng], { icon: pin("#ea580c", "D") }).addTo(g);
    if (route.length > 1) {
      const line = L.polyline(route, { color: "#1d4ed8", weight: 5, opacity: 0.85 }).addTo(g);
      m.fitBounds(line.getBounds(), { padding: [40, 40] });
    } else if (pickup && drop) {
      m.fitBounds(L.latLngBounds([[pickup.lat, pickup.lng], [drop.lat, drop.lng]]), { padding: [40, 40] });
    } else if (pickup) m.setView([pickup.lat, pickup.lng], 15);
  }, [pickup, drop, route]);

  return <div ref={el} className="h-full w-full" />;
}
