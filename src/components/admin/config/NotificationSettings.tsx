
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getNotificationSettings, updateNotificationSettings } from "@/services/adminConfigService";

const notificationSettingsSchema = z.object({
  notification_email: z.string().email("Email inválido"),
  new_contact_messages: z.boolean().default(true),
  new_user_signup: z.boolean().default(true),
  user_subscription_changes: z.boolean().default(true),
  security_alerts: z.boolean().default(true),
  daily_notification_summary: z.boolean().default(false),
  notify_telegram: z.boolean().default(false),
  telegram_bot_token: z.string().optional(),
  telegram_chat_id: z.string().optional(),
  notify_slack: z.boolean().default(false),
  slack_webhook_url: z.string().optional(),
});

type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;

export const NotificationSettings: React.FC = () => {
  const { data: settings, isLoading, isError, refetch } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: getNotificationSettings,
  });

  const form = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      notification_email: "",
      new_contact_messages: true,
      new_user_signup: true,
      user_subscription_changes: true,
      security_alerts: true,
      daily_notification_summary: false,
      notify_telegram: false,
      telegram_bot_token: "",
      telegram_chat_id: "",
      notify_slack: false,
      slack_webhook_url: "",
    },
  });

  React.useEffect(() => {
    if (settings) {
      form.reset({
        notification_email: settings.notification_email || "",
        new_contact_messages: settings.new_contact_messages ?? true,
        new_user_signup: settings.new_user_signup ?? true,
        user_subscription_changes: settings.user_subscription_changes ?? true,
        security_alerts: settings.security_alerts ?? true,
        daily_notification_summary: settings.daily_notification_summary ?? false,
        notify_telegram: settings.notify_telegram ?? false,
        telegram_bot_token: settings.telegram_bot_token || "",
        telegram_chat_id: settings.telegram_chat_id || "",
        notify_slack: settings.notify_slack ?? false,
        slack_webhook_url: settings.slack_webhook_url || "",
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: NotificationSettingsFormValues) => {
    try {
      await updateNotificationSettings({
        ...data,
        id: settings?.id || "",
      });
      toast.success("Configuración de notificaciones guardada correctamente");
      refetch();
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("Error al guardar la configuración de notificaciones");
    }
  };

  const watchTelegram = form.watch("notify_telegram");
  const watchSlack = form.watch("notify_slack");

  if (isLoading) {
    return <NotificationSettingsSkeleton />;
  }

  if (isError) {
    return <div className="text-red-500">Error al cargar la configuración de notificaciones</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Gestión de Notificaciones</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Configuración de Email</h3>
              <FormField
                control={form.control}
                name="notification_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email para Notificaciones</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@miempresa.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Las notificaciones del sistema se enviarán a este email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Tipos de Notificaciones</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="new_contact_messages"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Nuevos Mensajes de Contacto</FormLabel>
                        <FormDescription>
                          Notificar cuando llegue un nuevo mensaje de contacto
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
                  name="new_user_signup"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Nuevos Registros</FormLabel>
                        <FormDescription>
                          Notificar cuando un nuevo usuario se registre
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
                  name="user_subscription_changes"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Cambios en Suscripciones</FormLabel>
                        <FormDescription>
                          Notificar cambios en suscripciones de clientes
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
                  name="security_alerts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Alertas de Seguridad</FormLabel>
                        <FormDescription>
                          Notificar eventos de seguridad importantes
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
                  name="daily_notification_summary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Resumen Diario</FormLabel>
                        <FormDescription>
                          Recibir un resumen diario de actividad
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Canales Adicionales</h3>
              
              <div className="space-y-6">
                <div>
                  <FormField
                    control={form.control}
                    name="notify_telegram"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Notificaciones por Telegram</FormLabel>
                          <FormDescription>
                            Recibir notificaciones en Telegram
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
                  
                  {watchTelegram && (
                    <div className="mt-4 pl-4 border-l-2 border-muted space-y-4">
                      <FormField
                        control={form.control}
                        name="telegram_bot_token"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Token del Bot</FormLabel>
                            <FormControl>
                              <Input placeholder="1234567890:ABCDEF..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="telegram_chat_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID del Chat</FormLabel>
                            <FormControl>
                              <Input placeholder="123456789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <FormField
                    control={form.control}
                    name="notify_slack"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Notificaciones por Slack</FormLabel>
                          <FormDescription>
                            Recibir notificaciones en un canal de Slack
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
                  
                  {watchSlack && (
                    <div className="mt-4 pl-4 border-l-2 border-muted">
                      <FormField
                        control={form.control}
                        name="slack_webhook_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL del Webhook</FormLabel>
                            <FormControl>
                              <Input placeholder="https://hooks.slack.com/services/..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Button type="submit" className="w-full md:w-auto">
            Guardar Configuración
          </Button>
        </form>
      </Form>
    </div>
  );
};

const NotificationSettingsSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 w-64"><Skeleton className="h-full w-full" /></div>
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="h-6 w-48"><Skeleton className="h-full w-full" /></div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="h-6 w-48"><Skeleton className="h-full w-full" /></div>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);
