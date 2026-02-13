import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

const Leads = () => (
  <div className="animate-fade-in space-y-6">
    <div>
      <h1 className="text-2xl font-semibold">Leads</h1>
      <p className="text-sm text-muted-foreground mt-1">Track and manage assessment leads</p>
    </div>
    <Card className="border shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Lead management coming soon.</p>
      </CardContent>
    </Card>
  </div>
);

export default Leads;
