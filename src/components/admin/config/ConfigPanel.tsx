
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { GeneralSettings } from "./GeneralSettings";
import { NotificationSettings } from "./NotificationSettings";
import { BillingSettings } from "./BillingSettings";
import { CustomizationSettings } from "./CustomizationSettings";
import { IntegrationSettings } from "./IntegrationSettings";

export const ConfigPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Configuración del Sistema</h1>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="billing">Facturación</TabsTrigger>
          <TabsTrigger value="customization">Personalización</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
        </TabsList>
        
        <Card className="p-6">
          <TabsContent value="general" className="mt-0">
            <GeneralSettings />
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-0">
            <NotificationSettings />
          </TabsContent>
          
          <TabsContent value="billing" className="mt-0">
            <BillingSettings />
          </TabsContent>
          
          <TabsContent value="customization" className="mt-0">
            <CustomizationSettings />
          </TabsContent>
          
          <TabsContent value="integrations" className="mt-0">
            <IntegrationSettings />
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
};
