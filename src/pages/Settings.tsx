import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgSettings } from "@/components/settings/OrgSettings";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your organisation and team</p>
      </div>

      <Tabs defaultValue="organisation" className="space-y-4">
        <TabsList className="bg-secondary">
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
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Billing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Billing management coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Custom Domains</CardTitle>
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
