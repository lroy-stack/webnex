
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { ClientTaxInfo, updateClientTaxInfo } from "@/services/clientDashboardService";
import { useToast } from "@/hooks/use-toast";

const taxInfoSchema = z.object({
  tax_id: z.string().optional(),
  legal_name: z.string().optional(),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
});

interface TaxInfoTabProps {
  taxInfo: ClientTaxInfo | null;
  isLoading: boolean;
  onTaxInfoUpdated: () => void;
}

export const TaxInfoTab: React.FC<TaxInfoTabProps> = ({
  taxInfo,
  isLoading,
  onTaxInfoUpdated
}) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof taxInfoSchema>>({
    resolver: zodResolver(taxInfoSchema),
    defaultValues: {
      tax_id: taxInfo?.tax_id || "",
      legal_name: taxInfo?.legal_name || "",
      address: taxInfo?.address || "",
      postal_code: taxInfo?.postal_code || "",
      city: taxInfo?.city || "",
      province: taxInfo?.province || "",
      country: taxInfo?.country || "España",
    }
  });
  
  React.useEffect(() => {
    if (taxInfo) {
      form.reset({
        tax_id: taxInfo.tax_id || "",
        legal_name: taxInfo.legal_name || "",
        address: taxInfo.address || "",
        postal_code: taxInfo.postal_code || "",
        city: taxInfo.city || "",
        province: taxInfo.province || "",
        country: taxInfo.country || "España",
      });
    }
  }, [taxInfo, form.reset]);
  
  const onSubmit = async (data: z.infer<typeof taxInfoSchema>) => {
    try {
      const { error } = await updateClientTaxInfo(data);
      
      if (error) throw error;
      
      toast({
        title: "Datos fiscales actualizados",
        description: "Se han guardado los cambios en tus datos fiscales"
      });
      
      onTaxInfoUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar los datos fiscales",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return <div className="py-4">Cargando datos fiscales...</div>;
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormDescription>
          Información necesaria para la facturación de tus servicios
        </FormDescription>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tax_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIF/CIF</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="B12345678" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="legal_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razón social</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Tu Empresa S.L." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Dirección fiscal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Calle, número, piso" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código postal</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="28001" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Madrid" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provincia</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Madrid" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="España" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Button type="submit" disabled={isLoading}>
          Guardar cambios
        </Button>
      </form>
    </Form>
  );
};
