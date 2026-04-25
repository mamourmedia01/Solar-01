import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { Lead } from "../../types";

const OS_API_KEY = import.meta.env.VITE_OS_API_KEY || "";

const STYLE_URL = OS_API_KEY
  ? `https://api.os.uk/maps/vector/ngd/ota/v1/vts/resources/styles?key=${OS_API_KEY}`
  : "https://basemaps.cartocdn.com/gl/light-matter-gl-style/style.json";

interface Props {
  leads: Lead[];
  onLeadClick?: (id: string) => void;
}

export default function MapPanel({ leads, onLeadClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [-1.5, 52.5],
      zoom: 6,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Remove old markers
    document.querySelectorAll(".solar-marker").forEach((el) => el.remove());

    leads.forEach((lead) => {
      if (!lead.lat || !lead.lng) return;
      const el = document.createElement("div");
      el.className = "solar-marker";
      el.style.cssText = `
        width: 10px; height: 10px; border-radius: 50%;
        background: ${lead.filter_passed ? "#06b6d4" : "#9ca3af"};
        border: 2px solid white; cursor: pointer;
        box-shadow: 0 0 0 2px ${lead.filter_passed ? "rgba(6,182,212,0.3)" : "transparent"};
      `;
      el.addEventListener("click", () => onLeadClick?.(lead.id));
      new maplibregl.Marker({ element: el }).setLngLat([lead.lng, lead.lat]).addTo(map);
    });

    if (leads.length > 0) {
      const lngs = leads.map((l) => l.lng);
      const lats = leads.map((l) => l.lat);
      map.fitBounds(
        [[Math.min(...lngs) - 0.01, Math.min(...lats) - 0.01],
         [Math.max(...lngs) + 0.01, Math.max(...lats) + 0.01]],
        { padding: 40, duration: 800 },
      );
    }
  }, [leads, onLeadClick]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 flex items-center gap-3 glass-card px-3 py-2 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" /> Qualifying
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" /> Filtered out
        </span>
      </div>
    </div>
  );
}
