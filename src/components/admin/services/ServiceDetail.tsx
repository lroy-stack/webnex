
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { StatusBadge } from "../shared/StatusBadge";
import { 
  Service,
  fetchServicePacks,
  fetchServiceClients
} from "@/services/adminServiceService";
import { AdminTable } from "../shared/AdminTable";
import { Button } from "@/components/ui/button";
import { Eye, Package, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { getCategoryStyles } from "@/utils/categoryStyles";
import { ManagePackServices } from "./ManagePackServices";

interface ServiceDetailProps {
  service: Service;
}

export function ServiceDetail({ service }: ServiceDetailProps) {
  const navigate = useNavigate();
  const [packs, setPacks] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingPacks, setIsLoadingPacks] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  useEffect(() => {
    loadData();
  }, [service.id]);

  const loadData = async () => {
    await Promise.all([
      loadPacksData(),
      loadClientsData()
    ]);
  };

  const loadPacksData = async () => {
    setIsLoadingPacks(true);
    try {
      const data = await fetchServicePacks(service.id);
      setPacks(data);
    } catch (error) {
      console.error("Error loading service packs:", error);
    } finally {
      setIsLoadingPacks(false);
    }
  };

  const loadClientsData = async () => {
    setIsLoadingClients(true);
    try {
      const data = await fetchServiceClients(service.id);
      setClients(data);
    } catch (error) {
      console.error("Error loading service clients:", error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const categoryStyles = getCategoryStyles(service.category);

  // Components for empty states
  const EmptyPacks = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No hay packs asociados</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Este servicio no está incluido en ningún pack actualmente.
      </p>
    </div>
  );

  const EmptyClients = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No hay clientes asociados</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Este servicio no ha sido contratado por ningún cliente aún.
      </p>
    </div>
  );

  // Columns for packs table
  const packsColumns = [
    {
      id: "pack_name",
      header: "Pack",
      cell: (pack: any) => <div className="font-medium">{pack.pack_name}</div>,
      sortable: true
    },
    {
      id: "price",
      header: "Precio del Pack",
      cell: (pack: any) => <div>{pack.price.toLocaleString('es-ES')} €</div>,
      sortable: true
    },
    {
      id: "is_active",
      header: "Estado",
      cell: (pack: any) => <StatusBadge status={pack.is_active ? "active" : "inactive"} />,
      sortable: true
    }
  ];

  // Columns for clients table
  const clientsColumns = [
    {
      id: "client_name",
      header: "Cliente",
      cell: (client: any) => <div className="font-medium">{client.client_name}</div>,
      sortable: true
    },
    {
      id: "status",
      header: "Estado",
      cell: (client: any) => <StatusBadge status={client.status} />,
      sortable: true
    },
    {
      id: "created_at",
      header: "Fecha de contratación",
      cell: (client: any) => formatDate(client.created_at),
      sortable: true
    }
  ];

  return (
    <Tabs defaultValue="info" className="w-full space-y-6">
      <TabsList>
        <TabsTrigger value="info">Información General</TabsTrigger>
        <TabsTrigger value="packs">Packs ({packs.length})</TabsTrigger>
        <TabsTrigger value="clients">Clientes ({clients.length})</TabsTrigger>
      </TabsList>
      
      <TabsContent value="info">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                <p className="text-lg font-medium">{service.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                <Badge className={`${categoryStyles.badgeColor} mt-1`}>
                  {categoryStyles.name}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Precio</p>
                <p className="text-xl font-bold">{service.price.toLocaleString('es-ES')} €</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <StatusBadge status={service.is_active ? "active" : "inactive"} className="mt-1" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Métricas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-md p-4 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Packs</p>
                  <p className="text-2xl font-bold mt-1">{packs.length}</p>
                  <p className="text-xs text-muted-foreground">Que incluyen este servicio</p>
                </div>
                
                <div className="border rounded-md p-4 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Clientes</p>
                  <p className="text-2xl font-bold mt-1">{clients.length}</p>
                  <p className="text-xs text-muted-foreground">Con este servicio activo</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de creación</p>
                <p className="text-base">{formatDate(service.created_at)}</p>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-muted-foreground">Popularidad</p>
                <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (clients.length || 0) * 10)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Basado en la cantidad de clientes que han contratado este servicio
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none dark:prose-invert">
                <p>{service.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* New component to manage packs */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Gestión de Packs</CardTitle>
              <CardDescription>
                Añade o elimina este servicio de los packs disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ManagePackServices 
                serviceId={service.id} 
                serviceName={service.name}
                onUpdate={loadPacksData}
              />
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="packs">
        <Card>
          <CardHeader>
            <CardTitle>Packs que incluyen este servicio</CardTitle>
            <CardDescription>
              Packs que tienen este servicio como parte de su oferta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {packs.length > 0 ? (
              <AdminTable
                columns={packsColumns}
                data={packs}
                isLoading={isLoadingPacks}
                searchable={false}
                actions={(pack) => (
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => {
                      navigate(`/auth-myweb/packs/${pack.pack_id}`);
                    }}
                    title="Ver detalles del pack"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              />
            ) : (
              !isLoadingPacks && <EmptyPacks />
            )}
          </CardContent>
        </Card>
        
        {/* Add management component also in this tab */}
        <div className="mt-6">
          <ManagePackServices 
            serviceId={service.id} 
            serviceName={service.name}
            onUpdate={loadPacksData}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="clients">
        <Card>
          <CardHeader>
            <CardTitle>Clientes con este servicio</CardTitle>
            <CardDescription>
              Clientes que tienen contratado este servicio
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length > 0 ? (
              <AdminTable
                columns={clientsColumns}
                data={clients}
                isLoading={isLoadingClients}
                searchable={false}
                actions={(client) => (
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => {
                      navigate(`/auth-myweb/clients/${client.client_id}`);
                    }}
                    title="Ver detalles del cliente"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              />
            ) : (
              !isLoadingClients && <EmptyClients />
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
