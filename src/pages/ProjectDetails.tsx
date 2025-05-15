
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  Loader2,
  FileClock,
} from "lucide-react";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { getProjectWithDetails } from "@/services/projectService";
import { getOrderWithItems } from "@/services/orderService";
import { useAuth } from "@/contexts/AuthContext";
import ProjectQuestionnaire from "@/components/project/ProjectQuestionnaire";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<any | null>(null);
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user) {
      toast.error("Debes iniciar sesión para ver este contenido");
      navigate("/");
      return;
    }
    
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId, user]);

  const loadProject = async (id: string) => {
    setLoading(true);
    try {
      const projectData = await getProjectWithDetails(id);
      setProject(projectData);
      
      if (projectData?.order_id) {
        const orderData = await getOrderWithItems(projectData.order_id);
        setOrder(orderData);
      }
    } catch (error) {
      console.error("Error loading project:", error);
      toast.error("Error al cargar la información del proyecto");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Por determinar";
    return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: es });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-sm">
            <Clock className="h-3.5 w-3.5" />
            Pendiente
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm">
            <FileClock className="h-3.5 w-3.5" />
            En progreso
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-sm">
            <CheckCircle className="h-3.5 w-3.5" />
            Completado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 text-sm">
            {status}
          </span>
        );
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 md:py-8 px-4 max-w-5xl">
        <BreadcrumbNav />
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : project ? (
          <>
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(project.status)}
                  <span className="text-muted-foreground">
                    Creado el {formatDate(project.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-3 md:w-[400px]">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="timeline">Cronograma</TabsTrigger>
                <TabsTrigger value="questionnaire">Cuestionario</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Progreso del proyecto</CardTitle>
                    <CardDescription>
                      {project.progress_percentage === 100 ? (
                        "¡Tu proyecto está completado!"
                      ) : (
                        `${project.progress_percentage}% completado`
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={project.progress_percentage} className="h-2" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <h3 className="font-medium text-lg mb-2">Fechas clave</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Inicio del proyecto</span>
                            </div>
                            <span>{formatDate(project.start_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Fecha estimada de entrega</span>
                            </div>
                            <span>{formatDate(project.expected_end_date)}</span>
                          </div>
                          {project.actual_end_date && (
                            <div className="flex justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Fecha de entrega real</span>
                              </div>
                              <span>{formatDate(project.actual_end_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {order && (
                        <div>
                          <h3 className="font-medium text-lg mb-2">Detalles del pedido</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span>Número de pedido</span>
                              <span>#{order.id.substring(0, 8)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Monto total</span>
                              <span>{order.total_amount}€</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Estado</span>
                              {getStatusBadge(order.status)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {order && order.items && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Pack y servicios incluidos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {order.items
                        .filter((item: any) => item.item_type === 'pack')
                        .map((packItem: any) => (
                          <div key={packItem.id} className="mb-4">
                            <h3 className="font-medium text-lg">{packItem.item_details?.name || "Pack"}</h3>
                            <p className="text-muted-foreground">{packItem.item_details?.description || ""}</p>
                            {packItem.item_details?.features && (
                              <ul className="mt-2 space-y-1">
                                {packItem.item_details.features.map((feature: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      
                      {order.items.some((item: any) => item.item_type === 'service') && (
                        <div>
                          <h3 className="font-medium text-lg mb-2">Servicios adicionales</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {order.items
                              .filter((item: any) => item.item_type === 'service')
                              .map((serviceItem: any) => (
                                <div 
                                  key={serviceItem.id}
                                  className="border border-border rounded-lg p-3"
                                >
                                  <h4 className="font-medium">{serviceItem.item_details?.name || "Servicio"}</h4>
                                  <p className="text-sm text-muted-foreground">{serviceItem.item_details?.description || ""}</p>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="timeline" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Cronograma del proyecto</CardTitle>
                    <CardDescription>
                      Seguimiento de las etapas de tu proyecto
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {project.milestones && project.milestones.length > 0 ? (
                      <div className="space-y-6">
                        {project.milestones.map((milestone: any) => (
                          <div 
                            key={milestone.id}
                            className="flex gap-4"
                          >
                            <div className="mt-1">
                              {milestone.is_completed ? (
                                <CheckCircle className="h-6 w-6 text-green-500" />
                              ) : (
                                <Circle className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-lg">{milestone.title}</h3>
                              {milestone.description && (
                                <p className="text-muted-foreground">{milestone.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {milestone.due_date ? formatDate(milestone.due_date) : "Sin fecha definida"}
                                </span>
                              </div>
                            </div>
                            <div>
                              {milestone.is_completed ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-sm">
                                  Completado
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-sm">
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No hay hitos definidos para este proyecto todavía.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="questionnaire">
                <ProjectQuestionnaire projectId={projectId || ""} />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontró información del proyecto</p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Volver al inicio
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProjectDetails;
