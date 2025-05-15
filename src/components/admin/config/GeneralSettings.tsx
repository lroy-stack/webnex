
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { getWebsiteSettings, updateWebsiteSettings } from "@/services/adminConfigService";

const generalSettingsSchema = z.object({
  site_name: z.string().min(2, "El nombre del sitio es obligatorio"),
  meta_title: z.string().min(2, "El título meta es obligatorio"),
  meta_description: z.string().min(2, "La descripción meta es obligatoria"),
  contact_email: z.string().email("Email inválido"),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  tagline: z.string().optional(),
  maintenance_mode: z.boolean().default(false),
  enable_registration: z.boolean().default(true),
  enable_blog: z.boolean().default(false),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;

export const GeneralSettings: React.FC = () => {
  const { data: settings, isLoading, isError, refetch } = useQuery({
    queryKey: ["website-settings"],
    queryFn: getWebsiteSettings,
  });

  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      site_name: "",
      meta_title: "",
      meta_description: "",
      contact_email: "",
      contact_phone: "",
      address: "",
      tagline: "",
      maintenance_mode: false,
      enable_registration: true,
      enable_blog: false,
    },
  });

  React.useEffect(() => {
    if (settings) {
      form.reset({
        site_name: settings.site_name || "",
        meta_title: settings.meta_title || "",
        meta_description: settings.meta_description || "",
        contact_email: settings.contact_email || "",
        contact_phone: settings.contact_phone || "",
        address: settings.address || "",
        tagline: settings.tagline || "",
        maintenance_mode: settings.maintenance_mode || false,
        enable_registration: settings.enable_registration ?? true,
        enable_blog: settings.enable_blog || false,
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: GeneralSettingsFormValues) => {
    try {
      await updateWebsiteSettings({
        ...data,
        id: settings?.id || "",
      });
      toast.success("Configuración guardada correctamente");
      refetch();
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Error al guardar la configuración");
    }
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (isError) {
    return <div className="text-red-500">Error al cargar la configuración</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Ajustes Generales</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="site_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Sitio</FormLabel>
                  <FormControl>
                    <Input placeholder="Mi Empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eslogan</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu solución digital" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="meta_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título Meta (SEO)</FormLabel>
                  <FormControl>
                    <Input placeholder="Mi Empresa | Servicios Digitales" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="meta_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción Meta (SEO)</FormLabel>
                  <FormControl>
                    <Input placeholder="Servicios digitales para empresas..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de Contacto</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contacto@miempresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono de Contacto</FormLabel>
                  <FormControl>
                    <Input placeholder="+34 123 456 789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Calle Principal 123, Ciudad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Opciones del Sistema</h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="maintenance_mode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Modo Mantenimiento</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Activa para mostrar página de mantenimiento
                      </p>
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
                name="enable_registration"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Registro de Usuarios</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Permite que los usuarios se registren
                      </p>
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
                name="enable_blog"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Módulo de Blog</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Activa la funcionalidad de blog
                      </p>
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
          </div>
          
          <Button type="submit" className="w-full md:w-auto">
            Guardar Cambios
          </Button>
        </form>
      </Form>
    </div>
  );
};

const SettingsSkeleton = () => (
  <div className="space-y-4">
    <div className="h-8 w-48 mb-6"><Skeleton className="h-full w-full" /></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="col-span-1 md:col-span-2 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  </div>
);
