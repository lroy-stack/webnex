
import React from "react";
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
import { Service } from "@/services/adminServiceService";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { CategoryType, categoryConfig } from "@/utils/categoryStyles";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  // Basic information
  name: z.string().min(1, "El nombre del servicio es obligatorio"),
  description: z.string().min(1, "La descripción es obligatoria"),
  price: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  category: z.string(),
  is_active: z.boolean().default(true),
});

interface ServiceFormProps {
  service?: Service;
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ServiceForm({ service, onSubmit, onCancel, isLoading = false }: ServiceFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service?.name || "",
      description: service?.description || "",
      price: service?.price || 0,
      category: service?.category || "technical",
      is_active: service?.is_active !== false,
    },
  });

  const selectedCategory = form.watch("category") as CategoryType;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Servicio*</FormLabel>
                    <FormControl>
                      <Input placeholder="Diseño web responsive" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(categoryConfig).map(([value, config]) => (
                          value !== 'all' && (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center">
                                <Badge className={config.badgeColor + " mr-2"}>
                                  {value.charAt(0).toUpperCase()}
                                </Badge>
                                <span>{config.name}</span>
                              </div>
                            </SelectItem>
                          )
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCategory && (
                      <FormDescription>
                        <Badge className={categoryConfig[selectedCategory]?.badgeColor}>
                          {categoryConfig[selectedCategory]?.name}
                        </Badge>
                      </FormDescription>
                    )}
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
                    <FormDescription>
                      Precio base del servicio
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
                    <FormLabel>Descripción*</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción detallada del servicio"
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Descripción completa del servicio
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
                      <FormLabel>Servicio activo</FormLabel>
                      <FormDescription>
                        Determina si el servicio está disponible para contratación
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
              service ? "Actualizar Servicio" : "Crear Servicio"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
