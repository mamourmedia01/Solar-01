import { useNavigate } from "react-router-dom";
import type { Lead } from "../../types";
import { AlertTriangle, CheckCircle2, Clock, Zap } from "lucide-react";
import clsx from "clsx";

const enrichIcon = {
  pending:  <Clock className="w-3.5 h-3.5 text-gray-400" />,
  partial:  <Zap className="w-3.5 h-3.5 text-yellow-500" />,
  complete: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
};

function fmt(n: number) {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `£${(n / 1_000).toFixed(0)}K`;
  return `£${n.toFixed(0)}`;
}

interface Props {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  onEnrich: (id: string) => void;
}

export default function LeadTable({ leads, total, page, pageSize, onPage, onEnrich }: Props) {
  const navigate = useNavigate();
  const pages = Math.ceil(total / pageSize);

  return (
    <div className="glass-card overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Address", "Postcode", "Area m²", "System kW", "25yr Savings", "Enriched", ""].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left label-xs whitespace-nowrap">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                  No leads yet. Enter a postcode above to discover buildings.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => navigate(`/leads/${lead.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 max-w-[200px]">
                  <span className="font-medium text-apple-dark truncate block">{lead.address}</span>
                  {lead.conservation_risk && (
                    <span className="inline-flex items-center gap-1 text-xs text-orange-600 mt-0.5">
                      <AlertTriangle className="w-3 h-3" /> Conservation area
                    </span>
                  )}
                  {lead.low_confidence && (
                    <span className="inline-block text-xs text-gray-400 mt-0.5">Low confidence</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{lead.postcode}</td>
                <td className="px-4 py-3 tabular-nums text-gray-700">
                  {lead.geometry.area_m2 > 0 ? lead.geometry.area_m2.toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 tabular-nums text-gray-700">
                  {lead.roi?.system_kw > 0 ? `${lead.roi.system_kw} kW` : "—"}
                </td>
                <td className="px-4 py-3 tabular-nums font-medium text-green-700">
                  {lead.roi?.savings_25yr > 0 ? fmt(lead.roi.savings_25yr) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    {enrichIcon[lead.enrichment_status]}
                    {lead.enrichment_status}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  {lead.enrichment_status !== "complete" && (
                    <button
                      onClick={() => onEnrich(lead.id)}
                      className="btn-secondary py-1 text-xs"
                    >
                      Enrich
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
          <span className="text-gray-500">
            {total.toLocaleString()} leads total
          </span>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => onPage(p)}
                className={clsx(
                  "w-8 h-8 rounded-lg text-sm font-medium",
                  p === page ? "bg-apple-dark text-white" : "hover:bg-gray-100 text-gray-600",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
