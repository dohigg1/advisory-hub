import { BarChart3, LayoutDashboard, ClipboardCheck, Users, LineChart, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Assessments", url: "/assessments", icon: ClipboardCheck },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Analytics", url: "/analytics", icon: LineChart },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { organisation } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-5">
        <div className="flex items-center gap-3">
          {organisation?.logo_url ? (
            <img src={organisation.logo_url} alt="" className="h-8 w-8 rounded-md object-contain flex-shrink-0" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent flex-shrink-0">
              <BarChart3 className="h-4 w-4 text-sidebar-foreground" />
            </div>
          )}
          {!collapsed && (
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight truncate">
              AdvisoryScore
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 mt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-150"
                      activeClassName="bg-sidebar-accent text-sidebar-foreground shadow-soft-sm"
                    >
                      <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-5">
        {!collapsed && (
          <div className="text-[11px] font-medium uppercase tracking-widest text-sidebar-foreground/30">
            {organisation?.plan_tier === "free" ? "Free plan" : organisation?.plan_tier}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
