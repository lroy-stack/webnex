
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
  FormDescription,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getCustomizationSettings, updateCustomizationSettings } from "@/services/adminConfigService";

const customizationSettingsSchema = z.object({
  theme_primary_color: z.string().min(4, "Color requerido"),
  theme_secondary_color: z.string().optional(),
  theme_style: z.enum(["default", "modern", "classic"]),
  logo_url: z.string().optional(),
  favicon_url: z.string().optional(),
  enable_dark_mode: z.boolean().default(true),
  custom_css: z.string().optional(),
  footer_text: z.string().optional(),
  email_template: z.enum(["default", "minimal", "branded"]),
});

type CustomizationSettingsFormValues = z.infer<typeof customizationSettingsSchema>;

export const CustomizationSettings: React.FC = () => {
  const { data: settings, isLoading, isError, refetch } = useQuery({
    queryKey: ["customization-settings"],
    queryFn: getCustomizationSettings,
  });

  const form = useForm<CustomizationSettingsFormValues>({
    resolver: zodResolver(customizationSettingsSchema),
    defaultValues: {
      theme_primary_color: "#3b82f6",
      theme_secondary_color: "#10b981",
      theme_style: "default",
      logo_url: "",
      favicon_url: "",
      enable_dark_mode: true,
      custom_css: "",
      footer_text: "",
      email_template: "default",
    },
  });

  React.useEffect(() => {
    if (settings) {
      form.reset({
        theme_primary_color: settings.theme_primary_color || "#3b82f6",
        theme_secondary_color: settings.theme_secondary_color || "#10b981",
        theme_style: settings.theme_style || "default",
        logo_url: settings.logo_url || "",
        favicon_url: settings.favicon_url || "",
        enable_dark_mode: settings.enable_dark_mode ?? true,
        custom_css: settings.custom_css || "",
        footer_text: settings.footer_text || "",
        email_template: settings.email_template || "default",
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: CustomizationSettingsFormValues) => {
    try {
      await updateCustomizationSettings({
        ...data,
        id: settings?.id || "",
      });
      toast.success("Configuración de personalización guardada correctamente");
      refetch();
    } catch (error) {
      console.error("Error updating customization settings:", error);
      toast.error("Error al guardar la configuración de personalización");
    }
  };

  if (isLoading) {
    return <CustomizationSettingsSkeleton />;
  }

  if (isError) {
    return <div className="text-red-500">Error al cargar la configuración de personalización</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Personalización</h2>
      
      <Tabs defaultValue="theme" className="w-full">
        <TabsList className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <TabsTrigger value="theme">Tema</TabsTrigger>
          <TabsTrigger value="branding">Marca</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="theme" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estilo General</CardTitle>
                  <CardDescription>
                    Configure el estilo visual de la plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="theme_style"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Estilo de la interfaz</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                          >
                            <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
                              <RadioGroupItem value="default" className="sr-only" />
                              <div className="h-16 w-full bg-blue-100 rounded-md mb-2"></div>
                              <span>Predeterminado</span>
                            </Label>
                            <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
                              <RadioGroupItem value="modern" className="sr-only" />
                              <div className="h-16 w-full bg-violet-100 rounded-md mb-2"></div>
                              <span>Moderno</span>
                            </Label>
                            <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
                              <RadioGroupItem value="classic" className="sr-only" />
                              <div className="h-16 w-full bg-gray-100 rounded-md mb-2"></div>
                              <span>Clásico</span>
                            </Label>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Selecciona el estilo visual que mejor se adapte a tu marca
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="theme_primary_color"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Color primario</FormLabel>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-10 h-10 rounded-md border" 
                              style={{ backgroundColor: field.value }}
                            ></div>
                            <FormControl>
                              <Input type="text" {...field} />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="theme_secondary_color"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Color secundario</FormLabel>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-10 h-10 rounded-md border" 
                              style={{ backgroundColor: field.value || '#10b981' }}
                            ></div>
                            <FormControl>
                              <Input type="text" {...field} />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="custom_css"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CSS personalizado</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder=".my-class { color: red; }"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Añade estilos CSS personalizados para modificar la apariencia de la plataforma
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Identidad de Marca</CardTitle>
                  <CardDescription>
                    Personalice los elementos visuales de su marca
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="logo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL del Logo</FormLabel>
                          <FormControl>
                            <Input placeholder="https://miempresa.com/logo.png" {...field} />
                          </FormControl>
                          <FormDescription>
                            URL de la imagen del logo principal
                          </FormDescription>
                          {field.value && (
                            <div className="mt-2 border rounded-md p-2 max-w-xs">
                              <img 
                                src={field.value} 
                                alt="Logo preview" 
                                className="max-h-16 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                                  (e.target as HTMLImageElement).alt = "Error loading image";
                                }}
                              />
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="favicon_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL del Favicon</FormLabel>
                          <FormControl>
                            <Input placeholder="https://miempresa.com/favicon.ico" {...field} />
                          </FormControl>
                          <FormDescription>
                            URL del favicon para el navegador
                          </FormDescription>
                          {field.value && (
                            <div className="mt-2 border rounded-md p-2 w-8 h-8">
                              <img 
                                src={field.value} 
                                alt="Favicon preview" 
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                                  (e.target as HTMLImageElement).alt = "Error loading image";
                                }}
                              />
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="footer_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto del pie de página</FormLabel>
                        <FormControl>
                          <Input placeholder="© 2023 Mi Empresa - Todos los derechos reservados" {...field} />
                        </FormControl>
                        <FormDescription>
                          Texto que aparecerá en el pie de página de la plataforma
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Plantillas de Email</CardTitle>
                  <CardDescription>
                    Configure el aspecto de los correos enviados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="email_template"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Estilo de emails</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                          >
                            <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
                              <RadioGroupItem value="default" className="sr-only" />
                              <div className="h-24 w-full bg-blue-50 rounded-md mb-2 flex flex-col p-2">
                                <div className="w-full h-4 bg-blue-200 rounded mb-2"></div>
                                <div className="w-3/4 h-2 bg-gray-200 rounded mb-1"></div>
                                <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                                <div className="w-1/2 h-2 bg-gray-200 rounded"></div>
                              </div>
                              <span>Predeterminado</span>
                            </Label>
                            <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
                              <RadioGroupItem value="minimal" className="sr-only" />
                              <div className="h-24 w-full bg-gray-50 rounded-md mb-2 flex flex-col p-2">
                                <div className="w-1/4 h-3 bg-gray-300 rounded mb-3"></div>
                                <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                                <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                                <div className="w-3/4 h-2 bg-gray-200 rounded"></div>
                              </div>
                              <span>Minimalista</span>
                            </Label>
                            <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
                              <RadioGroupItem value="branded" className="sr-only" />
                              <div className="h-24 w-full bg-purple-50 rounded-md mb-2 flex flex-col p-2">
                                <div className="w-full h-6 bg-purple-300 rounded mb-2 flex items-center justify-center">
                                  <div className="w-1/4 h-3 bg-white rounded"></div>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                                <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                                <div className="w-1/3 h-4 bg-purple-200 rounded mt-1"></div>
                              </div>
                              <span>Corporativo</span>
                            </Label>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Selecciona el estilo de las plantillas de email
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <Button type="submit" className="w-full md:w-auto">
              Guardar Personalización
            </Button>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

const CustomizationSettingsSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 w-48"><Skeleton className="h-full w-full" /></div>
    <Tabs defaultValue="theme" className="w-full">
      <TabsList className="mb-4 grid grid-cols-3">
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
            <div className="space-y-8">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-28 w-full rounded-md" />
                  <Skeleton className="h-28 w-full rounded-md" />
                  <Skeleton className="h-28 w-full rounded-md" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Tabs>
  </div>
);
