import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  Sun, Zap, MapPin, Building2, Brain, Shield, TrendingUp,
  ArrowRight, ChevronDown, Check, Star,
} from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import AnimatedCounter from "../components/Landing/AnimatedCounter";
import DashboardPreview from "../components/Landing/DashboardPreview";

// ── Particles (pure CSS, positioned via inline style vars) ──────────────────
function Particles() {
  const particles = [
    { x: "12%",  y: "18%", r: 2.5, delay: "0s",    dur: "6s"  },
    { x: "88%",  y: "12%", r: 1.5, delay: "1.5s",  dur: "8s"  },
    { x: "74%",  y: "65%", r: 2,   delay: "3s",    dur: "7s"  },
    { x: "22%",  y: "75%", r: 1,   delay: "0.8s",  dur: "9s"  },
    { x: "50%",  y: "25%", r: 3,   delay: "2.2s",  dur: "5s"  },
    { x: "36%",  y: "55%", r: 1.5, delay: "4s",    dur: "7.5s"},
    { x: "65%",  y: "40%", r: 2,   delay: "1s",    dur: "6.5s"},
    { x: "90%",  y: "80%", r: 1,   delay: "3.5s",  dur: "8.5s"},
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            left: p.x, top: p.y,
            width: p.r * 2, height: p.r * 2,
            background: i % 3 === 0 ? "rgba(6,182,212,0.6)" : i % 3 === 1 ? "rgba(59,130,246,0.5)" : "rgba(250,247,242,0.3)",
            animationDelay: p.delay,
            animationDuration: p.dur,
            filter: "blur(0.5px)",
          }}
        />
      ))}
    </div>
  );
}

// ── Section wrapper with reveal ─────────────────────────────────────────────
function Section({ children, className = "", id, style }: { children: React.ReactNode; className?: string; id?: string; style?: React.CSSProperties }) {
  const ref = useScrollReveal(0.1) as React.RefObject<HTMLElement>;
  return (
    <section ref={ref} id={id} className={className} style={style}>
      {children}
    </section>
  );
}

// ── Feature card ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: MapPin,
    title: "Instant Lead Discovery",
    desc: "Enter any UK postcode and instantly surface every commercial building with 500m²+ of viable roof space. Powered by OS NGD.",
    color: "text-cyan-400",
    bg: "rgba(6,182,212,0.08)",
  },
  {
    icon: Building2,
    title: "3D Roof Viewer",
    desc: "Photorealistic 3D building models extruded from real polygon data. See panel placement, shading zones, and HVAC clutter at a glance.",
    color: "text-blue-400",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    icon: TrendingUp,
    title: "ROI Engine",
    desc: "Full financial modelling per lead: system size, annual yield, 25-year savings, payback period — all editable assumptions.",
    color: "text-emerald-400",
    bg: "rgba(52,211,153,0.08)",
  },
  {
    icon: Brain,
    title: "AI-Powered Outreach",
    desc: "GPT-generated personalised emails with three writing styles. One click to send via Brevo, tracked per lead in your pipeline.",
    color: "text-purple-400",
    bg: "rgba(168,85,247,0.08)",
  },
  {
    icon: Zap,
    title: "Data Enrichment",
    desc: "Companies House directors, Apollo.io decision-maker contacts, and Historic England conservation risk flags — all automated.",
    color: "text-amber-400",
    bg: "rgba(251,191,36,0.08)",
  },
  {
    icon: Shield,
    title: "Multi-Tenant & Secure",
    desc: "Every lead, email, and ROI calculation is siloed to your organisation. RBAC roles, JWT auth, and team management built in.",
    color: "text-rose-400",
    bg: "rgba(251,113,133,0.08)",
  },
];

// ── Pricing tiers ───────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Free",
    price: "£0",
    period: "/mo",
    desc: "Try it out",
    features: ["50 leads per month", "Basic ROI calculator", "3D roof viewer", "Email support"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "£99",
    period: "/mo",
    desc: "For active teams",
    features: ["Unlimited leads", "Full data enrichment", "AI email outreach", "Priority support", "API access"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Professional",
    price: "£299",
    period: "/mo",
    desc: "Scale your pipeline",
    features: ["Everything in Pro", "White-label reports", "Dedicated CSM", "SLA guarantee", "Custom integrations"],
    cta: "Contact Sales",
    popular: false,
  },
];

