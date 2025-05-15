import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { UserStatsCards } from "@/components/client/UserStatsCards";
import { UserModules } from "@/components/client/UserModules";
import { UserProjects } from "@/components/client/UserProjects";
import { ProjectProgressCard } from "@/components/client/ProjectProgress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ExternalLink, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { ClientChatNotificationBadge } from "@/components/client/chat/ClientChatNotificationBadge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchUserStats, fetchUserModules, fetchProjectProgress, fetchAvailableServices, fetchClientProfile, UserStats, UserModule, ProjectProgress, AvailableService } from "@/services/clientDashboardService";
import { NotificationBadge } from "@/components/client/notifications/NotificationBadge";
import { UpdateNotificationsModal } from "@/components/client/UpdateNotificationsModal";
import { ProjectUpdate, ProjectMilestone, getProjectDetails, getUserProjects } from "@/services/projectService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ClientDashboard = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    theme
  } = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [modules, setModules] = useState<UserModule[]>([]);
  const [projectProgress, setProjectProgress] = useState<ProjectProgress | null>(null);
  const [availableServices, setAvailableServices] = useState<AvailableService[]>([]);
  const [clientProfile, setClientProfile] = useState<{
    business_name: string;
    first_name: string | null;
    last_name: string | null;
  } | null>(null);
  const [loading, setLoading] = useState({
    stats: true,
    modules: true,
    projectProgress: true,
    availableServices: true,
    clientProfile: true
  });
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);
  const [projectMilestones, setProjectMilestones] = useState<ProjectMilestone[]>([]);
  const [hasUnreadUpdates, setHasUnreadUpdates] = useState(false);
  
  const loadData = async () => {
    // Cargar perfil del cliente
    const profileData = await fetchClientProfile();
    setClientProfile(profileData);
    setLoading(prev => ({
      ...prev,
      clientProfile: false
    }));

    // Cargar estadísticas
    const statsData = await fetchUserStats();
    setStats(statsData);
    setLoading(prev => ({
      ...prev,
      stats: false
    }));

    // Cargar módulos
    const modulesData = await fetchUserModules();
    setModules(modulesData);
    setLoading(prev => ({
      ...prev,
      modules: false
    }));

    // Cargar progreso del proyecto
    const progressData = await fetchProjectProgress();
    setProjectProgress(progressData);
    setLoading(prev => ({
      ...prev,
      projectProgress: false
    }));

    // Cargar servicios disponibles
    const servicesData = await fetchAvailableServices();
    setAvailableServices(servicesData);
    setLoading(prev => ({
      ...prev,
      availableServices: false
    }));
    
    // Cargar proyecto activo y sus actualizaciones
    if (progressData && progressData.project_id) {
      await loadProjectDetailsForNotifications(progressData.project_id);
    } else {
      // Si no hay un proyecto en progreso, buscar cualquier proyecto del usuario
      const userProjects = await getUserProjects();
      if (userProjects.length > 0) {
        await loadProjectDetailsForNotifications(userProjects[0].id);
      }
    }
  };
  
  const loadProjectDetailsForNotifications = async (projectId: string) => {
    try {
      setActiveProject(projectId);
      
      // Fetch project details with updates and milestones
      const projectDetails = await getProjectDetails(projectId);
      if (projectDetails) {
        const updates = projectDetails.updates || [];
        setProjectUpdates(updates);
        setProjectMilestones(projectDetails.milestones || []);
        
        // Verificar si hay actualizaciones sin leer para mostrar el modal automáticamente
        const unreadUpdates = updates.filter(update => !update.is_read);
        setHasUnreadUpdates(unreadUpdates.length > 0);
        
        // Mostrar el modal de notificaciones automáticamente al cargar la página si hay notificaciones sin leer
        if (unreadUpdates.length > 0) {
          setIsNotificationsModalOpen(true);
        }
      }
    } catch (error) {
      console.error("Error loading project details for notifications:", error);
    }
  };
  
  const handleOpenNotifications = () => {
    if (activeProject) {
      setIsNotificationsModalOpen(true);
    } else {
      // If we don't have an active project yet, try to load it
      if (projectProgress && projectProgress.project_id) {
        loadProjectDetailsForNotifications(projectProgress.project_id);
        setIsNotificationsModalOpen(true);
      } else {
        toast.info("No hay proyecto activo para mostrar notificaciones");
      }
    }
  };
  
  const handleNotificationUpdate = async () => {
    if (activeProject) {
      // Refresh project details to get updated notification status
      const projectDetails = await getProjectDetails(activeProject);
      if (projectDetails) {
        setProjectUpdates(projectDetails.updates || []);
        const unreadUpdates = projectDetails.updates?.filter(update => !update.is_read) || [];
        setHasUnreadUpdates(unreadUpdates.length > 0);
      }
    }
  };
  
  // Function to handle clicking the "Ir al Chat" button
  const handleChatButtonClick = async () => {
    try {
      // Mark all messages as read in all conversations
      const { data: conversations } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('client_id', user?.id)
        .is('client_deleted_at', null);
      
      if (conversations && conversations.length > 0) {
        // Mark all unread admin messages as read
        for (const conversation of conversations) {
          await supabase
            .from('chat_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('conversation_id', conversation.id)
            .eq('is_admin', true)
            .is('read_at', null);
        }
        
        // Update badge counts in real-time by triggering a specific event
        const channel = supabase.channel('chat-update');
        await channel.subscribe();
        
        // Short delay to ensure the subscription is established
        setTimeout(() => {
          // Navigate to chat page
          navigate("/app/chat");
        }, 100);
      } else {
        navigate("/app/chat");
      }
    } catch (error) {
      console.error("Error clearing chat notifications:", error);
      // Still navigate even if there's an error
      navigate("/app/chat");
    }
  };
  
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);
  
  // Helper function to get client name with first_name and last_name as priority
  const getClientName = () => {
    if (!clientProfile) return '';
    
    // Prioritize first_name and last_name if available
    if (clientProfile.first_name || clientProfile.last_name) {
      const firstName = clientProfile.first_name || '';
      const lastName = clientProfile.last_name || '';
      return `${firstName} ${lastName}`.trim();
    }
    
    // Fall back to business_name if no personal name is available
    return clientProfile.business_name || '';
  };
  
  const resources = [{
    name: "Documentación",
    description: "Guías y documentos de tu proyecto"
  }, {
    name: "Diseños",
    description: "Mockups y diseños aprobados"
  }, {
    name: "APIs",
    description: "Documentación de endpoints disponibles"
  }, {
    name: "Demo",
    description: "Demo interactiva de tu aplicación"
  }];
  
  const legalDocuments = [
    {
      name: "Política de Privacidad",
      path: "/privacy-policy",
      description: "Información sobre cómo recopilamos, usamos y protegemos tus datos"
    },
    {
      name: "Términos de Servicio",
      path: "/terms-of-service",
      description: "Condiciones de uso de nuestra plataforma y servicios"
    }
  ];

  return <ProtectedRoute allowedRoles={["client", "admin", "staff"]}>
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <BreadcrumbNav />
          
          <div className="relative">
            <div className={`absolute top-0 left-0 w-1/2 h-64 bg-primary/5 rounded-full filter blur-3xl -z-10 ${theme === 'dark' ? 'opacity-20' : 'opacity-70'}`}></div>
            <div className={`absolute bottom-0 right-0 w-1/3 h-96 bg-secondary/5 rounded-full filter blur-3xl -z-10 ${theme === 'dark' ? 'opacity-20' : 'opacity-70'}`}></div>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Panel de Cliente</h1>
              <div className="flex items-center space-x-2">
                {activeProject && (
                  <div className="relative">
                    <NotificationBadge
                      projectId={activeProject}
                      onClick={handleOpenNotifications}
                      className={hasUnreadUpdates ? "scale-110" : ""}
                    />
                    {hasUnreadUpdates && (
                      <span className="animate-bounce absolute -top-6 -right-4 text-xs font-medium text-primary">
                        ¡Nuevas actualizaciones!
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-muted-foreground">
                Bienvenido{getClientName() ? `, ${getClientName()}` : ''} a tu panel de control
              </p>
            </div>
          </div>
          
          {/* Botón flotante de notificaciones para dispositivos móviles */}
          {activeProject && hasUnreadUpdates && (
            <div className="fixed bottom-6 right-6 z-50 md:hidden">
              <Button 
                onClick={handleOpenNotifications}
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center bg-primary hover:bg-primary/90 animate-pulse"
              >
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  !
                </span>
              </Button>
            </div>
          )}
          
          {/* Modal de notificaciones */}
          {activeProject && (
            <UpdateNotificationsModal
              isOpen={isNotificationsModalOpen}
              onClose={() => setIsNotificationsModalOpen(false)}
              projectId={activeProject}
              updates={projectUpdates}
              milestones={projectMilestones}
              onUpdateRead={handleNotificationUpdate}
            />
          )}
          
          <div className="space-y-8">
            <UserStatsCards stats={stats} isLoading={loading.stats} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Tabs defaultValue="modules" className="w-full">
                <TabsList className="grid grid-cols-3 w-full mb-2">
                  <TabsTrigger value="modules">Mis Módulos</TabsTrigger>
                  <TabsTrigger value="project">Progreso</TabsTrigger>
                  <TabsTrigger value="projects">Mis Proyectos</TabsTrigger>
                </TabsList>
                <TabsContent value="modules">
                  <UserModules modules={modules} availableServices={availableServices} isLoading={loading.modules || loading.availableServices} onModuleAdded={loadData} />
                </TabsContent>
                <TabsContent value="project">
                  <ProjectProgressCard projectProgress={projectProgress} isLoading={loading.projectProgress} />
                </TabsContent>
                <TabsContent value="projects">
                  <UserProjects isLoading={loading.projectProgress} />
                </TabsContent>
              </Tabs>
              
              <Card className="overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="absolute inset-x-0 h-1 top-0 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                <CardHeader>
                  <CardTitle>Mi Proyecto</CardTitle>
                  <CardDescription>
                    Información y recursos de tu proyecto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Notificaciones destacadas - Solo se muestra si hay notificaciones sin leer */}
                  {hasUnreadUpdates && (
                    <div className="rounded-lg overflow-hidden border border-primary bg-primary/5 shadow-sm hover:shadow-md transition-all duration-300 animate-pulse">
                      <div className="p-4 border-b border-primary/20 bg-primary/10">
                        <h4 className="font-medium flex items-center gap-2">
                          <Bell className="h-4 w-4 text-primary" />
                          Actualizaciones importantes
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Tienes notificaciones sin leer sobre tu proyecto
                        </p>
                      </div>
                      <div className="p-4">
                        <Button onClick={handleOpenNotifications} className="w-full" variant="outline">
                          Ver actualizaciones
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg overflow-hidden border bg-card shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="p-4 border-b bg-muted/30">
                      <h4 className="font-medium">Chat de Soporte</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Comunícate directamente con nuestro equipo para resolver tus dudas
                      </p>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Tiempo de respuesta: <span className="text-green-600 dark:text-green-400 font-medium">~30 min</span>
                      </div>
                      <Button onClick={handleChatButtonClick} className="gap-2" variant="default" size="sm">
                        <MessageSquare className="h-4 w-4" />
                        Ir al Chat
                        <ClientChatNotificationBadge />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-lg overflow-hidden border bg-card shadow-sm">
                    <div className="p-4 border-b bg-muted/30">
                      <h4 className="font-medium">Recursos del proyecto</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Accede a todos los recursos de tu proyecto web modular
                      </p>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3">
                        {resources.map(resource => <HoverCard key={resource.name}>
                            <HoverCardTrigger asChild>
                              <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors text-sm">
                                {resource.name}
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent side="top" className="w-60 p-3">
                              <div className="space-y-2">
                                <h5 className="font-medium text-sm">{resource.name}</h5>
                                <p className="text-xs text-muted-foreground">{resource.description}</p>
                              </div>
                            </HoverCardContent>
                          </HoverCard>)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Sección de documentos legales */}
                  <div className="rounded-lg overflow-hidden border bg-card shadow-sm">
                    <div className="p-4 border-b bg-muted/30">
                      <h4 className="font-medium">Información Legal</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Documentos legales y políticas de nuestra plataforma
                      </p>
                    </div>
                    <div className="p-4">
                      <div className="space-y-3">
                        {legalDocuments.map(doc => (
                          <Link 
                            key={doc.name}
                            to={doc.path}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors text-sm"
                          >
                            <span className="font-medium">{doc.name}</span>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>;
};

export default ClientDashboard;