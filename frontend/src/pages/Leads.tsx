import { useEffect } from "react";
import { useLeads } from "../hooks/useLeads";
import Filters from "../components/LeadList/Filters";
import LeadTable from "../components/LeadList/LeadTable";

export default function Leads() {
  const { leads, total, loading, filters, setFilters, fetch, discover, enrich } = useLeads();

  useEffect(() => { fetch(); }, []);

  return (
    <div className="h-full flex flex-col gap-4 p-6 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <h1 className="text-lg font-semibold text-apple-dark">Leads</h1>
        {loading && <span className="text-xs text-gray-400 animate-pulse">Loading…</span>}
      </div>

      <div className="flex-shrink-0">
        <Filters
          filters={filters}
          onChange={(f) => { setFilters(f); fetch(f); }}
          onDiscover={discover}
        />
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        <LeadTable
          leads={leads}
          total={total}
          page={filters.page || 1}
          pageSize={filters.page_size || 50}
          onPage={(p) => { const f = { ...filters, page: p }; setFilters(f); fetch(f); }}
          onEnrich={enrich}
        />
      </div>
    </div>
  );
}
