
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pack } from "@/services/adminPackService";
import { CategoryType, categoryConfig } from "@/utils/categoryStyles";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const formSchema = z.object({
  // Basic information
  name: z.string().min(1, "El nombre del pack es obligatorio"),
  short_description: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  target: z.string().optional(),
  slug: z.string().min(1, "El slug es obligatorio"),
  
  // Settings
  type: z.string(),
  color: z.string(),
  position: z.coerce.number().min(1),
  is_active: z.boolean().default(true),
  
  // Features will be handled separately
});

interface PackFormProps {
  pack?: Pack;
  onSubmit: (data: z.infer<typeof formSchema>, features: string[]) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function PackForm({ pack, onSubmit, onCancel, isLoading = false }: PackFormProps) {
  const [features, setFeatures] = useState<string[]>(pack?.features || []);
  const [newFeature, setNewFeature] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: pack?.name || "",
      short_description: pack?.short_description || "",
      description: pack?.description || "",
      price: pack?.price || 0,
      target: pack?.target || "",
      slug: pack?.slug || "",
      type: pack?.type || "basic",
      color: pack?.color?.replace("bg-", "") || "blue-500",
      position: pack?.position || 1,
      is_active: pack?.is_active !== false,
    },
  });

  const handleAddFeature = () => {
    if (newFeature.trim() !== "") {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data, features);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList>
            <TabsTrigger value="basic">Información Básica</TabsTrigger>
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="features">Características</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Pack*</FormLabel>
                        <FormControl>
                          <Input placeholder="Pack Base" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio (€)*</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="short_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción corta</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Una breve descripción del pack"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Texto breve para mostrar en listados
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción completa</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descripción detallada del pack"
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirigido a</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Todo tipo de negocios"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Público objetivo del pack
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="pack-base"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Identificador URL (usar guiones)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="features" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <FormLabel>Características del Pack</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="Nueva característica"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFeature())}
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddFeature}
                        disabled={newFeature.trim() === ""}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir
                      </Button>
                    </div>
                    <FormDescription>
                      Introduce las características que incluye el pack, una a una
                    </FormDescription>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Características ({features.length})
                    </label>
                    <div className="border rounded-md p-4 bg-background min-h-40">
                      {features.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No hay características añadidas
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {features.map((feature, index) => (
                            <li 
                              key={index} 
                              className="flex items-center justify-between bg-muted p-2 rounded-md"
                            >
                              <span>{feature}</span>
                              <Button
                                type="button"
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveFeature(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Pack</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="basic">Básico</SelectItem>
                            <SelectItem value="specialized">Especializado</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="enterprise">Empresarial</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Categoriza el pack según su tipo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un color" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="blue-500">
                              <div className="flex items-center">
                                <div className="h-4 w-4 rounded-full bg-blue-500 mr-2" />
                                <span>Azul</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="green-500">
                              <div className="flex items-center">
                                <div className="h-4 w-4 rounded-full bg-green-500 mr-2" />
                                <span>Verde</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="purple-500">
                              <div className="flex items-center">
                                <div className="h-4 w-4 rounded-full bg-purple-500 mr-2" />
                                <span>Púrpura</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="amber-500">
                              <div className="flex items-center">
                                <div className="h-4 w-4 rounded-full bg-amber-500 mr-2" />
                                <span>Ámbar</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="rose-500">
                              <div className="flex items-center">
                                <div className="h-4 w-4 rounded-full bg-rose-500 mr-2" />
                                <span>Rosa</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Color identificativo del pack
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Posición</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Orden de visualización (menor número = primero)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Pack activo</FormLabel>
                          <FormDescription>
                            Determina si el pack está visible y disponible para contratación
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
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            type="button" 
            disabled={isLoading}
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span> Guardando...
              </>
            ) : (
              pack ? "Actualizar Pack" : "Crear Pack"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
