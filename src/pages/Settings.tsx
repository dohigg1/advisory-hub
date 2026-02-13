import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgSettings } from "@/components/settings/OrgSettings";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { PortalSettings } from "@/components/settings/PortalSettings";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { BillingSettings } from "@/components/settings/BillingSettings";
import { AuditLogSettings } from "@/components/settings/AuditLogSettings";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "organisation";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Manage your organisation, team, and billing</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-5">
        <TabsList className="bg-muted/50 p-0.5 h-9">
          <TabsTrigger value="organisation" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Organisation</TabsTrigger>
          <TabsTrigger value="profile" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Profile</TabsTrigger>
          <TabsTrigger value="team" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Team</TabsTrigger>
          <TabsTrigger value="billing" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Billing</TabsTrigger>
          <TabsTrigger value="portal" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Client Portal</TabsTrigger>
          <TabsTrigger value="activity" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="organisation">
          <OrgSettings />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="team">
          <TeamSettings />
        </TabsContent>

        <TabsContent value="billing">
          <BillingSettings />
        </TabsContent>

        <TabsContent value="portal">
          <PortalSettings />
        </TabsContent>

        <TabsContent value="activity">
          <AuditLogSettings />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default Settings;
