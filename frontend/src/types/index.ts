export interface RoofGeometry {
  polygon: GeoJSONPolygon | null;
  area_m2: number;
  orientation_deg: number | null;
  height_m: number | null;
  pitch_deg: number;
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface CompanyInfo {
  name?: string;
  registration_number?: string;
  sic_codes: string[];
  directors: { name: string; role: string; appointed_on?: string }[];
  address?: string;
  incorporated_date?: string;
}

export interface ContactInfo {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
}

export interface ROIData {
  system_kw: number;
  annual_output_kwh: number;
  savings_year_1: number;
  savings_25yr: number;
  install_cost: number;
  payback_years: number;
  electricity_rate: number;
  export_rate: number;
  export_fraction: number;
  sun_hours_per_year: number;
}

export interface OutreachRecord {
  sent_at: string;
  subject: string;
  body: string;
  style: string;
  status: string;
  brevo_message_id?: string;
}

export type EnrichmentStatus = "pending" | "partial" | "complete";

export interface Lead {
  id: string;
  org_id: string;
  uprn?: string;
  address: string;
  postcode: string;
  lat: number;
  lng: number;
  geometry: RoofGeometry;
  low_confidence: boolean;
  filter_passed: boolean;
  company: CompanyInfo;
  contact: ContactInfo;
  conservation_risk: boolean;
  conservation_area_name?: string;
  roi: ROIData;
  outreach: OutreachRecord[];
  enrichment_status: EnrichmentStatus;
  notes?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member" | "viewer";
  org_id: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  subscription_tier: "free" | "pro" | "professional" | "enterprise";
  subscription_status: string;
  leads_limit: number;
}

export type EmailStyle = "direct" | "educational" | "roi_focused";
