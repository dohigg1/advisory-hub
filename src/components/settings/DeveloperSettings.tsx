import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Key, Plus, Copy, Trash2, Lock, AlertTriangle } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export function DeveloperSettings() {
  const { organisation, user } = useAuth();
  const { isFeatureEnabled, tier } = usePlanLimits();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);

  const canAccess = tier === "professional" || tier === "firm";

  useEffect(() => {
    if (!organisation) return;
    (async () => {
      const { data } = await supabase
        .from("api_keys")
        .select("*")
        .eq("org_id", organisation.id)
        .order("created_at", { ascending: false });
      setKeys((data as ApiKey[]) || []);
      setLoading(false);
    })();
  }, [organisation]);

  const handleCreate = async () => {
    if (!organisation || !user || !keyName.trim()) return;
    setCreating(true);

    // Generate a random 48-char key
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let rawKey = "as_";
    for (let i = 0; i < 48; i++) rawKey += chars[Math.floor(Math.random() * chars.length)];

    // Hash it
    const encoder = new TextEncoder();
    const data = encoder.encode(rawKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const { error } = await supabase.from("api_keys").insert({
      org_id: organisation.id,
      name: keyName.trim(),
      key_hash: keyHash,
      key_prefix: rawKey.slice(0, 10) + "...",
      scopes: ["read", "write"],
      created_by: user.id,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setNewKeyValue(rawKey);
      // Refresh list
      const { data: updated } = await supabase
        .from("api_keys")
        .select("*")
        .eq("org_id", organisation.id)
        .order("created_at", { ascending: false });
      setKeys((updated as ApiKey[]) || []);
    }
    setCreating(false);
  };

  const handleRevoke = async (id: string) => {
    const { error } = await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("API key revoked");
      setKeys(keys.map(k => k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k));
    }
  };

  if (!canAccess) {
    return (
      <Card className="shadow-soft-xs border-border/60">
        <CardContent className="py-12 text-center">
          <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-[14px] font-semibold mb-1">API Access</p>
          <p className="text-[12px] text-muted-foreground max-w-xs mx-auto">
            API key management requires a Professional or Firm plan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="shadow-soft-xs border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
            <Key className="h-4 w-4 text-accent" /> API Keys
          </CardTitle>
          <Button size="sm" className="gap-1.5 h-8 text-[12px]" onClick={() => { setCreateOpen(true); setKeyName(""); setNewKeyValue(null); }}>
            <Plus className="h-3.5 w-3.5" /> Create Key
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6"><div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
          ) : keys.length === 0 ? (
            <p className="text-[12px] text-muted-foreground text-center py-6">No API keys created yet.</p>
          ) : (
            <div className="space-y-2">
              {keys.map(k => (
                <div key={k.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div>
                    <p className="text-[12px] font-medium">{k.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{k.key_prefix}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {k.revoked_at ? (
                      <Badge variant="destructive" className="text-[10px]">Revoked</Badge>
                    ) : (
                      <>
                        <Badge variant="secondary" className="text-[10px]">Active</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRevoke(k.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="shadow-soft-lg max-w-md">
          <DialogHeader>
            <DialogTitle>{newKeyValue ? "API Key Created" : "Create API Key"}</DialogTitle>
          </DialogHeader>
          {newKeyValue ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-[12px]">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Copy this key now. It won't be shown again.</span>
              </div>
              <div className="flex gap-2">
                <Input value={newKeyValue} readOnly className="text-[11px] font-mono" />
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(newKeyValue); toast.success("Copied!"); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button onClick={() => setCreateOpen(false)} className="w-full">Done</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">Key Name</Label>
                <Input value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="e.g. Production API" />
              </div>
              <Button onClick={handleCreate} disabled={creating || !keyName.trim()} className="w-full">
                {creating ? "Creating…" : "Create API Key"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
