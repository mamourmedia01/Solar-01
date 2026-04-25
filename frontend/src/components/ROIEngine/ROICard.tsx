import { useState } from "react";
import type { ROIData } from "../../types";
import { TrendingUp, Zap, Clock, PoundSterling } from "lucide-react";

interface Props {
  roi: ROIData;
  onRecalculate: (assumptions: Partial<ROIData>) => void;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `£${(n / 1_000).toFixed(1)}K`;
  return `£${n.toFixed(0)}`;
}

export default function ROICard({ roi, onRecalculate }: Props) {
  const [editing, setEditing] = useState(false);
  const [assumptions, setAssumptions] = useState({
    electricity_rate: roi.electricity_rate,
    export_rate: roi.export_rate,
    export_fraction: roi.export_fraction,
    sun_hours_per_year: roi.sun_hours_per_year,
  });

  const handleRecalc = () => {
    onRecalculate(assumptions);
    setEditing(false);
  };

  const metrics = [
    { label: "System size",     value: `${roi.system_kw} kWp`,             icon: Zap,           color: "text-yellow-500" },
    { label: "Annual output",   value: `${roi.annual_output_kwh.toLocaleString()} kWh`, icon: TrendingUp, color: "text-green-500" },
    { label: "Year 1 savings",  value: fmt(roi.savings_year_1),             icon: PoundSterling, color: "text-cyan-500" },
    { label: "25yr net savings",value: fmt(roi.savings_25yr),               icon: PoundSterling, color: "text-purple-500" },
    { label: "Install cost",    value: fmt(roi.install_cost),               icon: PoundSterling, color: "text-gray-500" },
    { label: "Payback period",  value: `${roi.payback_years} years`,        icon: Clock,         color: "text-orange-500" },
  ];

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-apple-dark text-sm">Financial ROI</h3>
        <button onClick={() => setEditing(!editing)} className="btn-secondary py-1 text-xs">
          {editing ? "Cancel" : "Edit assumptions"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3">
            <div className={`flex items-center gap-1.5 ${color} mb-1`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="label-xs">{label}</span>
            </div>
            <p className="font-semibold text-apple-dark text-sm tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {editing && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="label-xs">Assumptions</p>
          {[
            { key: "electricity_rate", label: "Electricity rate (£/kWh)", step: 0.01 },
            { key: "export_rate",      label: "Export rate / SEG (£/kWh)", step: 0.01 },
            { key: "export_fraction",  label: "Export fraction (0–1)",     step: 0.05 },
            { key: "sun_hours_per_year", label: "Sun hours/year (UK avg 1100)", step: 10 },
          ].map(({ key, label, step }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <label className="text-xs text-gray-600 flex-1">{label}</label>
              <input
                type="number" step={step}
                value={(assumptions as any)[key]}
                onChange={(e) => setAssumptions((a) => ({ ...a, [key]: parseFloat(e.target.value) }))}
                className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          ))}
          <button onClick={handleRecalc} className="btn-cyan w-full py-2 text-sm">
            Recalculate
          </button>
        </div>
      )}
    </div>
  );
}
