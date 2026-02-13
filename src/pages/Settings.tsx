import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgSettings } from "@/components/settings/OrgSettings";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { PortalSettings } from "@/components/settings/PortalSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const Settings = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Manage your organisation and team</p>
      </div>

      <Tabs defaultValue="organisation" className="space-y-5">
        <TabsList className="bg-muted/50 p-0.5 h-9">
          <TabsTrigger value="organisation" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Organisation</TabsTrigger>
          <TabsTrigger value="team" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Team</TabsTrigger>
          <TabsTrigger value="portal" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Client Portal</TabsTrigger>
          <TabsTrigger value="billing" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Billing</TabsTrigger>
          <TabsTrigger value="domains" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Domains</TabsTrigger>
        </TabsList>

        <TabsContent value="organisation">
          <OrgSettings />
        </TabsContent>

        <TabsContent value="team">
          <TeamSettings />
        </TabsContent>

        <TabsContent value="portal">
          <PortalSettings />
        </TabsContent>

        <TabsContent value="billing">
          <Card className="shadow-soft-sm border-border/60">
            <CardHeader>
              <CardTitle className="text-[13px] font-semibold tracking-tight">Billing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[13px] text-muted-foreground">Billing management coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains">
          <Card className="shadow-soft-sm border-border/60">
            <CardHeader>
              <CardTitle className="text-[13px] font-semibold tracking-tight">Custom Domains</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[13px] text-muted-foreground">Custom domain configuration coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default Settings;
