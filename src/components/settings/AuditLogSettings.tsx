import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CreditCard, UserPlus, UserMinus, Shield, Settings, FileText,
  Trash2, Download, Activity, Search
} from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata_json: any;
  created_at: string;
  user_id: string | null;
}

const ACTION_ICONS: Record<string, any> = {
  plan_changed: CreditCard,
  member_invited: UserPlus,
  member_removed: UserMinus,
  role_changed: Shield,
  org_updated: Settings,
  assessment_published: FileText,
  assessment_deleted: Trash2,
  data_exported: Download,
  account_deleted: Trash2,
};

const ACTION_LABELS: Record<string, string> = {
  plan_changed: "Plan changed",
  member_invited: "Member invited",
  member_removed: "Member removed",
  role_changed: "Role changed",
  org_updated: "Organisation updated",
  assessment_published: "Assessment published",
  assessment_deleted: "Assessment deleted",
  data_exported: "Data exported",
  account_deleted: "Account deleted",
};

export function AuditLogSettings() {
  const { organisation } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    if (!organisation) return;
    let query = supabase
      .from("audit_log")
      .select("*")
      .eq("org_id", organisation.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("action", filter);
    }

    const { data } = await query;
    setEntries((data as AuditEntry[]) ?? []);
    setLoading(false);
  }, [organisation, filter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = search
    ? entries.filter(e =>
        (ACTION_LABELS[e.action] || e.action).toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(e.metadata_json).toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  return (
    <Card className="shadow-soft-sm border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[14px] font-semibold tracking-tight flex items-center gap-2">
            <Activity className="h-4 w-4" /> Activity Log
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 w-40 text-[12px]"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-8 w-36 text-[12px]">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {Object.entries(ACTION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-[13px] text-muted-foreground text-center py-8">No activity recorded yet</p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {filtered.map((entry) => {
                const Icon = ACTION_ICONS[entry.action] || Activity;
                return (
                  <div key={entry.id} className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium">
                        {ACTION_LABELS[entry.action] || entry.action}
                      </p>
                      {entry.metadata_json && Object.keys(entry.metadata_json).length > 0 && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {Object.entries(entry.metadata_json)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mono shrink-0">
                      {new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
