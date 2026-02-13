import { BarChart3, LayoutDashboard, ClipboardCheck, Users, LineChart, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Assessments", url: "/assessments", icon: ClipboardCheck },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Analytics", url: "/analytics", icon: LineChart },
];

const secondaryNav = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { organisation } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0 sidebar-gradient">
      <SidebarHeader className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          {organisation?.logo_url ? (
            <img src={organisation.logo_url} alt="" className="h-9 w-9 rounded-lg object-contain flex-shrink-0 ring-1 ring-white/10" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 ring-1 ring-accent/30 flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-accent" />
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-white tracking-tight">
                AdvisoryScore
              </span>
              <span className="text-[10px] text-sidebar-foreground/40 font-medium">
                {organisation?.name ?? "Platform"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 mt-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/30 px-3 mb-1">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg text-sidebar-foreground/50 hover:bg-white/[0.06] hover:text-sidebar-foreground transition-all duration-200"
                      activeClassName="bg-white/[0.08] text-white shadow-[inset_0_0.5px_0_rgba(255,255,255,0.06)]"
                    >
                      <item.icon className="h-[17px] w-[17px] flex-shrink-0" strokeWidth={1.8} />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/30 px-3 mb-1">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg text-sidebar-foreground/50 hover:bg-white/[0.06] hover:text-sidebar-foreground transition-all duration-200"
                      activeClassName="bg-white/[0.08] text-white"
                    >
                      <item.icon className="h-[17px] w-[17px] flex-shrink-0" strokeWidth={1.8} />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-5 pb-5">
        {!collapsed && (
          <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
              {organisation?.plan_tier === "free" ? "Free Plan" : organisation?.plan_tier}
            </div>
            <div className="text-[11px] text-accent mt-0.5 font-medium cursor-pointer hover:text-accent/80 transition-colors">
              Upgrade →
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
