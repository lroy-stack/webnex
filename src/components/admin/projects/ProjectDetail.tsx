import React, { useState, useCallback, useEffect } from "react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, MessageSquare } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  AdminProjectWithClient, 
  ProjectMilestone, 
  createOrUpdateMilestone, 
  deleteMilestone, 
  createProjectUpdate, 
  getProjectUpdates,
  ProjectUpdate
} from "@/services/adminProjectService";
import { CreateUpdateDialog } from "./CreateUpdateDialog";
import { AdminProjectQuestionnaire } from "./AdminProjectQuestionnaire";
import { supabase } from "@/integrations/supabase/client";

interface ProjectDetailProps {
  project: AdminProjectWithClient;
  onRefresh: () => void;
  onUpdateDates?: (startDate: string | null, endDate: string | null) => Promise<boolean>;
  isUpdatingDates?: boolean;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  onRefresh,
  onUpdateDates,
  isUpdatingDates = false
}) => {
  const { user } = useAuth();
  const [isEditingMilestone, setIsEditingMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState<Partial<ProjectMilestone>>({
    title: '',
    description: null,
    due_date: null,
    is_completed: false,
    position: (project.milestones?.length || 0) + 1
  });
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);
  const [isDeletingMilestone, setIsDeletingMilestone] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<string | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ title: '', content: '' });
  const [isCreatingUpdate, setIsCreatingUpdate] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: project.start_date ? new Date(project.start_date) : undefined,
    to: project.expected_end_date ? new Date(project.expected_end_date) : undefined,
  });
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);

  // Load existing project updates when component mounts
  useEffect(() => {
    const loadProjectUpdates = async () => {
      setIsLoadingUpdates(true);
      try {
        const updates = await getProjectUpdates(project.id);
        console.log(`Loaded ${updates.length} project updates for admin view`);
        setProjectUpdates(updates);
      } catch (error) {
        console.error("Error loading project updates:", error);
      } finally {
        setIsLoadingUpdates(false);
      }
    };
    
    loadProjectUpdates();
    
    // Subscribe to real-time updates for this project
    const updatesChannel = supabase
      .channel('admin_project_updates_' + project.id)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'project_updates',
          filter: `project_id=eq.${project.id}`
        },
        (payload) => {
          console.log('Admin received real-time project update:', payload);
          loadProjectUpdates(); // Reload updates when changes occur
        }
      )
      .subscribe();

    // Subscribe to milestone updates
    const milestonesChannel = supabase
      .channel('admin_project_milestones_' + project.id)
      .on(
        'postgres_changes',
        {
          event: '*', // All changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'project_milestones',
          filter: `project_id=eq.${project.id}`
        },
        () => {
          console.log("Admin view: Project milestone changes detected");
          onRefresh(); // Refresh project data including milestones
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(updatesChannel);
      supabase.removeChannel(milestonesChannel);
    };
  }, [project.id]);

  const renderFormDataItem = (key: string, value: any) => {
    // ... keep existing code for renderFormDataItem
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  const formatDateString = (date: Date | undefined) => {
    if (!date) return '';
    // Format to YYYY-MM-DD to ensure proper date format for Supabase
    return format(date, 'yyyy-MM-dd');
  };

  const formatUpdateDate = (dateStr: string | null) => {
    if (!dateStr) return "Fecha desconocida";
    try {
      return format(new Date(dateStr), "d 'de' MMMM, yyyy", { locale: es });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  const handleMilestoneSave = async (milestone: Partial<ProjectMilestone>) => {
    setIsSavingMilestone(true);
    try {
      console.log("Saving milestone:", milestone);
      
      // Ensure the milestone has a project_id
      const milestoneWithProject: Partial<ProjectMilestone> & { project_id: string } = {
        ...milestone,
        project_id: project.id
      };

      // Use the enhanced createOrUpdateMilestone function
      const { success, error } = await createOrUpdateMilestone(milestoneWithProject);
      
      if (success) {
        setIsEditingMilestone(false);
        setNewMilestone({
          title: '',
          description: null,
          due_date: null,
          is_completed: false,
          position: (project.milestones?.length || 0) + 1
        });
        onRefresh(); // Refresh project data
        toast.success("Hito guardado correctamente");
      } else {
        toast.error(`Error al guardar el hito: ${error}`);
        console.error("Error saving milestone:", error);
      }
    } catch (error) {
      console.error("Error in handleMilestoneSave:", error);
      toast.error("Error al guardar el hito");
    } finally {
      setIsSavingMilestone(false);
    }
  };

  const handleMilestoneDelete = async () => {
    if (!milestoneToDelete) return;

    setIsDeletingMilestone(true);
    try {
      const success = await deleteMilestone(milestoneToDelete);
      if (success) {
        setMilestoneToDelete(null);
        toast.success("Hito eliminado correctamente");
        onRefresh(); // Refresh project data
      } else {
        toast.error("Error al eliminar el hito");
      }
    } catch (error) {
      console.error("Error in handleMilestoneDelete:", error);
      toast.error("Error al eliminar el hito");
    } finally {
      setIsDeletingMilestone(false);
    }
  };

  const handleUpdateCreate = async () => {
    if (!newUpdate.title || !newUpdate.content) {
      toast.error("Por favor complete el título y el contenido de la actualización");
      return;
    }

    setIsCreatingUpdate(true);
    try {
      if (!user?.id) {
        toast.error("No se pudo identificar el administrador");
        return;
      }

      const success = await createProjectUpdate(
        project.id,
        user.id,
        newUpdate.title,
        newUpdate.content
      );

      if (success) {
        setNewUpdate({ title: '', content: '' });
        setIsUpdateDialogOpen(false);
        // Actualizaciones se cargarán automáticamente por la suscripción en tiempo real
        toast.success("Actualización creada exitosamente");
      }
    } catch (error) {
      console.error("Error creating update:", error);
      toast.error("Error al crear la actualización");
    } finally {
      setIsCreatingUpdate(false);
    }
  };

  // Function to update project dates - renamed to avoid conflict with imported function
  const handleDateUpdate = async () => {
    if (!onUpdateDates) return false;
    
    const startDate = dateRange.from ? formatDateString(dateRange.from) : null;
    const endDate = dateRange.to ? formatDateString(dateRange.to) : null;
    
    console.log(`Updating project dates: start=${startDate}, end=${endDate}`);
    
    // Basic validation
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Ensure end date is after start date
      if (start >= end) {
        toast.error("La fecha de finalización debe ser posterior a la fecha de inicio");
        return false;
      }
    }
    
    const success = await onUpdateDates(startDate, endDate);
    if (success) {
      toast.success("Fechas del proyecto actualizadas correctamente");
      return true;
    } else {
      toast.error("Error al actualizar las fechas del proyecto");
      return false;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Column - Project Details */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
            <CardDescription>Detalles del cliente asociado al proyecto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={`https://avatar.vercel.sh/${project.email}.png`} />
                <AvatarFallback>{project.first_name?.charAt(0)}{project.last_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">{project.first_name} {project.last_name}</p>
                <p className="text-sm text-muted-foreground">{project.email}</p>
                {project.business_name && (
                  <p className="text-sm text-muted-foreground">{project.business_name}</p>
                )}
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-sm font-medium">ID del Proyecto</p>
                <p className="text-sm text-muted-foreground">{project.id}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm font-medium">Total del Pedido</p>
                <p className="text-sm text-muted-foreground">{project.order_total}€</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actualizar Fechas del Proyecto</CardTitle>
            <CardDescription>Modificar las fechas de inicio y fin del proyecto</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <Label htmlFor="startDate">Fecha de Inicio</Label>
              <DatePicker
                id="startDate"
                mode="single"
                value={dateRange.from}
                onSelect={(date) => setDateRange({ ...dateRange, from: date })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <Label htmlFor="endDate">Fecha de Finalización</Label>
              <DatePicker
                id="endDate"
                mode="single"
                value={dateRange.to}
                onSelect={(date) => setDateRange({ ...dateRange, to: date })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleDateUpdate}
              disabled={isUpdatingDates}
            >
              {isUpdatingDates ? 'Actualizando...' : 'Actualizar Fechas'}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Nueva sección para ver las actualizaciones existentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Actualizaciones enviadas</CardTitle>
              <CardDescription>Historial de actualizaciones del proyecto</CardDescription>
            </div>
            <Badge variant="outline">{projectUpdates.length}</Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full rounded-md border p-2">
              {isLoadingUpdates ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-sm text-muted-foreground">Cargando actualizaciones...</p>
                </div>
              ) : projectUpdates.length > 0 ? (
                <div className="space-y-3">
                  {projectUpdates.map((update) => (
                    <div 
                      key={update.id} 
                      className="p-3 border rounded-lg"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium">{update.title}</h4>
                          <Badge variant={update.is_read ? "outline" : "secondary"} className="text-xs">
                            {update.is_read ? "Leída" : "No leída"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{update.content}</p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatUpdateDate(update.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground opacity-40 mb-2" />
                  <p className="text-sm text-muted-foreground">No hay actualizaciones enviadas</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Milestones and Updates */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hitos del Proyecto</CardTitle>
            <CardDescription>Gestionar los hitos del proyecto</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <div className="p-4 space-y-4">
                {project.milestones && project.milestones.length > 0 ? (
                  project.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium leading-none">{milestone.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {milestone.due_date ? format(new Date(milestone.due_date), "PPP", { locale: es }) : 'Sin fecha definida'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={milestone.is_completed ? "secondary" : "outline"}>
                          {milestone.is_completed ? "Completado" : "Pendiente"}
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => setMilestoneToDelete(milestone.id)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6"/><path d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará el hito permanentemente. ¿Estás seguro de que deseas continuar?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction disabled={isDeletingMilestone} onClick={handleMilestoneDelete}>
                                {isDeletingMilestone ? 'Eliminando...' : 'Eliminar'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No hay hitos definidos para este proyecto.</p>
                )}
              </div>
            </ScrollArea>
            {isEditingMilestone ? (
              <div className="mt-4">
                <Label htmlFor="milestoneTitle">Título del Hito</Label>
                <Input
                  id="milestoneTitle"
                  value={newMilestone.title || ''}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                />
                <Label htmlFor="milestoneDescription" className="mt-2">Descripción del Hito</Label>
                <Textarea
                  id="milestoneDescription"
                  value={newMilestone.description || ''}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                />
                <Label htmlFor="milestoneDueDate" className="mt-2">Fecha de Vencimiento</Label>
                <Input
                  type="date"
                  id="milestoneDueDate"
                  value={newMilestone.due_date || ''}
                  onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Label htmlFor="milestoneCompleted">Completado</Label>
                  <Switch
                    id="milestoneCompleted"
                    checked={newMilestone.is_completed || false}
                    onCheckedChange={(checked) => setNewMilestone({ ...newMilestone, is_completed: checked })}
                  />
                </div>
                <Button onClick={() => handleMilestoneSave(newMilestone)} disabled={isSavingMilestone} className="mt-3">
                  {isSavingMilestone ? 'Guardando...' : 'Guardar Hito'}
                </Button>
                <Button variant="ghost" onClick={() => setIsEditingMilestone(false)} className="mt-3 ml-2">
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditingMilestone(true)} className="mt-4">Agregar Nuevo Hito</Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crear Actualización</CardTitle>
            <CardDescription>Añadir una nueva actualización al proyecto</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateUpdateDialog
              open={isUpdateDialogOpen}
              setOpen={setIsUpdateDialogOpen}
              newUpdate={newUpdate}
              setNewUpdate={setNewUpdate}
              onCreate={handleUpdateCreate}
              isCreating={isCreatingUpdate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuestionario del Proyecto</CardTitle>
            <CardDescription>Ver las respuestas del cliente al cuestionario</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminProjectQuestionnaire projectId={project.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
