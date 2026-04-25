import type { Lead } from "../../types";
import { AlertTriangle, CheckCircle2, Clock, Zap, Building2, User, Phone, Mail } from "lucide-react";

interface Props {
  lead: Lead;
  onEnrich: () => void;
}

export default function EnrichmentPanel({ lead, onEnrich }: Props) {
  const { company, contact, enrichment_status, conservation_risk, conservation_area_name, low_confidence } = lead;

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-apple-dark text-sm">Enrichment</h3>
        <div className="flex items-center gap-2">
          {enrichment_status === "complete" && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Complete
            </span>
          )}
          {enrichment_status === "partial" && (
            <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
              <Zap className="w-3 h-3" /> Partial
            </span>
          )}
          {enrichment_status === "pending" && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" /> Pending
            </span>
          )}
          {enrichment_status !== "complete" && (
            <button onClick={onEnrich} className="btn-cyan py-1 text-xs">Enrich now</button>
          )}
        </div>
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-2">
        {conservation_risk && (
          <span className="inline-flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" />
            Conservation area {conservation_area_name ? `— ${conservation_area_name}` : ""}
          </span>
        )}
        {low_confidence && (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full">
            Low confidence data
          </span>
        )}
      </div>

      {/* Company */}
      {company?.name && (
        <div className="space-y-2">
          <p className="label-xs">Company</p>
          <div className="flex items-start gap-3">
            <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-apple-dark">{company.name}</p>
              {company.registration_number && (
                <p className="text-gray-500 text-xs">Reg: {company.registration_number}</p>
              )}
              {company.incorporated_date && (
                <p className="text-gray-500 text-xs">Inc: {company.incorporated_date}</p>
              )}
              {company.directors?.length > 0 && (
                <p className="text-gray-500 text-xs mt-1">
                  Directors: {company.directors.map((d) => d.name).join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact */}
      {contact?.name && (
        <div className="space-y-2">
          <p className="label-xs">Decision-maker</p>
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-apple-dark">{contact.name}</p>
              {contact.title && <p className="text-gray-500 text-xs">{contact.title}</p>}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-cyan-600 text-xs hover:underline">
                  <Mail className="w-3 h-3" /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-gray-600 text-xs hover:underline">
                  <Phone className="w-3 h-3" /> {contact.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {!company?.name && !contact?.name && enrichment_status === "pending" && (
        <p className="text-sm text-gray-400 text-center py-4">
          Click "Enrich now" to fetch company and contact data.
        </p>
      )}
    </div>
  );
}
