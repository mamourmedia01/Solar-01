import { useState, useEffect, useRef } from "react";
import { Sun, MapPin, Zap, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

const TABS = ["Dashboard", "3D Viewer", "ROI Engine"] as const;
type Tab = (typeof TABS)[number];

const FAKE_LEADS = [
  { name: "Tesco Extra — Sheffield", postcode: "S1 2BJ", area: "1,840m²", kw: "276 kWp", status: "complete" },
  { name: "Wickes Building Supplies", postcode: "LE1 4SA", area: "2,210m²", kw: "331 kWp", status: "complete" },
  { name: "Lidl UK — Manchester", postcode: "M4 1HZ", area: "960m²",  kw: "144 kWp", status: "partial" },
  { name: "Travis Perkins Depot",    postcode: "CV1 3GH", area: "1,470m²", kw: "220 kWp", status: "pending" },
  { name: "B&Q Warehouse — Leeds",   postcode: "LS1 5AB", area: "3,100m²", kw: "465 kWp", status: "partial" },
];

const STATUS_PILL: Record<string, string> = {
  complete: "bg-emerald-500/20 text-emerald-400",
  partial:  "bg-amber-500/20  text-amber-400",
  pending:  "bg-slate-500/20  text-slate-400",
};

const STATUS_ICON: Record<string, typeof CheckCircle> = {
  complete: CheckCircle,
  partial:  Clock,
  pending:  AlertCircle,
};

function DashboardTab() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-12 gap-3 h-full">
      {/* Stats */}
      <div className="col-span-12 grid grid-cols-4 gap-3">
        {[
          { label: "Leads Found",    value: 247,  suffix: "",    icon: MapPin,      color: "text-blue-400" },
          { label: "Pipeline Value", value: 1.2,  suffix: "M",  prefix: "£", decimals: 1, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Enriched",       value: 189,  suffix: "",    icon: CheckCircle, color: "text-cyan-400" },
          { label: "Proposals Sent", value: 34,   suffix: "",    icon: Zap,         color: "text-purple-400" },
        ].map(({ label, value, suffix, prefix, decimals, icon: Icon, color }, i) => (
          <div key={label} className="glass-dark rounded-xl p-3" style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)", transition: `opacity 0.5s ${i * 0.1}s, transform 0.5s ${i * 0.1}s` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/40 uppercase tracking-widest">{label}</span>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
            <div className={`text-xl font-bold text-white tabular-nums`}>
              <AnimatedCounter target={value} prefix={prefix} suffix={suffix} decimals={decimals ?? 0} />
            </div>
          </div>
        ))}
      </div>

      {/* Map placeholder */}
      <div className="col-span-7 glass-dark rounded-xl overflow-hidden relative" style={{ minHeight: 180 }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(59,130,246,0.08) 0%, transparent 70%)" }} />
        {/* Grid lines */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="absolute left-0 right-0" style={{ top: `${(i + 1) * 14.28}%`, borderTop: "1px solid rgba(255,255,255,0.04)" }} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="absolute top-0 bottom-0" style={{ left: `${(i + 1) * 11.11}%`, borderLeft: "1px solid rgba(255,255,255,0.04)" }} />
        ))}
        {/* Building dots */}
        {[
          { x: "32%", y: "28%", size: 14, glow: true },
          { x: "55%", y: "45%", size: 10, glow: false },
          { x: "70%", y: "32%", size: 16, glow: true },
          { x: "24%", y: "60%", size: 8,  glow: false },
          { x: "48%", y: "68%", size: 12, glow: true },
          { x: "80%", y: "60%", size: 9,  glow: false },
        ].map(({ x, y, size, glow }, i) => (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              left: x, top: y,
              width: size, height: size * 0.6,
              background: glow ? "#06b6d4" : "rgba(59,130,246,0.5)",
              boxShadow: glow ? "0 0 10px rgba(6,182,212,0.6)" : "none",
              transform: "translate(-50%, -50%)",
              opacity: visible ? 1 : 0,
              transition: `opacity 0.4s ${i * 0.15 + 0.3}s`,
            }}
          />
        ))}
        {/* Laser sweep */}
        <div className="absolute left-0 right-0 h-px bg-cyan-400/60 animate-laser-sweep" style={{ boxShadow: "0 0 8px rgba(6,182,212,0.8)" }} />
        <div className="absolute bottom-2 left-3 text-[10px] text-white/30">Sheffield · 4km radius</div>
      </div>

      {/* Lead list */}
      <div className="col-span-5 glass-dark rounded-xl overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-white/5 text-[10px] text-white/40 uppercase tracking-widest">Recent Leads</div>
        <div className="flex-1 overflow-hidden">
          {FAKE_LEADS.map(({ name, postcode, area, status }, i) => {
            const Icon = STATUS_ICON[status];
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 border-b border-white/5 hover:bg-white/5 transition-colors cursor-default"
                style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(12px)", transition: `opacity 0.4s ${i * 0.08 + 0.4}s, transform 0.4s ${i * 0.08 + 0.4}s` }}
              >
                <Icon className={`w-3 h-3 flex-shrink-0 ${status === "complete" ? "text-emerald-400" : status === "partial" ? "text-amber-400" : "text-slate-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/80 truncate leading-tight">{name}</p>
                  <p className="text-[10px] text-white/35">{postcode} · {area}</p>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_PILL[status]}`}>{status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ViewerTab() {
  return (
    <div className="flex items-center justify-center h-full relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)" }} />
      {/* Fake 3D building representation */}
      <div className="relative" style={{ perspective: 600 }}>
        <div className="relative" style={{ transformStyle: "preserve-3d", transform: "rotateX(30deg) rotateZ(-20deg)" }}>
          {/* Building footprint */}
          <div className="relative w-52 h-36 rounded-sm" style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", boxShadow: "0 0 30px rgba(59,130,246,0.2)" }}>
            {/* Solar panel grid */}
            <div className="absolute inset-2 grid gap-0.5" style={{ gridTemplateColumns: "repeat(8, 1fr)", gridTemplateRows: "repeat(5, 1fr)" }}>
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="rounded-[1px]" style={{ background: "rgba(6,182,212,0.7)", boxShadow: "0 0 4px rgba(6,182,212,0.4)" }} />
              ))}
            </div>
            {/* Laser sweep on building */}
            <div className="absolute left-0 right-0 h-[1px] animate-laser-sweep" style={{ background: "rgba(6,182,212,0.8)", boxShadow: "0 0 6px rgba(6,182,212,1)" }} />
          </div>
          {/* Building sides */}
          <div className="absolute w-52 h-8 origin-top" style={{ top: "100%", background: "rgba(30,58,95,0.6)", border: "1px solid rgba(59,130,246,0.2)", transform: "rotateX(-90deg)" }} />
          <div className="absolute h-36 w-8 origin-left" style={{ top: 0, left: "100%", background: "rgba(15,31,53,0.7)", border: "1px solid rgba(59,130,246,0.2)", transform: "rotateY(90deg)" }} />
        </div>
      </div>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 text-[11px]">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "rgba(6,182,212,0.7)" }} />Solar panels</span>
        <span className="flex items-center gap-1.5 text-white/40"><span className="w-3 h-3 rounded-sm" style={{ background: "rgba(59,130,246,0.2)" }} />Roof surface</span>
        <span className="flex items-center gap-1.5 text-emerald-400/70"><span className="w-2 h-2 rounded-full bg-emerald-400/70" />High yield zone</span>
      </div>
    </div>
  );
}

