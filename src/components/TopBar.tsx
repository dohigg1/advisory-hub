import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, LogOut, ChevronRight } from "lucide-react";

const routeNames: Record<string, string> = {
  "/": "Dashboard",
  "/assessments": "Assessments",
  "/leads": "Leads",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

export function TopBar() {
  const { user, organisation, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "U";
  const currentPage = routeNames[location.pathname] ?? "";

  return (
    <header className="flex h-[52px] items-center justify-between border-b border-border/50 glass px-5 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground/60 hover:text-foreground transition-colors" />
        {currentPage && (
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="text-muted-foreground/50">Home</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
            <span className="font-medium text-foreground">{currentPage}</span>
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 outline-none group rounded-full pr-1">
            <Avatar className="h-7 w-7 ring-2 ring-border group-hover:ring-accent/40 transition-all duration-200">
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 shadow-soft-lg">
          <div className="px-3 py-2.5">
            <p className="text-[13px] font-semibold text-foreground">{user?.email}</p>
            {organisation && (
              <p className="text-xs text-muted-foreground mt-0.5">{organisation.name}</p>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/settings")} className="text-[13px]">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-[13px]">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
