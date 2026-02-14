import { useState } from "react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Key, Plus, Copy, AlertTriangle, ArrowUpRight, Trash2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import type { PlanTier } from "@/config/plans";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsed: string | null;
  expiresAt: string | null;
}

type Scope = {
  id: string;
  label: string;
  description: string;
};

type ExpiryOption = {
  value: string;
  label: string;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SCOPES: Scope[] = [
  { id: "assessments:read", label: "assessments:read", description: "Read assessment data" },
  { id: "assessments:write", label: "assessments:write", description: "Create and update assessments" },
  { id: "responses:read", label: "responses:read", description: "Read assessment responses" },
  { id: "scores:read", label: "scores:read", description: "Read score data" },
  { id: "leads:read", label: "leads:read", description: "Read lead information" },
  { id: "leads:write", label: "leads:write", description: "Create and update leads" },
  { id: "webhooks:manage", label: "webhooks:manage", description: "Manage webhook endpoints" },
];

const EXPIRY_OPTIONS: ExpiryOption[] = [
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
  { value: "never", label: "Never" },
];

const MOCK_KEYS: APIKey[] = [
  {
    id: "key_1",
    name: "Production Integration",
    prefix: "ask_live_7Kx3",
    scopes: ["assessments:read", "responses:read", "scores:read"],
    createdAt: "2025-12-15T10:30:00Z",
    lastUsed: "2026-02-13T14:22:00Z",
    expiresAt: "2026-06-15T10:30:00Z",
  },
  {
    id: "key_2",
    name: "Webhook Service",
    prefix: "ask_live_9Bf2",
    scopes: ["webhooks:manage", "leads:read"],
    createdAt: "2026-01-08T09:00:00Z",
    lastUsed: "2026-02-12T08:15:00Z",
    expiresAt: null,
  },
  {
    id: "key_3",
    name: "Development Testing",
    prefix: "ask_test_4Qm1",
    scopes: ["assessments:read", "assessments:write", "leads:read", "leads:write"],
    createdAt: "2026-02-01T16:45:00Z",
    lastUsed: null,
    expiresAt: "2026-05-01T16:45:00Z",
  },
];

/* ------------------------------------------------------------------ */
/*  Upgrade prompt                                                     */
/* ------------------------------------------------------------------ */

function UpgradePrompt({ currentTier }: { currentTier: PlanTier }) {
  return (
    <Card className="shadow-soft-sm border-accent/30 bg-accent/5">
      <CardContent className="flex items-center gap-3 py-6">
        <Key className="h-8 w-8 text-accent shrink-0" />
        <div className="flex-1">
          <p className="text-[14px] font-semibold">API access requires Professional or Firm</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            API keys and developer tools are available on the Professional and Firm plans. Your current plan is{" "}
            <span className="font-semibold">{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</span>.
          </p>
        </div>
        <Button size="sm" className="h-9 text-[12px] gap-1.5 shrink-0">
          <ArrowUpRight className="h-3.5 w-3.5" /> Upgrade
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DeveloperSettings() {
  const planLimits = usePlanLimits();
  const isProfessionalPlus = planLimits.tier === "professional" || planLimits.tier === "firm";

  const [keys, setKeys] = useState<APIKey[]>(MOCK_KEYS);
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([]);
  const [newKeyExpiry, setNewKeyExpiry] = useState("90d");
  const [createdKeyValue, setCreatedKeyValue] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(true);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  /* If not Professional+ tier, show upgrade prompt */
  if (!isProfessionalPlus) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <UpgradePrompt currentTier={planLimits.tier} />
      </motion.div>
    );
  }

  /* handlers */
  const toggleScope = (scopeId: string) => {
    setNewKeyScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.error("Please provide a key name");
      return;
    }
    if (newKeyScopes.length === 0) {
      toast.error("Please select at least one scope");
      return;
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const fullKey = `ask_live_${Math.random().toString(36).substring(2, 34)}`;
    const prefix = `ask_live_${randomSuffix}`;

    const expiresAt = newKeyExpiry === "never" ? null : (() => {
      const d = new Date();
      if (newKeyExpiry === "30d") d.setDate(d.getDate() + 30);
      else if (newKeyExpiry === "90d") d.setDate(d.getDate() + 90);
      else if (newKeyExpiry === "1y") d.setFullYear(d.getFullYear() + 1);
      return d.toISOString();
    })();

    const newKey: APIKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      prefix,
      scopes: [...newKeyScopes],
      createdAt: new Date().toISOString(),
      lastUsed: null,
      expiresAt,
    };

    setKeys((prev) => [newKey, ...prev]);
    setCreatedKeyValue(fullKey);
    setShowKey(true);
    toast.success("API key created successfully");
  };

  const handleCopyKey = () => {
    if (createdKeyValue) {
      navigator.clipboard.writeText(createdKeyValue);
      toast.success("API key copied to clipboard");
    }
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setNewKeyName("");
    setNewKeyScopes([]);
    setNewKeyExpiry("90d");
    setCreatedKeyValue(null);
    setShowKey(true);
  };

  const handleRevokeKey = (id: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
    setRevokeId(null);
    toast.success("API key revoked");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "\u2014";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header + Create */}
      <Card className="shadow-soft-sm border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[14px] font-semibold tracking-tight flex items-center gap-2">
              <Key className="h-4 w-4" /> API Keys
            </CardTitle>
            <Dialog open={createOpen} onOpenChange={(open) => { if (!open) handleCloseCreate(); else setCreateOpen(true); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-[12px] gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="shadow-soft-lg sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {createdKeyValue ? "API Key Created" : "Create API Key"}
                  </DialogTitle>
                  <DialogDescription className="text-[12px]">
                    {createdKeyValue
                      ? "Copy your key now. You will not be able to see it again."
                      : "Create a new API key with specific permissions and expiry."}
                  </DialogDescription>
                </DialogHeader>

                {createdKeyValue ? (
                  /* Show created key */
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <p className="text-[12px] text-amber-700">
                        This key will only be shown once. Store it securely.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium text-muted-foreground">Your API key</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={showKey ? createdKeyValue : "\u2022".repeat(40)}
                          readOnly
                          className="text-[12px] font-mono bg-muted/50"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => setShowKey(!showKey)}
                        >
                          {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={handleCopyKey}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button onClick={handleCloseCreate} className="text-[13px]">
                        Done
                      </Button>
                    </DialogFooter>
                  </div>
                ) : (
                  /* Create form */
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium text-muted-foreground">Key name</Label>
                      <Input
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g. Production Integration"
                        className="text-[13px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[12px] font-medium text-muted-foreground">Scopes</Label>
                      <div className="grid gap-2">
                        {SCOPES.map((scope) => (
                          <label
                            key={scope.id}
                            className="flex items-start gap-3 rounded-lg border border-border/60 p-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                          >
                            <Checkbox
                              checked={newKeyScopes.includes(scope.id)}
                              onCheckedChange={() => toggleScope(scope.id)}
                              className="mt-0.5"
                            />
                            <div>
                              <p className="text-[12px] font-mono font-medium">{scope.label}</p>
                              <p className="text-[11px] text-muted-foreground">{scope.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium text-muted-foreground">Expiry</Label>
                      <Select value={newKeyExpiry} onValueChange={setNewKeyExpiry}>
                        <SelectTrigger className="h-9 text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPIRY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={handleCloseCreate} className="text-[13px]">
                        Cancel
                      </Button>
                      <Button onClick={handleCreateKey} className="text-[13px]">
                        Create Key
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Manage API keys for programmatic access to your AdvisoryScore data.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {keys.length === 0 ? (
            <div className="py-8 text-center">
              <Key className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">No API keys yet</p>
              <p className="text-[11px] text-muted-foreground">Create your first key to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Name</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Prefix</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Scopes</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Created</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Last Used</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Expires</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id} className="border-border/30">
                    <TableCell className="text-[12px] font-medium">{key.name}</TableCell>
                    <TableCell className="text-[11px] font-mono text-muted-foreground">{key.prefix}...</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.slice(0, 2).map((s) => (
                          <Badge key={s} variant="secondary" className="text-[9px] font-mono">
                            {s}
                          </Badge>
                        ))}
                        {key.scopes.length > 2 && (
                          <Badge variant="secondary" className="text-[9px]">
                            +{key.scopes.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{formatDate(key.createdAt)}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{formatDate(key.lastUsed)}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      {key.expiresAt ? (
                        new Date(key.expiresAt) < new Date() ? (
                          <Badge variant="destructive" className="text-[9px]">Expired</Badge>
                        ) : (
                          formatDate(key.expiresAt)
                        )
                      ) : (
                        <span className="text-muted-foreground/60">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog open={revokeId === key.id} onOpenChange={(open) => setRevokeId(open ? key.id : null)}>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-destructive hover:text-destructive gap-1">
                            <Trash2 className="h-3 w-3" /> Revoke
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                            <AlertDialogDescription className="text-[13px]">
                              Are you sure you want to revoke <strong>{key.name}</strong> ({key.prefix}...)? This action cannot be undone. Any integrations using this key will immediately stop working.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-[13px]">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevokeKey(key.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-[13px]"
                            >
                              Revoke Key
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
