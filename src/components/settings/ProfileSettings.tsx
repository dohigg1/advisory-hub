import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Lock, Upload } from "lucide-react";

export function ProfileSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState(profile?.full_name?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(profile?.full_name?.split(" ").slice(1).join(" ") ?? "");
  const [saving, setSaving] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName || null })
      .eq("id", profile.id);

    if (error) toast.error(error.message);
    else {
      toast.success("Profile updated");
      await refreshProfile();
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be under 2MB");
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `${profile.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("org-logos").upload(path, file, { upsert: true });

    if (error) {
      toast.error("Upload failed");
      return;
    }

    const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", profile.id);
    toast.success("Avatar updated");
    await refreshProfile();
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-soft-sm border-border/60">
        <CardHeader>
          <CardTitle className="text-[14px] font-semibold tracking-tight flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover border" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted border">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <Input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleAvatarUpload} className="text-[12px]" />
              <p className="text-[11px] text-muted-foreground mt-1">Max 2MB. PNG, JPG, or SVG.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground">First name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground">Last name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-muted-foreground">Email</Label>
            <Input value={user?.email ?? ""} disabled className="bg-muted/50" />
            <p className="text-[11px] text-muted-foreground">Email changes require re-verification</p>
          </div>

          <Button onClick={handleSaveProfile} disabled={saving} className="h-9 text-[13px]">
            {saving ? "Saving…" : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-soft-sm border-border/60">
        <CardHeader>
          <CardTitle className="text-[14px] font-semibold tracking-tight flex items-center gap-2">
            <Lock className="h-4 w-4" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground">New password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground">Confirm password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={changingPassword} className="h-9 text-[13px]">
              {changingPassword ? "Updating…" : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
