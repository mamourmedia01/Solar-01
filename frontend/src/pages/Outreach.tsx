import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLeads } from "../hooks/useLeads";
import { Mail, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function Outreach() {
  const { leads, fetch } = useLeads();
  const navigate = useNavigate();

  useEffect(() => { fetch(); }, []);

  const withOutreach = leads.filter((l) => l.outreach.length > 0);
  const withContact  = leads.filter((l) => l.contact?.email && l.outreach.length === 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-semibold text-apple-dark">Outreach</h1>

      {/* Sent campaigns */}
      <div>
        <p className="label-xs mb-3">Sent ({withOutreach.length})</p>
        <div className="space-y-2">
          {withOutreach.length === 0 && (
            <div className="glass-card p-8 text-center text-sm text-gray-400">
              No emails sent yet. Open a lead and generate an email to get started.
            </div>
          )}
          {withOutreach.map((lead) => {
            const last = lead.outreach[lead.outreach.length - 1];
            return (
              <div
                key={lead.id}
                onClick={() => navigate(`/app/leads/${lead.id}`)}
                className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/80 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-apple-dark truncate">{lead.address}</p>
                  <p className="text-xs text-gray-500 truncate">{last.subject}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">{format(new Date(last.sent_at), "dd MMM")}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    last.status === "sent" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>{last.status}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Ready to contact */}
      {withContact.length > 0 && (
        <div>
          <p className="label-xs mb-3">Ready to contact ({withContact.length})</p>
          <div className="space-y-2">
            {withContact.map((lead) => (
              <div
                key={lead.id}
                onClick={() => navigate(`/app/leads/${lead.id}`)}
                className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/80 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-apple-dark truncate">{lead.address}</p>
                  <p className="text-xs text-gray-500">{lead.contact?.name} · {lead.contact?.email}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
