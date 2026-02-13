import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

const Leads = () => (
  <div className="animate-fade-in space-y-8">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
      <p className="text-sm text-muted-foreground mt-1">Track and manage assessment leads</p>
    </div>
    <Card className="shadow-soft-sm">
      <CardContent className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted mb-5">
          <Users className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-base font-semibold mb-1">Lead management</p>
        <p className="text-sm text-muted-foreground max-w-xs">Coming soon. Share an assessment to start collecting leads.</p>
      </CardContent>
    </Card>
  </div>
);

export default Leads;
