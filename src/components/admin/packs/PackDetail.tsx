
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
  Pack,
  fetchPackServices,
  fetchPackClients
} from "@/services/adminPackService";
import { AdminTable } from "../shared/AdminTable";
import { Button } from "@/components/ui/button";
import { Eye, Package, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ManagePackServices } from "./ManagePackServices";
import { getCategoryStyles } from "@/utils/categoryStyles";

interface PackDetailProps {
  pack: Pack;
}

export function PackDetail({ pack }: PackDetailProps) {
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  useEffect(() => {
    loadData();
  }, [pack.id]);

  const loadData = async () => {
    await Promise.all([
      loadServicesData(),
      loadClientsData()
    ]);
  };

  const loadServicesData = async () => {
    setIsLoadingServices(true);
    try {
      const data = await fetchPackServices(pack.id);
      setServices(data);
    } catch (error) {
      console.error("Error loading pack services:", error);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const loadClientsData = async () => {
    setIsLoadingClients(true);
    try {
      const data = await fetchPackClients(pack.id);
      setClients(data);
    } catch (error) {
      console.error("Error loading pack clients:", error);
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

  // Empty data components
  const EmptyServices = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No hay servicios asociados</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Este pack no tiene servicios asociados actualmente.
      </p>
    </div>
  );

  const EmptyClients = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No hay clientes suscritos</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Este pack no tiene clientes suscritos actualmente.
      </p>
    </div>
  );

  // Columns for services table
  const servicesColumns = [
    {
      id: "service_name",
      header: "Servicio",
      cell: (service: any) => <div className="font-medium">{service.service_name}</div>,
      sortable: true
    },
    {
      id: "category",
      header: "Categoría",
      cell: (service: any) => {
        const categoryStyles = getCategoryStyles(service.category);
        return (
          <Badge className={categoryStyles.badgeColor}>
            {categoryStyles.name}
          </Badge>
        );
      },
      sortable: true
    },
    {
      id: "price",
      header: "Precio Base",
      cell: (service: any) => <div>{service.price.toLocaleString('es-ES')} €</div>,
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
      id: "subscription_date",
      header: "Fecha de suscripción",
      cell: (client: any) => formatDate(client.subscription_date),
      sortable: true
    }
  ];

  return (
    <Tabs defaultValue="info" className="w-full space-y-6">
      <TabsList>
        <TabsTrigger value="info">Información General</TabsTrigger>
        <TabsTrigger value="services">Servicios ({services.length})</TabsTrigger>
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
                <p className="text-lg font-medium">{pack.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descripción corta</p>
                <p className="text-base">{pack.short_description || "-"}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Precio</p>
                <p className="text-xl font-bold">{pack.price.toLocaleString('es-ES')} €</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <StatusBadge status={pack.is_active ? "active" : "inactive"} className="mt-1" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dirigido a</p>
                <p className="text-base">{pack.target || "-"}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Slug</p>
                <p className="text-base">{pack.slug}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de creación</p>
                <p className="text-base">{formatDate(pack.created_at)}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                  <Badge variant="outline" className="capitalize mt-1">
                    {pack.type || "basic"}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Posición</p>
                  <Badge variant="outline" className="mt-1">
                    {pack.position || "-"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Descripción completa</CardTitle>
            </CardHeader>
            <CardContent>
              {pack.description ? (
                <div className="prose max-w-none dark:prose-invert">
                  <p>{pack.description}</p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">No hay descripción disponible</p>
              )}
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Características incluidas</CardTitle>
            </CardHeader>
            <CardContent>
              {(pack.features && pack.features.length > 0) ? (
                <ul className="space-y-2 list-disc pl-5">
                  {pack.features.map((feature, index) => (
                    <li key={index} className="text-base">
                      {feature}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">No hay características definidas</p>
              )}
            </CardContent>
          </Card>

          {/* Add new component to manage services in pack */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Gestión de Servicios</CardTitle>
              <CardDescription>
                Añade o elimina servicios de este pack
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ManagePackServices 
                packId={pack.id} 
                packName={pack.name}
                onUpdate={loadServicesData}
              />
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="services">
        <Card>
          <CardHeader>
            <CardTitle>Servicios Incluidos</CardTitle>
            <CardDescription>
              Servicios que forman parte de este pack
            </CardDescription>
          </CardHeader>
          <CardContent>
            {services.length > 0 ? (
              <AdminTable
                columns={servicesColumns}
                data={services}
                isLoading={isLoadingServices}
                searchable={false}
                actions={(service) => (
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => {
                      navigate(`/auth-myweb/services/${service.service_id}`);
                    }}
                    title="Ver detalles del servicio"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              />
            ) : (
              !isLoadingServices && <EmptyServices />
            )}
          </CardContent>
        </Card>

        {/* Add management component also in this tab */}
        <div className="mt-6">
          <ManagePackServices 
            packId={pack.id} 
            packName={pack.name}
            onUpdate={loadServicesData}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="clients">
        <Card>
          <CardHeader>
            <CardTitle>Clientes suscritos</CardTitle>
            <CardDescription>
              Clientes que tienen contratado este pack
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
