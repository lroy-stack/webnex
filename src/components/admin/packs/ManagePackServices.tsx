
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, LayoutGrid, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { 
  addServiceToPack, 
  removeServiceFromPack,
  fetchPackServices,
  fetchServicesForPackManager
} from "@/services/adminPackService";
import { getCategoryStyles } from "@/utils/categoryStyles";

interface ManagePackServicesProps {
  packId: string;
  packName: string;
  onUpdate?: () => void;
}

interface ServiceOption {
  id: string;
  name: string;
  category: string;
}

interface PackServiceItem {
  id: string;
  service_id: string;
  service_name: string;
  category: string;
  price: number;
}

export function ManagePackServices({ packId, packName, onUpdate }: ManagePackServicesProps) {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [packServices, setPackServices] = useState<PackServiceItem[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [packId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [servicesData, packServicesData] = await Promise.all([
        fetchServicesForPackManager(),
        fetchPackServices(packId)
      ]);
      setServices(servicesData);
      setPackServices(packServicesData);
    } catch (error) {
      console.error("Error loading data for service management:", error);
      toast.error("Error al cargar los datos de servicios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = async () => {
    if (!selectedService) {
      toast.error("Por favor, selecciona un servicio");
      return;
    }

    setIsAdding(true);
    try {
      const success = await addServiceToPack(packId, selectedService);
      if (success) {
        await loadData();
        setSelectedService("");
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error adding service:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveService = async (packServiceId: string) => {
    setIsRemoving(packServiceId);
    try {
      const success = await removeServiceFromPack(packServiceId);
      if (success) {
        await loadData();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error removing service:", error);
    } finally {
      setIsRemoving(null);
    }
  };

  // Filter out services that are already assigned
  const availableServices = services.filter(
    service => !packServices.some(ps => ps.service_id === service.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5" />
          Gestionar Servicios
        </CardTitle>
        <CardDescription>
          Añade o elimina servicios de este pack
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add service section */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <Select
                value={selectedService}
                onValueChange={setSelectedService}
                disabled={isLoading || availableServices.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {availableServices.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddService}
              disabled={!selectedService || isAdding || isLoading}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Añadir
            </Button>
          </div>

          {/* Current services */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {packName} incluye {packServices.length} {packServices.length === 1 ? 'servicio' : 'servicios'}
            </h4>
            
            {packServices.length > 0 ? (
              <div className="space-y-2">
                {packServices.map(service => {
                  const categoryStyles = getCategoryStyles(service.category);
                  return (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-2 border rounded-md bg-background"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="font-medium">{service.service_name}</div>
                        <Badge className={categoryStyles.badgeColor}>
                          {categoryStyles.name}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {service.price.toLocaleString('es-ES')} €
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveService(service.id)}
                        disabled={isRemoving === service.id}
                        className="text-destructive hover:text-destructive/90"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Este pack no incluye ningún servicio todavía
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
