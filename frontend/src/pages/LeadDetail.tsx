import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { leadsApi } from "../api/leads";
import type { Lead } from "../types";
import BuildingViewer from "../components/Viewer3D/BuildingViewer";
import ROICard from "../components/ROIEngine/ROICard";
import EnrichmentPanel from "../components/Enrichment/EnrichmentBadge";
import EmailGenerator from "../components/Outreach/EmailGenerator";
import { ArrowLeft, MapPin } from "lucide-react";
import toast from "react-hot-toast";

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    try {
      const { data } = await leadsApi.get(id);
      setLead(data);
    } catch {
      toast.error("Failed to load lead");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const recalcROI = async (assumptions: Partial<Lead["roi"]>) => {
    if (!id || !lead) return;
    try {
      const { data } = await leadsApi.calculateRoi(id, assumptions);
      setLead((l) => l ? { ...l, roi: data } : l);
      toast.success("ROI recalculated");
    } catch {
      toast.error("Recalculation failed");
    }
  };

  const handleEnrich = async () => {
    if (!id) return;
    await leadsApi.enrich(id);
    toast.success("Enrichment started — refreshing in 8s");
    setTimeout(load, 8000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading…</div>
  );
  if (!lead) return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">Lead not found</div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200/60 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-apple-dark truncate">{lead.address}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500 font-mono">{lead.postcode}</span>
            {lead.geometry.area_m2 > 0 && (
              <span className="text-xs text-gray-400">· {lead.geometry.area_m2.toLocaleString()} m²</span>
            )}
          </div>
        </div>
      </div>

      {/* Split layout: 3D left, panels right */}
      <div className="flex-1 grid grid-cols-[1fr_380px] gap-4 p-6 overflow-hidden min-h-0">
        {/* 3D Viewer */}
        <div className="rounded-2xl overflow-hidden h-full min-h-0">
          <BuildingViewer
            polygon={lead.geometry.polygon}
            roofAreaM2={lead.geometry.area_m2}
            heightM={lead.geometry.height_m || 6}
            orientationDeg={lead.geometry.orientation_deg ?? 180}
            systemKw={lead.roi?.system_kw}
          />
        </div>

        {/* Right panel — scrollable cards */}
        <div className="overflow-y-auto space-y-4 pb-4">
          <ROICard roi={lead.roi} onRecalculate={recalcROI} />
          <EnrichmentPanel lead={lead} onEnrich={handleEnrich} />
          <EmailGenerator lead={lead} onSent={load} />
        </div>
      </div>
    </div>
  );
}
