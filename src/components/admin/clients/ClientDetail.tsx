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
  ClientProfile, 
  fetchClientPacks, 
  fetchClientServices
} from "@/services/adminClientService";
import { AdminTable } from "../shared/AdminTable";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ClientDetailProps {
  client: ClientProfile;
}

export function ClientDetail({ client }: ClientDetailProps) {
  const navigate = useNavigate();
  const [packs, setPacks] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoadingPacks, setIsLoadingPacks] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<any | null>(null);
  const [isLoadingQuestionnaire, setIsLoadingQuestionnaire] = useState(false);

  useEffect(() => {
    loadData();
  }, [client.user_id]);

  const loadData = async () => {
    await Promise.all([
      loadServicesData(),
      loadPacksData(),
      loadQuestionnaireData()
    ]);
  };

  const loadServicesData = async () => {
    setIsLoadingServices(true);
    try {
      const data = await fetchClientServices(client.user_id);
      setServices(data);
    } catch (error) {
      console.error("Error loading client services:", error);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const loadPacksData = async () => {
    setIsLoadingPacks(true);
    try {
      const data = await fetchClientPacks(client.user_id);
      setPacks(data);
    } catch (error) {
      console.error("Error loading client packs:", error);
    } finally {
      setIsLoadingPacks(false);
    }
  };

  const loadQuestionnaireData = async () => {
    if (!client.user_id) return;
    
    setIsLoadingQuestionnaire(true);
    try {
      const { data, error } = await supabase
        .from('project_preliminary_questionnaire')
        .select('*')
        .eq('user_id', client.user_id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error("Error loading questionnaire:", error);
      }
      
      setQuestionnaire(data);
    } catch (error) {
      console.error("Error loading questionnaire data:", error);
    } finally {
      setIsLoadingQuestionnaire(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  // Render questionnaire data with proper formatting
  const renderQuestionnaireData = () => {
    if (isLoadingQuestionnaire) {
      return <p className="text-muted-foreground">Cargando datos del cuestionario...</p>;
    }

    if (!questionnaire) {
      return <p className="text-muted-foreground">Este cliente no ha completado el cuestionario de proyecto.</p>;
    }

    // Helper function to format array data nicely
    const formatArrayData = (arr: string[] | null) => {
      if (!arr || !Array.isArray(arr) || arr.length === 0) return "No especificado";
      return arr.join(", ");
    };

    // Helper function to format object data
    const formatObjectData = (obj: any) => {
      if (!obj || typeof obj !== 'object') return "No especificado";
      if (obj.preferences && Array.isArray(obj.preferences)) {
        return obj.preferences.join(", ");
      }
      return JSON.stringify(obj, null, 2);
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-lg mb-3">Detalles del Proyecto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre del Proyecto</p>
              <p className="text-base">{questionnaire.project_name || "No especificado"}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Público Objetivo</p>
              <p className="text-base">{questionnaire.target_audience || "No especificado"}</p>
            </div>
            
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Descripción del Proyecto</p>
              <p className="text-base">{questionnaire.project_description || "No especificado"}</p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-lg mb-3">Preferencias y Características</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Preferencias de Diseño</p>
              <p className="text-base">{formatObjectData(questionnaire.design_preferences)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Características Requeridas</p>
              <p className="text-base">{formatArrayData(questionnaire.required_features)}</p>
            </div>
            
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Objetivos de Negocio</p>
              <p className="text-base">{questionnaire.business_goals || "No especificado"}</p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-lg mb-3">Planificación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plazo</p>
              <p className="text-base">{questionnaire.timeline || "No especificado"}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rango de Presupuesto</p>
              <p className="text-base">{questionnaire.budget_range || "No especificado"}</p>
            </div>
            
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">URLs de Inspiración</p>
              <p className="text-base">{formatArrayData(questionnaire.inspiration_urls)}</p>
            </div>
            
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Competidores</p>
              <p className="text-base">{formatArrayData(questionnaire.competitors)}</p>
            </div>
            
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Notas Adicionales</p>
              <p className="text-base">{questionnaire.notes || "No especificado"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
      header: "Precio",
      cell: (pack: any) => <div>{pack.price.toLocaleString('es-ES')} €</div>,
      sortable: true
    },
    {
      id: "created_at",
      header: "Fecha",
      cell: (pack: any) => formatDate(pack.created_at),
      sortable: true
    }
  ];

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
      cell: (service: any) => (
        <div className="capitalize">{service.category}</div>
      ),
      sortable: true
    },
    {
      id: "status",
      header: "Estado",
      cell: (service: any) => <StatusBadge status={service.status} />,
      sortable: true
    },
    {
      id: "created_at",
      header: "Fecha",
      cell: (service: any) => formatDate(service.created_at),
      sortable: true
    }
  ];

  // Timeline activities (mock data)
  const activities = [
    {
      id: 1,
      type: "login",
      description: "Inicio de sesión",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      type: "update",
      description: "Actualización de perfil",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      type: "purchase",
      description: "Compra de Pack Base",
      timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      type: "signup",
      description: "Registro en la plataforma",
      timestamp: client.created_at
    }
  ];

  return (
    <Tabs defaultValue="info" className="w-full space-y-6">
      <TabsList>
        <TabsTrigger value="info">Información General</TabsTrigger>
        <TabsTrigger value="packs">Packs ({packs.length})</TabsTrigger>
        <TabsTrigger value="services">Servicios ({services.length})</TabsTrigger>
        <TabsTrigger value="questionnaire">Cuestionario</TabsTrigger>
        <TabsTrigger value="activity">Actividad</TabsTrigger>
      </TabsList>
      
      <TabsContent value="info">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Información de Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-base">{client.business_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <StatusBadge status={client.status || "inactive"} className="mt-1" />
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sitio Web</p>
                <p className="text-base">
                  {client.website ? (
                    <a 
                      href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {client.website}
                    </a>
                  ) : (
                    "-"
                  )}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de Registro</p>
                <p className="text-base">{formatDate(client.created_at)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                <p className="text-base">
                  {client.first_name && client.last_name
                    ? `${client.first_name} ${client.last_name}`
                    : "-"}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base">
                  <a href={`mailto:${client.email}`} className="text-blue-500 hover:underline">
                    {client.email}
                  </a>
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                <p className="text-base">
                  {client.phone ? (
                    <a href={`tel:${client.phone}`} className="hover:underline">
                      {client.phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Dirección</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                <p className="text-base">{client.address || "-"}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ciudad</p>
                  <p className="text-base">{client.city || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Provincia</p>
                  <p className="text-base">{client.province || "-"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Código Postal</p>
                  <p className="text-base">{client.postal_code || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">País</p>
                  <p className="text-base">{client.country || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Suscripción</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <StatusBadge 
                  status={client.subscription_status || "inactive"} 
                  className="mt-1" 
                />
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                <p className="text-base">
                  {client.subscription_tier
                    ? client.subscription_tier.charAt(0).toUpperCase() + client.subscription_tier.slice(1)
                    : "-"}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Última Actividad</p>
                <p className="text-base">
                  {client.last_activity ? formatDateTime(client.last_activity) : "-"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="packs">
        <Card>
          <CardHeader>
            <CardTitle>Packs Contratados</CardTitle>
            <CardDescription>
              Packs de servicios contratados por el cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="services">
        <Card>
          <CardHeader>
            <CardTitle>Servicios Contratados</CardTitle>
            <CardDescription>
              Servicios individuales contratados por el cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="questionnaire">
        <Card>
          <CardHeader>
            <CardTitle>Cuestionario de Proyecto</CardTitle>
            <CardDescription>
              Información proporcionada por el cliente sobre sus necesidades y preferencias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderQuestionnaireData()}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="activity">
        <Card>
          <CardHeader>
            <CardTitle>Historial de Actividad</CardTitle>
            <CardDescription>
              Registro de actividad del cliente en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative ml-4 space-y-6">
              {/* Timeline Line */}
              <div className="absolute inset-y-0 left-0 w-px bg-border" />
              
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="relative pl-6"
                >
                  {/* Timeline Circle */}
                  <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border border-primary bg-background" />
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}