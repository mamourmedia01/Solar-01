import { useState, useCallback } from "react";
import { leadsApi, LeadFilters } from "../api/leads";
import type { Lead } from "../types";
import toast from "react-hot-toast";

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<LeadFilters>({ page: 1, page_size: 50 });

  const fetch = useCallback(async (overrides?: LeadFilters) => {
    setLoading(true);
    try {
      const { data } = await leadsApi.list({ ...filters, ...overrides });
      setLeads(data.leads);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const discover = async (postcode: string) => {
    try {
      await leadsApi.discover(postcode);
      toast.success(`Discovering leads for ${postcode}…`);
      setTimeout(() => fetch(), 5000);
    } catch {
      toast.error("Discovery failed");
    }
  };

  const enrich = async (id: string) => {
    await leadsApi.enrich(id);
    toast.success("Enrichment started");
  };

  return { leads, total, loading, filters, setFilters, fetch, discover, enrich };
}
