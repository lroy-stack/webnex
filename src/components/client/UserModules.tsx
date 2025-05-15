
import React, { useState } from "react";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Package, Check, Clock, Construction } from "lucide-react";
import { UserModule, AvailableService, addUserModule } from "@/services/clientDashboardService";
import { useToast } from "@/hooks/use-toast";
import { getCategoryStyles } from "@/utils/categoryStyles";

interface UserModulesProps {
  modules: UserModule[];
  availableServices: AvailableService[];
  isLoading: boolean;
  onModuleAdded: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <Check className="h-5 w-5 text-green-500" />;
    case "pending":
      return <Clock className="h-5 w-5 text-amber-500" />;
    case "development":
      return <Construction className="h-5 w-5 text-blue-500" />;
    default:
      return null;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "Activo";
    case "pending":
      return "Pendiente";
    case "development":
      return "En desarrollo";
    default:
      return status;
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "active":
      return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
    case "pending":
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20";
    case "development":
      return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
    default:
      return "text-muted-foreground bg-muted/30";
  }
};

export const UserModules: React.FC<UserModulesProps> = ({
  modules,
  availableServices,
  isLoading,
  onModuleAdded
}) => {
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<string>("");
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddModule = async () => {
    if (!selectedService) {
      toast({
        title: "Selecciona un módulo",
        description: "Debes seleccionar un módulo para añadir",
        variant: "destructive"
      });
      return;
    }

    setIsAddingModule(true);
    
    try {
      const success = await addUserModule(selectedService);
      
      if (success) {
        toast({
          title: "Módulo añadido",
          description: "El módulo ha sido añadido correctamente"
        });
        setSelectedService("");
        setIsDialogOpen(false);
        onModuleAdded();
      } else {
        toast({
          title: "Error",
          description: "No se pudo añadir el módulo",
          variant: "destructive"
        });
      }
    } finally {
      setIsAddingModule(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="absolute inset-x-0 h-1 top-0 bg-gradient-to-r from-purple-400 to-indigo-500"></div>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Mis Módulos</CardTitle>
            <CardDescription>Cargando módulos...</CardDescription>
          </div>
          <div className="h-9 w-32 bg-muted/40 animate-pulse rounded-md"></div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20 animate-pulse h-16">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted/60"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted/60 rounded-full"></div>
                  <div className="h-3 w-16 bg-muted/40 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="absolute inset-x-0 h-1 top-0 bg-gradient-to-r from-purple-400 to-indigo-500"></div>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Mis Módulos</CardTitle>
          <CardDescription>Módulos activos en tu proyecto</CardDescription>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Añadir módulo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir nuevo módulo</DialogTitle>
              <DialogDescription>
                Selecciona un módulo para añadir a tu proyecto
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un módulo" />
                </SelectTrigger>
                <SelectContent>
                  {availableServices.length > 0 ? (
                    availableServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No hay módulos disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleAddModule} 
                disabled={isAddingModule || !selectedService}
              >
                {isAddingModule ? "Añadiendo..." : "Añadir módulo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <p className="text-muted-foreground">No tienes módulos activos</p>
            <p className="text-xs text-muted-foreground mt-1">
              Añade módulos a tu proyecto para comenzar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {modules.map((module) => {
              const categoryStyle = getCategoryStyles(module.service.category);
              
              return (
                <div 
                  key={module.id}
                  className="flex items-center justify-between p-3 border rounded-lg transition-all duration-300 hover:shadow-sm hover:bg-muted/5"
                >
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full ${categoryStyle.bgColor} flex items-center justify-center mr-3`}>
                      <Package className={`h-5 w-5 ${categoryStyle.color.replace('border-', 'text-')}`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{module.service.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {module.service.category.charAt(0).toUpperCase() + module.service.category.slice(1)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusClass(module.status)} flex items-center gap-1.5`}>
                      {getStatusIcon(module.status)}
                      {getStatusText(module.status)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
