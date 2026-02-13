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
import { Settings, LogOut, User } from "lucide-react";

export function TopBar() {
  const { user, organisation, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        {organisation && (
          <div className="flex items-center gap-2">
            {organisation.logo_url && (
              <img src={organisation.logo_url} alt="" className="h-6 w-6 object-contain" />
            )}
            <span className="text-sm font-medium text-foreground">{organisation.name}</span>
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user?.email}</p>
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
