import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrgAssessments } from "@/hooks/useAnalytics";
import { AssessmentAnalytics } from "@/components/analytics/AssessmentAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart } from "lucide-react";

const Analytics = () => {
  const { data: assessments } = useOrgAssessments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = assessments?.find((a) => a.id === selectedId);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Performance insights and reporting</p>
        </div>
        <Select value={selectedId ?? ""} onValueChange={(v) => setSelectedId(v || null)}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select assessment" />
          </SelectTrigger>
          <SelectContent>
            {assessments?.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedId && selected ? (
        <AssessmentAnalytics assessmentId={selectedId} assessmentTitle={selected.title} />
      ) : (
        <Card className="border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <LineChart className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Select an assessment to view its analytics.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
