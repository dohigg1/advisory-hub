import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

interface AuditEntry {
  id: string;
  admin_user_id: string;
  admin_email: string;
  action: string;
  target_org_id: string | null;
  org_name: string | null;
  details: any;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  set_plan_tier: "Set Plan Tier",
  remove_plan_override: "Remove Plan Override",
  set_permissions: "Set Permission Overrides",
};

const AdminAuditLog = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-org", {
        body: { action: "get_audit_log", limit: 100 },
      });
      if (error) throw error;
      setLogs(data.logs || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-sm text-slate-400">Loading audit log...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-xl font-bold text-white tracking-tight">Admin Audit Log</h1>
        <p className="text-sm text-slate-400 mt-1">{logs.length} entries.</p>
      </motion.div>

      <motion.div variants={item}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  {["Date", "Admin", "Action", "Target Org", "Details"].map((h) => (
                    <TableHead key={h} className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">No audit entries yet.</TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="border-slate-700/30 hover:bg-slate-800/40">
                      <TableCell className="text-[11px] text-slate-400 whitespace-nowrap">
                        {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-[12px] text-slate-300">{log.admin_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[12px] text-slate-300">{log.org_name || "—"}</TableCell>
                      <TableCell className="text-[11px] text-slate-500 max-w-[300px] truncate">
                        {log.details ? JSON.stringify(log.details) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminAuditLog;
