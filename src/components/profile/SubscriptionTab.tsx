
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ClientSubscription, createCheckoutSession, createCustomerPortalSession } from "@/services/clientDashboardService";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Check, AlertCircle } from "lucide-react";

const SUBSCRIPTION_PRICE_ID = "price_1OqFMDQhnwg20XoqlnhmDPIW"; // Este es un ID de prueba, debes usar tu propio ID de Stripe

interface SubscriptionTabProps {
  subscription: ClientSubscription | null;
  isLoading: boolean;
  onSubscriptionUpdated: () => void;
}

export const SubscriptionTab: React.FC<SubscriptionTabProps> = ({
  subscription,
  isLoading,
  onSubscriptionUpdated
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      const { url, error } = await createCheckoutSession(SUBSCRIPTION_PRICE_ID);
      
      if (error) throw new Error(error);
      if (!url) throw new Error("No se pudo crear la sesión de pago");
      
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la suscripción",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };
  
  const handleManageSubscription = async () => {
    setIsProcessing(true);
    try {
      const { url, error } = await createCustomerPortalSession();
      
      if (error) throw new Error(error);
      if (!url) throw new Error("No se pudo acceder al portal de cliente");
      
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo acceder al portal de cliente",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };
  
  const isActive = subscription?.subscription_status === "active";
  
  if (isLoading) {
    return <div className="py-4">Cargando información de suscripción...</div>;
  }
  
  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Estado de suscripción</h3>
        {isActive && (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
            Activa
          </Badge>
        )}
        {!isActive && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100">
            Inactiva
          </Badge>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Plan Premium</CardTitle>
          <CardDescription>
            Acceso a todas las funcionalidades avanzadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-3xl font-bold">9,90€<span className="text-base font-normal text-muted-foreground">/mes</span></div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <Check className="h-4 w-4 mr-2 text-green-500" />
              <span>Informes y boletines personalizados</span>
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 mr-2 text-green-500" />
              <span>Newsletter con guías y consejos</span>
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 mr-2 text-green-500" />
              <span>Atención prioritaria</span>
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 mr-2 text-green-500" />
              <span>Descuentos en servicios adicionales</span>
            </div>
          </div>
          
          {isActive && subscription?.subscription_end_date && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Tu suscripción se renovará automáticamente el
                  </p>
                  <p className="text-sm text-blue-600">
                    {format(new Date(subscription.subscription_end_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!isActive ? (
            <Button 
              className="w-full" 
              onClick={handleSubscribe}
              disabled={isProcessing}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isProcessing ? "Procesando..." : "Suscribirse ahora"}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleManageSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? "Procesando..." : "Gestionar suscripción"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
