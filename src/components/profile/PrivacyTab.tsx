
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ClientPrivacySettings, updateClientPrivacySettings } from "@/services/clientDashboardService";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Loader2, Lock, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { DeleteAccountSection } from "./DeleteAccountSection";

const privacySchema = z.object({
  marketing_emails: z.boolean(),
  newsletter: z.boolean(),
  usage_analytics: z.boolean(),
  cookie_preferences: z.object({
    essential: z.boolean(),
    analytics: z.boolean(),
    marketing: z.boolean()
  })
});

interface PrivacyTabProps {
  privacySettings: ClientPrivacySettings | null;
  isLoading: boolean;
  onPrivacyUpdated: () => void;
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
  confirmNewPassword: z.string()
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmNewPassword"]
});

export const PrivacyTab: React.FC<PrivacyTabProps> = ({
  privacySettings,
  isLoading,
  onPrivacyUpdated
}) => {
  const { toast } = useToast();
  const { updatePassword } = useAuth();
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  const form = useForm<z.infer<typeof privacySchema>>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      marketing_emails: privacySettings?.marketing_emails ?? true,
      newsletter: privacySettings?.newsletter ?? true,
      usage_analytics: privacySettings?.usage_analytics ?? true,
      cookie_preferences: {
        essential: privacySettings?.cookie_preferences?.essential ?? true,
        analytics: privacySettings?.cookie_preferences?.analytics ?? true,
        marketing: privacySettings?.cookie_preferences?.marketing ?? false
      }
    }
  });
  
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: ""
    }
  });
  
  React.useEffect(() => {
    if (privacySettings) {
      form.reset({
        marketing_emails: privacySettings.marketing_emails,
        newsletter: privacySettings.newsletter,
        usage_analytics: privacySettings.usage_analytics,
        cookie_preferences: {
          essential: privacySettings.cookie_preferences.essential,
          analytics: privacySettings.cookie_preferences.analytics,
          marketing: privacySettings.cookie_preferences.marketing
        }
      });
    }
  }, [privacySettings, form.reset]);
  
  const onSubmit = async (data: z.infer<typeof privacySchema>) => {
    try {
      // Ensure all cookie_preferences fields are present and of the correct type
      const formattedData = {
        ...data,
        cookie_preferences: {
          essential: Boolean(data.cookie_preferences.essential),
          analytics: Boolean(data.cookie_preferences.analytics),
          marketing: Boolean(data.cookie_preferences.marketing)
        }
      };
      
      const { error } = await updateClientPrivacySettings(formattedData);
      
      if (error) throw error;
      
      toast({
        title: "Preferencias actualizadas",
        description: "Se han guardado tus preferencias de privacidad"
      });
      
      onPrivacyUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron actualizar las preferencias de privacidad",
        variant: "destructive"
      });
    }
  };
  
  const handlePasswordUpdate = async (data: z.infer<typeof passwordSchema>) => {
    setIsPasswordLoading(true);
    
    try {
      const { error } = await updatePassword(data.newPassword);
      
      if (error) throw error;
      
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente"
      });
      
      // Limpiar el formulario
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la contraseña",
        variant: "destructive"
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };
  
  if (isLoading) {
    return <div className="py-4">Cargando preferencias de privacidad...</div>;
  }
  
  return (
    <div className="space-y-6 py-4">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h3 className="text-lg font-medium">Cambiar contraseña</h3>
        </div>
        
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña actual</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} disabled={isPasswordLoading} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} disabled={isPasswordLoading} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={passwordForm.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nueva contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} disabled={isPasswordLoading} />
                  </FormControl>
                  {passwordForm.formState.errors.confirmNewPassword && (
                    <p className="text-sm font-medium text-destructive">
                      {passwordForm.formState.errors.confirmNewPassword.message}
                    </p>
                  )}
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              disabled={isPasswordLoading}
            >
              {isPasswordLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : "Actualizar contraseña"}
            </Button>
          </form>
        </Form>
        
        <Separator className="my-6" />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <h3 className="text-lg font-medium">Documentos legales</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Política de privacidad</CardTitle>
              <CardDescription>Cómo tratamos tus datos personales</CardDescription>
            </CardHeader>
            <CardContent>
              <a 
                href="/privacidad"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center hover:underline"
              >
                Ver política de privacidad <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Términos y condiciones</CardTitle>
              <CardDescription>Condiciones de uso del servicio</CardDescription>
            </CardHeader>
            <CardContent>
              <a 
                href="/terminos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center hover:underline"
              >
                Ver términos y condiciones <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="border-t pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <h3 className="text-lg font-medium">Preferencias de comunicación</h3>
            
            <FormField
              control={form.control}
              name="marketing_emails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Emails de marketing
                    </FormLabel>
                    <FormDescription>
                      Recibir ofertas y actualizaciones sobre nuestros servicios
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="newsletter"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Newsletter
                    </FormLabel>
                    <FormDescription>
                      Recibir nuestro boletín mensual con consejos y novedades
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="usage_analytics"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Análisis de uso
                    </FormLabel>
                    <FormDescription>
                      Permitir el análisis de cómo utilizas nuestra plataforma para mejorar la experiencia
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <h3 className="text-lg font-medium pt-4">Preferencias de cookies</h3>
            
            <FormField
              control={form.control}
              name="cookie_preferences.essential"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Cookies esenciales
                    </FormLabel>
                    <FormDescription>
                      Necesarias para el funcionamiento básico del sitio
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={true} // Las cookies esenciales no se pueden desactivar
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cookie_preferences.analytics"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Cookies analíticas
                    </FormLabel>
                    <FormDescription>
                      Nos ayudan a entender cómo utilizas el sitio
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cookie_preferences.marketing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Cookies de marketing
                    </FormLabel>
                    <FormDescription>
                      Utilizadas para mostrarte anuncios relevantes
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isLoading}>
              Guardar preferencias
            </Button>
          </form>
        </Form>
      </div>
      
      {/* Añadimos la sección para eliminar la cuenta */}
      <DeleteAccountSection />
    </div>
  );
};
