import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLeads } from "../hooks/useLeads";
import StatsCards from "../components/Dashboard/StatsCards";
import MapPanel from "../components/Dashboard/MapPanel";
import Filters from "../components/LeadList/Filters";
import LeadTable from "../components/LeadList/LeadTable";

export default function Dashboard() {
  const { leads, total, loading, filters, setFilters, fetch, discover, enrich } = useLeads();
  const navigate = useNavigate();

  useEffect(() => { fetch(); }, []);

  const handlePage = (page: number) => {
    const updated = { ...filters, page };
    setFilters(updated);
    fetch(updated);
  };

  return (
    <div className="h-full grid grid-rows-[auto_1fr] gap-0">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200/60">
        <div>
          <h1 className="text-lg font-semibold text-apple-dark">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">UK Commercial Solar Prospects</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {loading && <span className="animate-pulse">Loading…</span>}
          <span>{total.toLocaleString()} leads</span>
        </div>
      </div>

      {/* 2×2 Grid */}
      <div className="grid grid-cols-2 grid-rows-2 gap-4 p-6 overflow-hidden">
        {/* Top-left: Stats */}
        <StatsCards leads={leads} />

        {/* Top-right: Map */}
        <div className="rounded-2xl overflow-hidden" style={{ minHeight: 0 }}>
          <MapPanel leads={leads} onLeadClick={(id) => navigate(`/leads/${id}`)} />
        </div>

        {/* Bottom-left: Filters */}
        <div className="flex flex-col gap-3 overflow-hidden">
          <Filters
            filters={filters}
            onChange={(f) => { setFilters(f); fetch(f); }}
            onDiscover={discover}
          />
        </div>

        {/* Bottom-right: Lead table */}
        <div className="overflow-hidden" style={{ minHeight: 0 }}>
          <LeadTable
            leads={leads}
            total={total}
            page={filters.page || 1}
            pageSize={filters.page_size || 50}
            onPage={handlePage}
            onEnrich={enrich}
          />
        </div>
      </div>
    </div>
  );
}
