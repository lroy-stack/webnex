
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Check, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getIntegrationSettings, updateIntegrationSettings } from "@/services/adminConfigService";

export const IntegrationSettings: React.FC = () => {
  const { data: integrations, isLoading, isError, refetch } = useQuery({
    queryKey: ["integration-settings"],
    queryFn: getIntegrationSettings,
  });

  const [selectedTab, setSelectedTab] = React.useState("analytics");

  const handleSaveIntegration = async (type: string, config: any) => {
    try {
      await updateIntegrationSettings(type, config);
      toast.success(`Configuración de ${type} guardada correctamente`);
      refetch();
    } catch (error) {
      console.error(`Error updating ${type} settings:`, error);
      toast.error(`Error al guardar la configuración de ${type}`);
    }
  };

  if (isLoading) {
    return <IntegrationSettingsSkeleton />;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No se pudo cargar la configuración de integraciones. Por favor, inténtelo de nuevo más tarde.
        </AlertDescription>
      </Alert>
    );
  }

  if (!integrations) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Integraciones</h2>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sin configuración</AlertTitle>
          <AlertDescription>
            No se ha encontrado configuración de integraciones. Configure las integraciones para comenzar.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Obtener estados iniciales de las integraciones
  const analyticsConfig = integrations.find((i: any) => i.type === "analytics") || {
    active: false,
    config: { tracking_id: "", enable_demographics: false }
  };

  const marketingConfig = integrations.find((i: any) => i.type === "marketing") || {
    active: false,
    config: { mailchimp_api_key: "", mailchimp_list_id: "" }
  };

  const communicationConfig = integrations.find((i: any) => i.type === "communication") || {
    active: false,
    config: { webhook_url: "", events: [] }
  };

  const paymentConfig = integrations.find((i: any) => i.type === "payment") || {
    active: false,
    config: { stripe_public_key: "", stripe_webhook_secret: "" }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Integración con Servicios Externos</h2>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="analytics">Analítica</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="communication">Comunicación</TabsTrigger>
          <TabsTrigger value="payment">Pagos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Google Analytics</CardTitle>
                  <CardDescription>
                    Integración con Google Analytics para seguimiento de usuarios
                  </CardDescription>
                </div>
                {analyticsConfig.active && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="mr-1 h-3 w-3" /> Activo
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ga_tracking_id">ID de seguimiento</Label>
                <Input 
                  id="ga_tracking_id" 
                  placeholder="G-XXXXXXXXXX o UA-XXXXXXXX-X"
                  defaultValue={analyticsConfig.config.tracking_id} 
                />
                <p className="text-sm text-muted-foreground">
                  Introduce tu ID de Google Analytics
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="enable_demographics" 
                  defaultChecked={analyticsConfig.config.enable_demographics}
                />
                <Label htmlFor="enable_demographics">Habilitar datos demográficos</Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open("https://analytics.google.com/", "_blank")}
              >
                Ir a Google Analytics <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
              <Button onClick={() => handleSaveIntegration("analytics", {
                active: true,
                config: {
                  tracking_id: (document.getElementById("ga_tracking_id") as HTMLInputElement).value,
                  enable_demographics: (document.getElementById("enable_demographics") as HTMLInputElement).checked
                }
              })}>
                Guardar Configuración
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="marketing" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Mailchimp</CardTitle>
                  <CardDescription>
                    Integración con Mailchimp para marketing por email
                  </CardDescription>
                </div>
                {marketingConfig.active && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="mr-1 h-3 w-3" /> Activo
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mailchimp_api_key">API Key de Mailchimp</Label>
                <Input 
                  id="mailchimp_api_key" 
                  placeholder="xxxxxxxxxxxxxxxxxxxx-us20"
                  defaultValue={marketingConfig.config.mailchimp_api_key}
                  type="password" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mailchimp_list_id">ID de la Lista</Label>
                <Input 
                  id="mailchimp_list_id" 
                  placeholder="abc123def"
                  defaultValue={marketingConfig.config.mailchimp_list_id} 
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open("https://mailchimp.com/", "_blank")}
              >
                Ir a Mailchimp <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
              <Button onClick={() => handleSaveIntegration("marketing", {
                active: true,
                config: {
                  mailchimp_api_key: (document.getElementById("mailchimp_api_key") as HTMLInputElement).value,
                  mailchimp_list_id: (document.getElementById("mailchimp_list_id") as HTMLInputElement).value
                }
              })}>
                Guardar Configuración
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>
                    Configura webhooks para notificaciones automáticas
                  </CardDescription>
                </div>
                {communicationConfig.active && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="mr-1 h-3 w-3" /> Activo
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook_url">URL del Webhook</Label>
                <Input 
                  id="webhook_url" 
                  placeholder="https://example.com/webhook"
                  defaultValue={communicationConfig.config.webhook_url} 
                />
              </div>
              
              <div className="space-y-2">
                <Label>Eventos a notificar</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["new_user", "new_order", "contact_message", "subscription_changed"].map((event) => (
                    <div className="flex items-center space-x-2" key={event}>
                      <Switch 
                        id={`event_${event}`} 
                        defaultChecked={communicationConfig.config.events?.includes(event)}
                      />
                      <Label htmlFor={`event_${event}`}>
                        {event === "new_user" && "Nuevo usuario"}
                        {event === "new_order" && "Nuevo pedido"}
                        {event === "contact_message" && "Mensaje de contacto"}
                        {event === "subscription_changed" && "Cambio en suscripción"}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => window.open("https://zapier.com/", "_blank")}
              >
                Conectar con Zapier <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
              <Button onClick={() => {
                const selectedEvents = ["new_user", "new_order", "contact_message", "subscription_changed"]
                  .filter(event => (document.getElementById(`event_${event}`) as HTMLInputElement).checked);
                  
                handleSaveIntegration("communication", {
                  active: true,
                  config: {
                    webhook_url: (document.getElementById("webhook_url") as HTMLInputElement).value,
                    events: selectedEvents
                  }
                });
              }}>
                Guardar Configuración
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Stripe</CardTitle>
                  <CardDescription>
                    Integración con Stripe para procesamiento de pagos
                  </CardDescription>
                </div>
                {paymentConfig.active && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="mr-1 h-3 w-3" /> Activo
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripe_public_key">Clave Pública</Label>
                <Input 
                  id="stripe_public_key" 
                  placeholder="pk_test_..."
                  defaultValue={paymentConfig.config.stripe_public_key} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stripe_webhook_secret">Secreto del Webhook</Label>
                <Input 
                  id="stripe_webhook_secret" 
                  placeholder="whsec_..."
                  defaultValue={paymentConfig.config.stripe_webhook_secret}
                  type="password" 
                />
              </div>

              <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  Recuerde configurar correctamente las URLs de webhook en su panel de Stripe.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => window.open("https://dashboard.stripe.com/", "_blank")}
              >
                Ir a Stripe <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
              <Button onClick={() => handleSaveIntegration("payment", {
                active: true,
                config: {
                  stripe_public_key: (document.getElementById("stripe_public_key") as HTMLInputElement).value,
                  stripe_webhook_secret: (document.getElementById("stripe_webhook_secret") as HTMLInputElement).value
                }
              })}>
                Guardar Configuración
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const IntegrationSettingsSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 w-48"><Skeleton className="h-full w-full" /></div>
    <Tabs defaultValue="analytics" className="w-full">
      <TabsList className="mb-4 grid w-full grid-cols-2 md:grid-cols-4">
        <Skeleton className="h-9 rounded-md" />
        <Skeleton className="h-9 rounded-md" />
        <Skeleton className="h-9 rounded-md" />
        <Skeleton className="h-9 rounded-md" />
      </TabsList>
      
      <div className="mt-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-48" />
              </div>
              
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-48" />
          </CardFooter>
        </Card>
      </div>
    </Tabs>
  </div>
);
