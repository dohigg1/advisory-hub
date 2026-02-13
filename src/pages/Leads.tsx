import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { motion } from "framer-motion";

const Leads = () => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="space-y-6"
  >
    <div>
      <h1 className="text-xl font-bold tracking-tight">Leads</h1>
      <p className="text-[13px] text-muted-foreground mt-0.5">Track and manage assessment leads</p>
    </div>
    <Card className="shadow-soft-sm border-border/60 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 mb-4">
          <Users className="h-6 w-6 text-accent" strokeWidth={1.5} />
        </div>
        <p className="text-[15px] font-semibold mb-1">Lead management</p>
        <p className="text-[13px] text-muted-foreground max-w-xs">Coming soon. Share an assessment to start collecting leads.</p>
      </CardContent>
    </Card>
  </motion.div>
);

export default Leads;
