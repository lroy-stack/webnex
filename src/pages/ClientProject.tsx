import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { getProjectDetails, ClientProject, getUnreadUpdatesCount, markProjectUpdateAsRead } from "@/services/projectService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ProjectUpdatesCard } from "@/components/client/ProjectUpdates";
import { ProjectProgressBar } from "@/components/client/ProjectProgressBar";
import { CheckCircle2, Circle, Calendar, MessageSquare, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { UpdateNotificationsModal } from "@/components/client/UpdateNotificationsModal";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBadge } from "@/components/client/notifications/NotificationBadge";

const ClientProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ClientProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("progress");
  
  useEffect(() => {
    loadProject();
    
    if (id) {
      // Subscribe to realtime updates for this project's updates
      const updatesChannel = supabase
        .channel('client_project_updates_' + id)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'project_updates',
            filter: `project_id=eq.${id}`
          },
          (payload) => {
            console.log("New project update detected:", payload);
            checkUnreadUpdates(id);
            toast.info("Se ha publicado una nueva actualización del proyecto");
            refreshData();
          }
        )
        .subscribe();
      
      // Subscribe to milestone updates as well
      const milestonesChannel = supabase
        .channel('client_project_milestones_' + id)
        .on(
          'postgres_changes',
          {
            event: '*', // All changes (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'project_milestones',
            filter: `project_id=eq.${id}`
          },
          () => {
            console.log("Project milestones updated");
            refreshData();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(updatesChannel);
        supabase.removeChannel(milestonesChannel);
      };
    }
  }, [id]);
  
  const loadProject = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      console.log("Loading project details for ID:", id);
      const projectData = await getProjectDetails(id);
      
      if (projectData) {
        console.log("Project loaded successfully:", projectData);
        console.log("Project updates:", projectData.updates);
        setProject(projectData);
        checkUnreadUpdates(id);
      } else {
        console.error("Failed to load project, received null");
        toast.error("No se pudo cargar el proyecto");
      }
    } catch (error) {
      console.error("Error loading project:", error);
      toast.error("Error al cargar el proyecto");
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkUnreadUpdates = async (projectId: string) => {
    try {
      const count = await getUnreadUpdatesCount(projectId);
      console.log(`Unread updates count: ${count}`);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error checking unread updates:", error);
    }
  };
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Por determinar";
    try {
      return format(new Date(dateStr), "d 'de' MMMM, yyyy", { locale: es });
    } catch (e) {
      console.error("Error formatting date:", e, dateStr);
      return "Fecha inválida";
    }
  };
  
  const refreshData = async () => {
    if (id) {
      console.log("Refreshing project data");
      await loadProject();
    }
  };

  const handleOpenNotificationsModal = () => {
    setIsNotificationsModalOpen(true);
  };

  // This handler doesn't take parameters - used for the modal
  const handleUpdateRead = () => {
    if (!id) return;
    try {
      checkUnreadUpdates(id);
      refreshData(); // Also refresh all data to show updates as read
    } catch (error) {
      console.error("Error refreshing unread count:", error);
    }
  };

  // This handler takes an updateId parameter - used for individual updates
  const handleUpdateReadWithId = async (updateId: string) => {
    try {
      console.log(`Marking update ${updateId} as read...`);
      const success = await markProjectUpdateAsRead(updateId);
      if (success) {
        console.log(`Update ${updateId} marked as read successfully`);
        if (id) {
          checkUnreadUpdates(id);
          refreshData(); // Refresh all data after marking as read
        }
      }
    } catch (error) {
      console.error("Error marking update as read:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100/50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">Pendiente</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-100/50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">En progreso</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100/50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Completado</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100/50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["client", "admin"]}>
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <BreadcrumbNav />
          
          {isLoading ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-40 mt-2" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Skeleton className="h-64 w-full" />
                </div>
                <div>
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            </div>
          ) : project ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>Creado: {formatDate(project.created_at)}</span>
                    {getStatusBadge(project.status)}
                  </div>
                </div>
                
                {/* Use our new NotificationBadge component */}
                <NotificationBadge
                  projectId={project.id}
                  onClick={handleOpenNotificationsModal}
                />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="progress">Progreso</TabsTrigger>
                  <TabsTrigger value="timeline">
                    <div className="flex items-center gap-1">
                      Cronograma
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="progress" className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      {/* Use our ProjectProgressBar component */}
                      <ProjectProgressBar 
                        projectName={project.name}
                        startDate={project.start_date}
                        endDate={project.expected_end_date}
                        progress={project.progress_percentage}
                        status={project.status}
                      />
                    </div>
                    
                    <div>
                      <ProjectUpdatesCard 
                        projectId={project.id} 
                        onUpdateRead={handleUpdateRead} 
                        unreadCount={unreadCount} 
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="timeline" className="pt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Cronograma del Proyecto</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Sección de hitos del proyecto */}
                        {project.milestones && project.milestones.length > 0 ? (
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Hitos del proyecto</h3>
                            {project.milestones.map((milestone) => (
                              <div 
                                key={milestone.id} 
                                className="flex items-start gap-3 p-4 border rounded-lg"
                              >
                                <div className="mt-1">
                                  {milestone.is_completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className={`text-md font-medium ${milestone.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {milestone.title}
                                  </p>
                                  {milestone.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {milestone.description}
                                    </p>
                                  )}
                                  {milestone.due_date && (
                                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      <span>Fecha objetivo: {formatDate(milestone.due_date)}</span>
                                    </div>
                                  )}
                                </div>
                                {milestone.is_completed && (
                                  <Badge variant="outline" className="bg-green-100/50 text-green-800 border-green-200">
                                    Completado
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                            <p>No hay hitos definidos para este proyecto</p>
                          </div>
                        )}
                        
                        {/* Sección de actualizaciones del proyecto */}
                        {project.updates && project.updates.length > 0 ? (
                          <div className="space-y-4 mt-8">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                              <MessageSquare className="h-5 w-5" />
                              Actualizaciones del proyecto
                            </h3>
                            {project.updates.map((update) => (
                              <div 
                                key={update.id} 
                                className={`p-4 border rounded-lg ${!update.is_read ? 'bg-primary/5 border-primary/20 dark:bg-primary/10' : ''}`}
                              >
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-medium">
                                      {update.title}
                                      {!update.is_read && (
                                        <Badge variant="secondary" className="ml-2 text-xs">
                                          Nueva
                                        </Badge>
                                      )}
                                    </h4>
                                  </div>
                                  <p className="text-sm">{update.content}</p>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>{formatDate(update.created_at)}</span>
                                    </div>
                                    {!update.is_read && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleUpdateReadWithId(update.id)}
                                      >
                                        Marcar como leída
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground mt-8">
                            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p>No hay actualizaciones para este proyecto</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              {/* Use our enhanced notification center */}
              {project.updates && (
                <UpdateNotificationsModal
                  isOpen={isNotificationsModalOpen}
                  onClose={() => setIsNotificationsModalOpen(false)}
                  projectId={project.id}
                  updates={project.updates}
                  milestones={project.milestones}
                  onUpdateRead={handleUpdateRead}
                />
              )}
            </div>
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
    </ProtectedRoute>
  );
};

export default ClientProjectPage;
