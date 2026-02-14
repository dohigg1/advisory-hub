import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgSettings } from "@/components/settings/OrgSettings";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { PortalSettings } from "@/components/settings/PortalSettings";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { BillingSettings } from "@/components/settings/BillingSettings";
import { AuditLogSettings } from "@/components/settings/AuditLogSettings";
import { BrandingSettings } from "@/components/settings/BrandingSettings";
import { SSOSettings } from "@/components/settings/SSOSettings";
import { DeveloperSettings } from "@/components/settings/DeveloperSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
        <p className="text-[13px] text-muted-foreground mt-0.5">Manage your organisation, team, branding, and billing</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-5">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="bg-muted/50 p-0.5 h-9 inline-flex w-auto min-w-full">
            <TabsTrigger value="organisation" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Organisation</TabsTrigger>
            <TabsTrigger value="profile" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Profile</TabsTrigger>
            <TabsTrigger value="team" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Team</TabsTrigger>
            <TabsTrigger value="branding" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Branding</TabsTrigger>
            <TabsTrigger value="billing" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Billing</TabsTrigger>
            <TabsTrigger value="portal" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Client Portal</TabsTrigger>
            <TabsTrigger value="developer" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Developer</TabsTrigger>
            <TabsTrigger value="sso" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">SSO</TabsTrigger>
            <TabsTrigger value="privacy" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Privacy</TabsTrigger>
            <TabsTrigger value="activity" className="text-[13px] h-8 data-[state=active]:shadow-soft-sm">Activity</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="organisation">
          <OrgSettings />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="team">
          <TeamSettings />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingSettings />
        </TabsContent>

        <TabsContent value="billing">
          <BillingSettings />
        </TabsContent>

        <TabsContent value="portal">
          <PortalSettings />
        </TabsContent>

        <TabsContent value="developer">
          <DeveloperSettings />
        </TabsContent>

        <TabsContent value="sso">
          <SSOSettings />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacySettings />
        </TabsContent>

        <TabsContent value="activity">
          <AuditLogSettings />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default Settings;
