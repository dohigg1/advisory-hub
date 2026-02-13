import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrgAssessments } from "@/hooks/useAnalytics";
import { AssessmentAnalytics } from "@/components/analytics/AssessmentAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart } from "lucide-react";
import { motion } from "framer-motion";

const Analytics = () => {
  const { data: assessments } = useOrgAssessments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = assessments?.find((a) => a.id === selectedId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Performance insights and reporting</p>
        </div>
        <Select value={selectedId ?? ""} onValueChange={(v) => setSelectedId(v || null)}>
          <SelectTrigger className="w-[220px] h-9 text-[13px]">
            <SelectValue placeholder="Select assessment" />
          </SelectTrigger>
          <SelectContent className="shadow-soft-md">
            {assessments?.map((a) => (
              <SelectItem key={a.id} value={a.id} className="text-[13px]">{a.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedId && selected ? (
        <AssessmentAnalytics assessmentId={selectedId} assessmentTitle={selected.title} />
      ) : (
        <Card className="shadow-soft-sm border-border/60 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 mb-4">
              <LineChart className="h-6 w-6 text-accent" strokeWidth={1.5} />
            </div>
            <p className="text-[15px] font-semibold mb-1">Select an assessment</p>
            <p className="text-[13px] text-muted-foreground max-w-xs">Choose an assessment above to view its analytics.</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default Analytics;
