
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
import { Plus, X, Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { 
  addServiceToPack, 
  removeServiceFromPack,
  fetchServicePacks,
  fetchPacksForServiceManager
} from "@/services/adminServiceService";

interface ManagePackServicesProps {
  serviceId: string;
  serviceName: string;
  onUpdate?: () => void;
}

interface PackOption {
  id: string;
  name: string;
}

interface ServicePackItem {
  id: string;
  pack_id: string;
  pack_name: string;
  price: number;
  is_active: boolean;
}

export function ManagePackServices({ serviceId, serviceName, onUpdate }: ManagePackServicesProps) {
  const [packs, setPacks] = useState<PackOption[]>([]);
  const [servicePacks, setServicePacks] = useState<ServicePackItem[]>([]);
  const [selectedPack, setSelectedPack] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [serviceId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [packsData, servicePacksData] = await Promise.all([
        fetchPacksForServiceManager(),
        fetchServicePacks(serviceId)
      ]);
      setPacks(packsData);
      setServicePacks(servicePacksData);
    } catch (error) {
      console.error("Error loading data for pack management:", error);
      toast.error("Error al cargar los datos de packs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPack = async () => {
    if (!selectedPack) {
      toast.error("Por favor, selecciona un pack");
      return;
    }

    setIsAdding(true);
    try {
      const success = await addServiceToPack(serviceId, selectedPack);
      if (success) {
        await loadData();
        setSelectedPack("");
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error adding pack:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemovePack = async (packServiceId: string) => {
    setIsRemoving(packServiceId);
    try {
      const success = await removeServiceFromPack(packServiceId);
      if (success) {
        await loadData();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error removing pack:", error);
    } finally {
      setIsRemoving(null);
    }
  };

  // Filter out packs that are already assigned
  const availablePacks = packs.filter(
    pack => !servicePacks.some(sp => sp.pack_id === pack.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Gestionar Packs
        </CardTitle>
        <CardDescription>
          Añade o elimina este servicio de los diferentes packs disponibles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add to pack section */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <Select
                value={selectedPack}
                onValueChange={setSelectedPack}
                disabled={isLoading || availablePacks.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un pack" />
                </SelectTrigger>
                <SelectContent>
                  {availablePacks.map(pack => (
                    <SelectItem key={pack.id} value={pack.id}>
                      {pack.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddPack}
              disabled={!selectedPack || isAdding || isLoading}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Añadir
            </Button>
          </div>

          {/* Current packs */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {serviceName} está incluido en {servicePacks.length} {servicePacks.length === 1 ? 'pack' : 'packs'}
            </h4>
            
            {servicePacks.length > 0 ? (
              <div className="space-y-2">
                {servicePacks.map(pack => (
                  <div
                    key={pack.id}
                    className="flex items-center justify-between p-2 border rounded-md bg-background"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="font-medium">{pack.pack_name}</div>
                      <Badge variant={pack.is_active ? "default" : "outline"}>
                        {pack.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePack(pack.id)}
                      disabled={isRemoving === pack.id}
                      className="text-destructive hover:text-destructive/90"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Este servicio no está incluido en ningún pack todavía
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
