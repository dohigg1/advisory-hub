import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Building2,
  Users,
  ToggleRight,
  FileText,
  Activity,
  Shield,
  ChevronLeft,
  LogOut,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Organisations", url: "/admin/organisations", icon: Building2 },
  { title: "Feature Flags", url: "/admin/feature-flags", icon: ToggleRight },
  { title: "Legal Content", url: "/admin/legal", icon: FileText },
  { title: "Audit Log", url: "/admin/audit-log", icon: ClipboardList },
];

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "SA";

  return (
    <div className="flex min-h-screen w-full bg-slate-950">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-slate-800/60 bg-slate-900 transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 ring-1 ring-amber-500/30 flex-shrink-0">
            <Shield className="h-5 w-5 text-amber-400" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-bold text-white tracking-tight">
                AdvisoryScore
              </span>
              <span className="text-[10px] text-amber-400/60 font-semibold uppercase tracking-wider">
                Admin Portal
              </span>
            </div>
          )}
        </div>

        {/* Admin mode indicator */}
        {!collapsed && (
          <div className="mx-3 mb-4 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
              Super Admin Mode
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5">
          {adminNav.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-amber-500/15 text-amber-300 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )
              }
              title={item.title}
            >
              <item.icon className="h-[17px] w-[17px] flex-shrink-0" strokeWidth={1.8} />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 space-y-2">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 transition-all duration-200 w-full"
            title="Back to App"
          >
            <ArrowLeft className="h-4 w-4 flex-shrink-0" strokeWidth={1.8} />
            {!collapsed && <span className="text-[13px] font-medium">Back to App</span>}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 transition-all duration-200 w-full"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 flex-shrink-0 transition-transform duration-300",
                collapsed && "rotate-180"
              )}
              strokeWidth={1.8}
            />
            {!collapsed && <span className="text-[13px] font-medium">Collapse</span>}
          </button>

          {!collapsed && (
            <div className="rounded-lg bg-slate-800/40 border border-slate-700/40 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-slate-300 truncate">
                    {user?.email}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/50">
                    Super Admin
                  </div>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-700/40 text-slate-500 hover:text-slate-300 transition-colors w-full"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} />
                <span className="text-[11px] font-medium">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar with admin indicator */}
        <header className="flex h-[52px] items-center justify-between border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-sm px-6 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">
              Admin Panel
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            {user?.email}
          </div>
        </header>

        <main className="flex-1 px-6 py-8 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
