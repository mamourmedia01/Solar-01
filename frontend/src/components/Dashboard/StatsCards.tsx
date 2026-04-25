import type { Lead } from "../../types";
import { MapPin, CheckCircle, Mail, TrendingUp } from "lucide-react";

interface Props { leads: Lead[] }

export default function StatsCards({ leads }: Props) {
  const discovered = leads.length;
  const enriched = leads.filter((l) => l.enrichment_status === "complete").length;
  const proposals = leads.reduce((acc, l) => acc + l.outreach.length, 0);
  const pipelineGBP = leads.reduce((acc, l) => acc + (l.roi?.savings_25yr || 0), 0);

  const stats = [
    { label: "Leads Discovered", value: discovered, icon: MapPin,      color: "text-cyan-500" },
    { label: "Fully Enriched",   value: enriched,   icon: CheckCircle, color: "text-green-500" },
    { label: "Proposals Sent",   value: proposals,  icon: Mail,        color: "text-purple-500" },
    {
      label: "Pipeline Value (25yr)",
      value: `£${(pipelineGBP / 1_000_000).toFixed(1)}M`,
      icon: TrendingUp,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="glass-card p-5 flex flex-col justify-between">
          <div className={`w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="stat-value">{value}</p>
            <p className="label-xs mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