function ROITab() {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <div className="flex flex-col gap-3">
        {[
          { label: "System Size",       value: "276 kWp" },
          { label: "Annual Output",     value: "257,900 kWh" },
          { label: "Install Cost",      value: "£276,000" },
          { label: "Annual Savings",    value: "£42,100" },
          { label: "Payback Period",    value: "6.6 years" },
        ].map(({ label, value }) => (
          <div key={label} className="glass-dark rounded-xl px-4 py-2.5 flex justify-between items-center">
            <span className="text-[11px] text-white/45">{label}</span>
            <span className="text-sm font-semibold text-white">{value}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <div className="glass-dark rounded-xl p-4 flex-1 flex flex-col">
          <span className="text-[10px] text-white/40 uppercase tracking-widest mb-3">25-Year Savings</span>
          <div className="text-3xl font-bold text-emerald-400 mb-1">
            <AnimatedCounter target={786} prefix="£" suffix="k" />
          </div>
          <div className="flex-1 flex items-end">
            {/* Mini bar chart */}
            <div className="w-full flex items-end gap-1 h-16">
              {[20, 35, 52, 68, 85, 100, 100, 100, 100, 100].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i < 7 ? "rgba(52,211,153,0.5)" : "rgba(52,211,153,0.2)" }} />
              ))}
            </div>
          </div>
          <p className="text-[10px] text-white/30 mt-2">Cumulative net cash flow</p>
        </div>
        <div className="glass-dark rounded-xl px-4 py-3 text-center">
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">CO₂ Avoided</div>
          <div className="text-lg font-bold text-cyan-400">
            <AnimatedCounter target={118} suffix=" tonnes/yr" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<Tab>("Dashboard");

  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Glow behind card */}
      <div className="absolute -inset-10 rounded-3xl opacity-30 animate-glow-pulse pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(59,130,246,0.4) 0%, transparent 70%)" }} />

      <div className="relative glass-dark rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(59,130,246,0.25)", boxShadow: "0 0 0 1px rgba(59,130,246,0.15), 0 40px 80px rgba(0,0,0,0.6)" }}>
        {/* Titlebar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${activeTab === t ? "bg-blue-600 text-white shadow-sm" : "text-white/40 hover:text-white/70"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-white/50 font-medium">Solar-01</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4" style={{ height: 340, color: "rgba(255,255,255,0.7)" }}>
          {activeTab === "Dashboard" && <DashboardTab />}
          {activeTab === "3D Viewer"  && <ViewerTab />}
          {activeTab === "ROI Engine" && <ROITab />}
        </div>
      </div>
    </div>
  );
}
