import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

const Assessments = () => (
  <div className="animate-fade-in space-y-6">
    <div>
      <h1 className="text-2xl font-semibold">Assessments</h1>
      <p className="text-sm text-muted-foreground mt-1">Create and manage client assessments</p>
    </div>
    <Card className="border shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardCheck className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Assessment builder coming soon.</p>
      </CardContent>
    </Card>
  </div>
);

export default Assessments;
