import { useState } from "react";
import type { Lead, EmailStyle, OutreachRecord } from "../../types";
import { leadsApi } from "../../api/leads";
import { Send, RefreshCw, Clock, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

const STYLES: { id: EmailStyle; label: string; desc: string }[] = [
  { id: "direct",      label: "Direct & Urgent", desc: "Lead with financial opportunity and deadline" },
  { id: "educational", label: "Educational",      desc: "Explain benefits first, then the ROI" },
  { id: "roi_focused", label: "ROI-Focused",      desc: "Lead with exact savings and payback figures" },
];

interface Props { lead: Lead; onSent: () => void }

export default function EmailGenerator({ lead, onSent }: Props) {
  const [style, setStyle] = useState<EmailStyle>("direct");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await leadsApi.generateEmail(lead.id, style);
      setSubject(data.subject);
      setBody(data.body);
    } catch {
      toast.error("Failed to generate email");
    } finally {
      setGenerating(false);
    }
  };

  const send = async () => {
    if (!subject || !body) return toast.error("Generate an email first");
    if (!lead.contact?.email) return toast.error("No contact email for this lead");
    setSending(true);
    try {
      await leadsApi.sendEmail(lead.id, subject, body, style);
      toast.success(`Email sent to ${lead.contact.email}`);
      onSent();
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-apple-dark text-sm">AI Outreach</h3>
        {lead.outreach.length > 0 && (
          <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {lead.outreach.length} sent
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* History */}
      {showHistory && lead.outreach.length > 0 && (
        <div className="space-y-2 border-b border-gray-100 pb-4">
          {lead.outreach.map((r: OutreachRecord, i: number) => (
            <div key={i} className="bg-gray-50 rounded-xl px-3 py-2.5 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-apple-dark">{r.subject}</span>
                <span className="text-gray-400">{format(new Date(r.sent_at), "dd MMM HH:mm")}</span>
              </div>
              <span className={`capitalize px-2 py-0.5 rounded-full text-xs ${
                r.status === "sent" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Style picker */}
      <div>
        <p className="label-xs mb-2">Email style</p>
        <div className="grid grid-cols-3 gap-2">
          {STYLES.map(({ id, label, desc }) => (
            <button
              key={id}
              onClick={() => setStyle(id)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                style === id
                  ? "border-cyan-400 bg-cyan-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className={`text-xs font-medium ${style === id ? "text-cyan-700" : "text-gray-700"}`}>{label}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button onClick={generate} disabled={generating} className="btn-secondary w-full flex items-center justify-center gap-2">
        <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
        {generating ? "Generating…" : "Generate email"}
      </button>

      {/* Subject */}
      {subject && (
        <div>
          <label className="label-xs block mb-1.5">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>
      )}

      {/* Body */}
      {body && (
        <div>
          <label className="label-xs block mb-1.5">Email body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none font-mono text-xs"
          />
        </div>
      )}

      {/* Send */}
      {body && (
        <button
          onClick={send}
          disabled={sending || !lead.contact?.email}
          className="btn-primary w-full flex items-center justify-center gap-2"
          title={!lead.contact?.email ? "No contact email — enrich lead first" : ""}
        >
          <Send className="w-4 h-4" />
          {sending ? "Sending…" : `Send to ${lead.contact?.email || "— no email"}`}
        </button>
      )}
    </div>
  );
}
