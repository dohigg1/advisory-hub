import { Card, CardContent } from "@/components/ui/card";
import { LineChart } from "lucide-react";

const Analytics = () => (
  <div className="animate-fade-in space-y-6">
    <div>
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <p className="text-sm text-muted-foreground mt-1">Performance insights and reporting</p>
    </div>
    <Card className="border shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <LineChart className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Analytics dashboard coming soon.</p>
      </CardContent>
    </Card>
  </div>
);

export default Analytics;