// ── Steps ───────────────────────────────────────────────────────────────────
const STEPS = [
  { num: "01", title: "Enter a Postcode", desc: "Search any UK commercial area. Our pipeline queries AddressBase Premium for every building UPRN in seconds." },
  { num: "02", title: "Filter & Score", desc: "Buildings are scored by roof area, solar orientation (120–240°), height, and proximity to conservation areas." },
  { num: "03", title: "Enrich Instantly", desc: "One click pulls Companies House directors, Apollo contacts, and flags conservation risk — no copy-pasting." },
  { num: "04", title: "Send & Win", desc: "AI writes a tailored outreach email, Brevo delivers it, and every reply is tracked in your pipeline dashboard." },
];

// ── Main component ──────────────────────────────────────────────────────────
export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);

  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ background: "#07090f", color: "#faf7f2", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4" style={{ background: "rgba(7,9,15,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center">
            <Sun className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white">Solar-01</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {["Features", "How It Works", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm text-white/50 hover:text-white transition-colors duration-200"
            >
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors duration-200">
            Sign in
          </Link>
          <Link
            to="/login"
            className="text-sm font-medium px-4 py-2 rounded-xl text-white transition-all duration-200 active:scale-95"
            style={{ background: "rgba(59,130,246,0.9)", boxShadow: "0 0 20px rgba(59,130,246,0.3)" }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37,99,235,0.18) 0%, transparent 70%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 40% at 80% 80%, rgba(6,182,212,0.06) 0%, transparent 60%)" }} />
        <Particles />
        {/* Spinning ring decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none" style={{ border: "1px solid rgba(59,130,246,0.06)", animation: "spin-slow 30s linear infinite" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ border: "1px solid rgba(6,182,212,0.06)", animation: "spin-slow 20s linear infinite reverse" }} />

        {/* Content */}
        <div className="relative z-10 max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs font-medium text-cyan-300" style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Powered by OS NGD · Companies House · GPT-4
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight">
            <span style={{ color: "#faf7f2" }}>Find every </span>
            <span style={{ background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #3b82f6 100%)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "hero-gradient 5s ease infinite" }}>
              solar lead
            </span>
            <br />
            <span style={{ color: "#faf7f2" }}>in the UK. Instantly.</span>
          </h1>

          <p className="text-lg md:text-xl mb-10 leading-relaxed" style={{ color: "rgba(250,247,242,0.55)", maxWidth: "600px", margin: "0 auto 2.5rem" }}>
            Solar-01 maps every commercial rooftop in Britain, enriches the owner's contact details, and writes the outreach email — in under 30 seconds per lead.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)", boxShadow: "0 0 30px rgba(59,130,246,0.4), 0 4px 24px rgba(0,0,0,0.3)" }}
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={scrollToDemo}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(250,247,242,0.8)" }}
            >
              See live demo
            </button>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-1.5 mt-10">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 text-sm" style={{ color: "rgba(250,247,242,0.4)" }}>Trusted by UK solar installers</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <button onClick={scrollToDemo} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/25 hover:text-white/50 transition-colors animate-bounce-y">
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* ── STATS STRIP ── */}
      <Section className="py-16 px-6" id="stats">
        <div className="max-w-5xl mx-auto glass-dark rounded-2xl px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center reveal">
          {[
            { value: 2.4, suffix: "M+", label: "Buildings mapped", decimals: 1 },
            { value: 18,  suffix: "B",  label: "Pipeline potential", prefix: "£" },
            { value: 98,  suffix: "%",  label: "Data accuracy" },
            { value: 30,  suffix: "s",  label: "Per lead avg time" },
          ].map(({ value, suffix, label, prefix, decimals }, i) => (
            <div key={label} className={`reveal reveal-d${i + 1}`}>
              <div className="text-4xl font-bold mb-1" style={{ color: "#faf7f2" }}>
                <AnimatedCounter target={value} prefix={prefix} suffix={suffix} decimals={decimals ?? 0} />
              </div>
              <div className="text-sm" style={{ color: "rgba(250,247,242,0.4)" }}>{label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <Section className="py-24 px-6" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <span className="text-xs font-medium uppercase tracking-widest text-blue-400 mb-4 block">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#faf7f2" }}>
              Everything your sales team needs
            </h2>
            <p className="text-lg" style={{ color: "rgba(250,247,242,0.45)", maxWidth: 520, margin: "0 auto" }}>
              From raw building data to a signed contract — Solar-01 covers the entire commercial solar prospecting workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
              <div
                key={title}
                className={`glass-dark glass-dark-hover rounded-2xl p-6 reveal reveal-d${(i % 3) + 1}`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: bg }}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: "#faf7f2" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(250,247,242,0.45)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── LIVE DEMO ── */}
      <Section className="py-24 px-6" id="demo">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 reveal">
            <span className="text-xs font-medium uppercase tracking-widest text-cyan-400 mb-4 block">Interactive Preview</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#faf7f2" }}>
              See it in action
            </h2>
            <p className="text-lg" style={{ color: "rgba(250,247,242,0.45)", maxWidth: 480, margin: "0 auto" }}>
              Click through the tabs to explore the dashboard, 3D roof viewer, and ROI engine.
            </p>
          </div>
          <div className="reveal reveal-d1">
            <DashboardPreview />
          </div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section className="py-24 px-6" id="how-it-works" style={{ background: "rgba(250,247,242,0.03)" } as React.CSSProperties}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <span className="text-xs font-medium uppercase tracking-widest text-blue-400 mb-4 block">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-bold" style={{ color: "#faf7f2" }}>
              Postcode to proposal<br />in minutes
            </h2>
          </div>
          <div className="space-y-6">
            {STEPS.map(({ num, title, desc }, i) => (
              <div key={num} className={`flex gap-6 items-start ${i % 2 === 0 ? "reveal-left" : "reveal-right"} reveal-d${i + 1}`}>
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6" }}>
                  {num}
                </div>
                <div className="glass-dark rounded-2xl px-6 py-5 flex-1">
                  <h3 className="text-base font-semibold mb-1.5" style={{ color: "#faf7f2" }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(250,247,242,0.45)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── PRICING ── */}
      <Section className="py-24 px-6" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <span className="text-xs font-medium uppercase tracking-widest text-blue-400 mb-4 block">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#faf7f2" }}>Simple, transparent</h2>
            <p className="text-lg" style={{ color: "rgba(250,247,242,0.45)" }}>No setup fees. Cancel any time.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, period, desc, features, cta, popular }, i) => (
              <div
                key={name}
                className={`glass-dark rounded-2xl p-7 flex flex-col reveal reveal-d${i + 1} ${popular ? "landing-glow-ring relative" : ""}`}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)" }}>
                    Most popular
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-sm font-medium mb-1" style={{ color: "rgba(250,247,242,0.5)" }}>{name}</div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-bold" style={{ color: "#faf7f2" }}>{price}</span>
                    <span className="text-sm pb-1" style={{ color: "rgba(250,247,242,0.4)" }}>{period}</span>
                  </div>
                  <div className="text-xs" style={{ color: "rgba(250,247,242,0.35)" }}>{desc}</div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(250,247,242,0.65)" }}>
                      <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className="block text-center py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                  style={
                    popular
                      ? { background: "linear-gradient(135deg, #2563eb, #06b6d4)", color: "#fff", boxShadow: "0 0 20px rgba(59,130,246,0.3)" }
                      : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(250,247,242,0.8)" }
                  }
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA BANNER ── */}
      <Section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center reveal">
          <div className="glass-dark rounded-3xl p-12" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(6,182,212,0.08) 100%)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#faf7f2" }}>
              Ready to fill your pipeline?
            </h2>
            <p className="text-lg mb-8" style={{ color: "rgba(250,247,242,0.5)" }}>
              Join UK solar teams finding high-value commercial leads in minutes, not months.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)", boxShadow: "0 0 40px rgba(59,130,246,0.4)" }}
            >
              Register free — no card needed
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="border-t px-8 py-10" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500 flex items-center justify-center">
              <Sun className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-white/80">Solar-01</span>
          </div>
          <nav className="flex items-center gap-6">
            {[["Features", "#features"], ["Pricing", "#pricing"], ["Sign In", "/login"]].map(([label, href]) => (
              href.startsWith("/")
                ? <Link key={label} to={href} className="text-sm transition-colors" style={{ color: "rgba(250,247,242,0.35)" }}>{label}</Link>
                : <a key={label} href={href} className="text-sm transition-colors" style={{ color: "rgba(250,247,242,0.35)" }}>{label}</a>
            ))}
          </nav>
          <p className="text-xs" style={{ color: "rgba(250,247,242,0.2)" }}>
            © {new Date().getFullYear()} Solar-01. UK commercial solar prospecting.
          </p>
        </div>
      </footer>
    </div>
  );
}
