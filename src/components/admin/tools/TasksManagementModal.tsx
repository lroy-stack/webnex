import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  Clock, 
  Calendar, 
  Play, 
  Trash, 
  PlusCircle, 
  Save, 
  X,
  Check,
  AlertTriangle,
  Info
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchScheduledTasks, 
  fetchTaskExecutionHistory,
  updateScheduledTask,
  deleteScheduledTask,
  createScheduledTask,
  type ScheduledTask,
  type TaskExecution
} from "@/services/adminToolsService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface TasksManagementModalProps {
  open: boolean;
  onClose: () => void;
}

export const TasksManagementModal: React.FC<TasksManagementModalProps> = ({
  open,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<string>("tasks");
  const [editingTask, setEditingTask] = useState<Partial<ScheduledTask> | null>(null);
  const [newTask, setNewTask] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Obtener tareas programadas
  const { 
    data: tasks,
    isLoading: tasksLoading,
  } = useQuery({
    queryKey: ['scheduled-tasks'],
    queryFn: fetchScheduledTasks
  });

  // Obtener historial de ejecución
  const {
    data: executionHistory,
    isLoading: historyLoading,
  } = useQuery({
    queryKey: ['task-execution-history', selectedTaskId],
    queryFn: () => fetchTaskExecutionHistory(selectedTaskId || undefined),
    enabled: activeTab === "history"
  });

  // Mutation para actualizar tareas
  const updateTaskMutation = useMutation({
    mutationFn: (taskData: { id: string, updates: Partial<ScheduledTask> }) => 
      updateScheduledTask(taskData.id, taskData.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] });
      toast.success("Tarea actualizada correctamente");
      setEditingTask(null);
    },
    onError: () => {
      toast.error("Error al actualizar la tarea");
    }
  });

  // Mutation para crear tareas
  const createTaskMutation = useMutation({
    mutationFn: (taskData: Omit<ScheduledTask, 'id' | 'created_at' | 'updated_at'>) => 
      createScheduledTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] });
      toast.success("Tarea creada correctamente");
      setNewTask(false);
      setEditingTask(null);
    },
    onError: () => {
      toast.error("Error al crear la tarea");
    }
  });

  // Mutation para eliminar tareas
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => deleteScheduledTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] });
      toast.success("Tarea eliminada correctamente");
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: () => {
      toast.error("Error al eliminar la tarea");
    }
  });

  // Resetear el estado al cerrar el modal
  const handleClose = () => {
    setEditingTask(null);
    setNewTask(false);
    setActiveTab("tasks");
    setSelectedTaskId(null);
    onClose();
  };

  // Cambiar estado activo/inactivo de una tarea
  const handleToggleActive = (taskId: string, isCurrentlyActive: boolean) => {
    updateTaskMutation.mutate({
      id: taskId,
      updates: { is_active: !isCurrentlyActive }
    });
  };

  // Iniciar edición de tarea
  const handleEditTask = (task: ScheduledTask) => {
    setEditingTask(task);
    setNewTask(false);
  };

  // Iniciar creación de tarea
  const handleNewTask = () => {
    setEditingTask({
      name: '',
      description: '',
      task_type: 'custom',
      cron_expression: '0 0 * * *',
      is_active: true,
      created_by: user?.id
    });
    setNewTask(true);
  };

  // Guardar cambios de tarea
  const handleSaveTask = () => {
    if (!editingTask?.name || !editingTask.task_type || !editingTask.cron_expression) {
      toast.error("Por favor complete todos los campos requeridos");
      return;
    }

    if (newTask) {
      createTaskMutation.mutate(editingTask as Omit<ScheduledTask, 'id' | 'created_at' | 'updated_at'>);
    } else if (editingTask.id) {
      const { id, ...updates } = editingTask;
      updateTaskMutation.mutate({ id, updates });
    }
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingTask(null);
    setNewTask(false);
  };

  // Preparar eliminación de tarea
  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };

  // Confirmar eliminación de tarea
  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete);
    }
  };

  // Formatear expresión cron para mostrarse de forma legible
  const formatCronExpression = (cron: string): string => {
    const parts = cron.split(' ');
    if (parts.length !== 5) return cron;
    
    // Casos comunes
    if (cron === '0 2 * * *') return 'Diariamente a las 02:00 AM';
    if (cron === '0 1 * * 0') return 'Cada domingo a la 01:00 AM';
    if (cron === '0 8 * * 1') return 'Cada lunes a las 08:00 AM';
    
    return cron;
  };

  // Formatear estado de ejecución con colores
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <Badge className="bg-green-500">Completado</Badge>;
      case 'running':
        return <Badge className="bg-blue-500">En ejecución</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Fallido</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendiente</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Administrar Tareas Programadas</DialogTitle>
            <DialogDescription>
              Configure y monitorice las tareas de mantenimiento del sistema
            </DialogDescription>
          </DialogHeader>

          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="tasks">Tareas</TabsTrigger>
              <TabsTrigger value="history">Historial de Ejecuciones</TabsTrigger>
            </TabsList>

            <TabsContent 
              value="tasks" 
              className="flex-1 flex flex-col"
            >
              {editingTask ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="task-name">Nombre de la tarea</Label>
                      <Input
                        id="task-name"
                        value={editingTask.name || ''}
                        onChange={(e) => setEditingTask({...editingTask, name: e.target.value})}
                        placeholder="Nombre descriptivo de la tarea"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="task-description">Descripción</Label>
                      <Textarea
                        id="task-description"
                        value={editingTask.description || ''}
                        onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                        placeholder="Descripción detallada de la tarea"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="task-type">Tipo de tarea</Label>
                      <Input
                        id="task-type"
                        value={editingTask.task_type || ''}
                        onChange={(e) => setEditingTask({...editingTask, task_type: e.target.value})}
                        placeholder="backup, cleanup, report, custom, etc."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cron-expression">Expresión Cron</Label>
                      <Input
                        id="cron-expression"
                        value={editingTask.cron_expression || ''}
                        onChange={(e) => setEditingTask({...editingTask, cron_expression: e.target.value})}
                        placeholder="0 2 * * * (a las 2 AM diariamente)"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Formato: minuto hora día-del-mes mes día-de-la-semana
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="task-active"
                        checked={editingTask.is_active || false}
                        onCheckedChange={(checked) => setEditingTask({...editingTask, is_active: checked})}
                      />
                      <Label htmlFor="task-active">Tarea activa</Label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveTask}
                      disabled={updateTaskMutation.isPending || createTaskMutation.isPending}
                    >
                      {(updateTaskMutation.isPending || createTaskMutation.isPending) && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {!updateTaskMutation.isPending && !createTaskMutation.isPending && (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex justify-end mb-4">
                    <Button onClick={handleNewTask}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Nueva tarea
                    </Button>
                  </div>
                  
                  {tasksLoading ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : !tasks || tasks.length === 0 ? (
                    <div className="py-8 text-center">
                      <Info className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No hay tareas programadas</h3>
                      <p className="text-muted-foreground">
                        Cree una nueva tarea usando el botón de arriba
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Estado</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Programación</TableHead>
                          <TableHead>Próxima ejecución</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell>
                              <Switch
                                checked={task.is_active}
                                onCheckedChange={() => handleToggleActive(task.id, task.is_active)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{task.name}</TableCell>
                            <TableCell>{task.task_type}</TableCell>
                            <TableCell>{formatCronExpression(task.cron_expression)}</TableCell>
                            <TableCell>
                              {task.next_run_at ? (
                                format(parseISO(task.next_run_at), 'dd/MM/yyyy HH:mm')
                              ) : (
                                'No programada'
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setSelectedTaskId(task.id);
                                    setActiveTab("history");
                                  }}
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditTask(task)}
                                >
                                  <Calendar className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteTask(task.id)}
                                >
                                  <Trash className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent 
              value="history" 
              className="flex-1 flex flex-col"
            >
              <div className="mb-4">
                <Label>Filtrar por tarea</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedTaskId || ''}
                  onChange={(e) => setSelectedTaskId(e.target.value || null)}
                >
                  <option value="">Todas las tareas</option>
                  {tasks?.map((task) => (
                    <option key={task.id} value={task.id}>{task.name}</option>
                  ))}
                </select>
              </div>
              
              {historyLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !executionHistory || executionHistory.length === 0 ? (
                <div className="py-8 text-center flex-1 flex flex-col justify-center">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No hay historial de ejecución</h3>
                  <p className="text-muted-foreground">
                    Todavía no se ha ejecutado ninguna tarea programada
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarea</TableHead>
                      <TableHead>Inicio</TableHead>
                      <TableHead>Finalización</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executionHistory.map((execution) => (
                      <TableRow key={execution.id}>
                        <TableCell>
                          {tasks?.find(t => t.id === execution.task_id)?.name || execution.task_id}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(execution.started_at), 'dd/MM/yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          {execution.completed_at 
                            ? format(parseISO(execution.completed_at), 'dd/MM/yyyy HH:mm:ss') 
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(execution.status)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {execution.result || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la tarea programada y todo su historial de ejecuciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTask}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteTaskMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
