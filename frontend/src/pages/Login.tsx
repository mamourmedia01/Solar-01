import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Sun } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ email: "", password: "", name: "", org_name: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.email, form.name, form.password, form.org_name || undefined);
      }
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-apple-gray flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500 flex items-center justify-center shadow-lg">
            <Sun className="w-7 h-7 text-white" />
          </div>
        </div>

        <div className="glass-card p-8">
          <h1 className="text-xl font-semibold text-apple-dark mb-1">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {mode === "login" ? "Sign in to your Solar-01 account" : "Start prospecting in minutes"}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="label-xs block mb-1.5">Full name</label>
                  <input
                    type="text" required value={form.name} onChange={set("name")}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="label-xs block mb-1.5">Organisation (optional)</label>
                  <input
                    type="text" value={form.org_name} onChange={set("org_name")}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Acme Solar Ltd"
                  />
                </div>
              </>
            )}
            <div>
              <label className="label-xs block mb-1.5">Email</label>
              <input
                type="email" required value={form.email} onChange={set("email")}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label-xs block mb-1.5">Password</label>
              <input
                type="password" required value={form.password} onChange={set("password")}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-2.5">
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-5">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-cyan-500 font-medium hover:underline"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
