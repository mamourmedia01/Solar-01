import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { LeadFilters } from "../../api/leads";

interface Props {
  filters: LeadFilters;
  onChange: (f: LeadFilters) => void;
  onDiscover: (postcode: string) => void;
}

export default function Filters({ filters, onChange, onDiscover }: Props) {
  const [postcode, setPostcode] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = (key: keyof LeadFilters, val: unknown) => onChange({ ...filters, [key]: val, page: 1 });

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Discover row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={postcode}
            onChange={(e) => setPostcode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && postcode && onDiscover(postcode)}
            placeholder="Enter postcode e.g. EC1A 1BB"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>
        <button
          onClick={() => postcode && onDiscover(postcode)}
          className="btn-cyan px-5"
        >
          Discover
        </button>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`btn-secondary px-3 ${showAdvanced ? "bg-gray-100" : ""}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Filter chips row */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { label: "Qualifying only", key: "filter_passed" as const, val: true },
          { label: "Fully enriched",  key: "enrichment_status" as const, val: "complete" },
          { label: "Conservation risk", key: "conservation_risk" as const, val: true },
          { label: "Low confidence", key: "low_confidence" as const, val: true },
        ].map(({ label, key, val }) => {
          const active = (filters as any)[key] === val;
          return (
            <button
              key={label}
              onClick={() => set(key, active ? undefined : val)}
              className={`px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? "bg-apple-dark text-white border-apple-dark"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {label}
              {active && <X className="inline w-3 h-3 ml-1" />}
            </button>
          );
        })}
      </div>

      {/* Advanced */}
      {showAdvanced && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <div>
            <label className="label-xs block mb-1">Min roof area (m²)</label>
            <input
              type="number" min={0}
              value={filters.min_area || ""}
              onChange={(e) => set("min_area", Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="500"
            />
          </div>
          <div>
            <label className="label-xs block mb-1">Sort by</label>
            <select
              value={filters.sort_by || "created_at"}
              onChange={(e) => set("sort_by", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
            >
              <option value="created_at">Date added</option>
              <option value="geometry.area_m2">Roof area</option>
              <option value="roi.savings_25yr">25yr savings</option>
              <option value="roi.system_kw">System size</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
