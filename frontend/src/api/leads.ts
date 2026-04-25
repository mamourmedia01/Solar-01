import api from "./client";
import type { Lead, ROIData, EmailStyle } from "../types";

export interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  page_size: number;
}

export interface LeadFilters {
  postcode?: string;
  enrichment_status?: string;
  conservation_risk?: boolean;
  low_confidence?: boolean;
  filter_passed?: boolean;
  min_area?: number;
  sort_by?: string;
  sort_dir?: number;
  page?: number;
  page_size?: number;
}

export const leadsApi = {
  discover: (postcode: string, min_area = 500) =>
    api.post("/leads/discover", { postcode, min_area }),

  list: (filters: LeadFilters = {}) =>
    api.get<LeadsResponse>("/leads/", { params: filters }),

  get: (id: string) => api.get<Lead>(`/leads/${id}`),

  update: (id: string, data: Partial<Lead>) => api.patch(`/leads/${id}`, data),

  delete: (id: string) => api.delete(`/leads/${id}`),

  enrich: (id: string) => api.post(`/enrichment/${id}/enrich`),

  batchEnrich: (ids: string[]) => api.post("/enrichment/batch-enrich", { lead_ids: ids }),

  calculateRoi: (id: string, assumptions: Partial<ROIData>) =>
    api.patch(`/roi/leads/${id}/roi`, assumptions),

  generateEmail: (id: string, style: EmailStyle) =>
    api.post<{ subject: string; body: string; style: string }>(`/outreach/${id}/generate`, { style }),

  sendEmail: (id: string, subject: string, body: string, style: EmailStyle) =>
    api.post(`/outreach/${id}/send`, { subject, body, style }),

  getOutreachHistory: (id: string) =>
    api.get<{ outreach: Lead["outreach"] }>(`/outreach/${id}/history`),
};
