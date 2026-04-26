import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard, MapPin, Mail, CreditCard, LogOut, Sun,
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/leads",     icon: MapPin,          label: "Leads" },
  { to: "/app/outreach",  icon: Mail,            label: "Outreach" },
  { to: "/app/billing",   icon: CreditCard,      label: "Billing" },
];

export default function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-white/70 backdrop-blur-glass border-r border-white/50 shadow-glass">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center">
            <Sun className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-apple-dark text-sm">Solar-01</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-apple-dark text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-gray-100 pt-3">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-apple-dark truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
