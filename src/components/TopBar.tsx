import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, LogOut } from "lucide-react";

export function TopBar() {
  const { user, organisation, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/60 bg-card/70 backdrop-blur-md px-5 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 outline-none group">
            <Avatar className="h-8 w-8 transition-shadow group-hover:shadow-soft-md">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-foreground">{user?.email}</p>
            {organisation && (
              <p className="text-xs text-muted-foreground mt-0.5">{organisation.name}</p>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
