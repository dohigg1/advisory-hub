import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgSettings } from "@/components/settings/OrgSettings";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your organisation and team</p>
      </div>

      <Tabs defaultValue="organisation" className="space-y-6">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="organisation">Organisation</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
        </TabsList>

        <TabsContent value="organisation">
          <OrgSettings />
        </TabsContent>

        <TabsContent value="team">
          <TeamSettings />
        </TabsContent>

        <TabsContent value="billing">
          <Card className="shadow-soft-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold tracking-tight">Billing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Billing management coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains">
          <Card className="shadow-soft-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold tracking-tight">Custom Domains</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Custom domain configuration coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
