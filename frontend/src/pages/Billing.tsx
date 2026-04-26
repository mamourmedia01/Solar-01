import { useState } from "react";
import api from "../api/client";
import { CheckCircle2, Zap } from "lucide-react";
import toast from "react-hot-toast";

const TIERS = [
  {
    id: "pro",
    name: "Pro",
    price: "£99",
    period: "/mo",
    features: ["500 leads", "50 postcode searches/mo", "AI email generation", "Companies House enrichment"],
  },
  {
    id: "professional",
    name: "Professional",
    price: "£299",
    period: "/mo",
    features: ["2,000 leads", "200 postcode searches/mo", "All Pro features", "Apollo.io contact discovery", "Priority support"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: ["Unlimited leads", "Unlimited searches", "All Professional features", "Dedicated account manager", "Custom integrations"],
  },
];

export default function Billing() {
  const [loading, setLoading] = useState<string | null>(null);

  const checkout = async (tier: string) => {
    if (tier === "enterprise") {
      window.open("mailto:sales@solar-01.io?subject=Enterprise enquiry", "_blank");
      return;
    }
    setLoading(tier);
    try {
      const { data } = await api.post("/billing/checkout", {
        tier,
        success_url: window.location.origin + "/app/billing?success=1",
        cancel_url: window.location.origin + "/app/billing",
      });
      window.location.href = data.checkout_url;
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setLoading(null);
    }
  };

  const isSuccess = new URLSearchParams(window.location.search).has("success");

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <h1 className="text-lg font-semibold text-apple-dark">Billing</h1>

      {isSuccess && (
        <div className="glass-card p-4 flex items-center gap-3 text-green-700 bg-green-50/80">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">Subscription activated — welcome aboard!</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`glass-card p-6 flex flex-col ${tier.popular ? "ring-2 ring-cyan-400" : ""}`}
          >
            {tier.popular && (
              <div className="flex items-center gap-1.5 text-xs text-cyan-600 font-medium mb-3">
                <Zap className="w-3.5 h-3.5" /> Most popular
              </div>
            )}
            <h3 className="font-semibold text-apple-dark text-base">{tier.name}</h3>
            <div className="mt-2 mb-5">
              <span className="text-3xl font-bold text-apple-dark">{tier.price}</span>
              <span className="text-sm text-gray-500">{tier.period}</span>
            </div>

            <ul className="space-y-2.5 flex-1 mb-6">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => checkout(tier.id)}
              disabled={loading === tier.id}
              className={tier.popular ? "btn-cyan w-full py-2.5" : "btn-secondary w-full py-2.5"}
            >
              {loading === tier.id ? "Redirecting…" : tier.id === "enterprise" ? "Contact us" : "Get started"}
            </button>
          </div>
        ))}
      </div>

      <div className="glass-card p-4 text-sm text-gray-500">
        All plans include a 14-day free trial. Cancel anytime. Prices exclude VAT.
      </div>
    </div>
  );
}
