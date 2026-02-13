import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Trash2 } from "lucide-react";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type AppRole = Enums<"app_role">;

export function TeamSettings() {
  const { organisation, profile } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("viewer");
  const [inviting, setInviting] = useState(false);
  const isAdmin = profile?.role === "admin";

  const fetchMembers = async () => {
    if (!organisation) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("org_id", organisation.id)
      .order("created_at");
    if (data) setMembers(data);
  };

  useEffect(() => {
    fetchMembers();
  }, [organisation]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisation || !profile) return;
    setInviting(true);

    const { error } = await supabase.from("team_invitations").insert({
      org_id: organisation.id,
      invited_by: profile.id,
      email: inviteEmail,
      role: inviteRole,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
    }
    setInviting(false);
  };

  const handleRoleChange = async (memberId: string, newRole: AppRole) => {
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", memberId);
    if (error) toast.error(error.message);
    else {
      toast.success("Role updated");
      fetchMembers();
    }
  };

  const handleRemove = async (memberId: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", memberId);
    if (error) toast.error(error.message);
    else {
      toast.success("Member removed");
      fetchMembers();
    }
  };

  const roleBadgeClass = (role: AppRole) => {
    switch (role) {
      case "admin": return "bg-primary text-primary-foreground";
      case "editor": return "bg-accent text-accent-foreground";
      case "viewer": return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Invite team member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-medium">Email</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.com" required />
              </div>
              <div className="w-32 space-y-1.5">
                <Label className="text-xs font-medium">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={inviting} className="gap-2">
                <UserPlus className="h-4 w-4" />
                {inviting ? "Sending…" : "Invite"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Team members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{member.full_name || member.email}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && member.id !== profile?.id ? (
                    <>
                      <Select value={member.role} onValueChange={(v) => handleRoleChange(member.id, v as AppRole)}>
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => handleRemove(member.id)} className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Badge className={roleBadgeClass(member.role)}>{member.role}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
