import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

interface AuditEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_org_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

async function invokeAdmin(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-manage-org", {
    body: { action, params },
  });
  if (error) throw error;
  return data;
}

const actionBadgeVariant = (action: string) => {
  if (action.includes("set_plan")) return "default";
  if (action.includes("remove")) return "destructive";
  if (action.includes("permission")) return "outline";
  return "secondary";
};

const AdminAuditLog = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await invokeAdmin("get_audit_log", { limit: 200 });
        setLogs(data.logs ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Audit Log</h1>
          <p className="text-sm text-slate-400 mt-1">
            All admin actions are logged here for accountability.
          </p>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Admin</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Action</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Target Org</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardList className="h-8 w-8 text-slate-600" />
                        No audit entries yet
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="border-slate-700/30 hover:bg-slate-800/40">
                      <TableCell className="text-[11px] text-slate-400 whitespace-nowrap">
                        {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-300 font-mono">
                        {log.admin_user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionBadgeVariant(log.action)} className="text-[10px]">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-400 font-mono">
                        {log.target_org_id ? `${log.target_org_id.slice(0, 8)}...` : "—"}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <pre className="text-[10px] text-slate-500 whitespace-pre-wrap break-all font-mono">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
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
