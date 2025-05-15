
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader, 
  CardTitle, 
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  Database,
  BarChart3,
  AlarmClock,
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDatabaseStats, executeMaintenanceTask, fetchScheduledTasks } from "@/services/adminToolsService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { TasksManagementModal } from "./TasksManagementModal";

export const MaintenanceTools: React.FC = () => {
  const [isRunningMaintenance, setIsRunningMaintenance] = useState<boolean>(false);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState<boolean>(false);
  const { user } = useAuth();

  // Obtener estadísticas de la base de datos
  const { 
    data: dbStats, 
    isLoading: isLoadingStats,
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['database-stats'],
    queryFn: getDatabaseStats
  });

  // Obtener tareas programadas
  const {
    data: scheduledTasks,
    isLoading: isLoadingTasks,
  } = useQuery({
    queryKey: ['scheduled-tasks'],
    queryFn: fetchScheduledTasks
  });

  // Función para ejecutar tareas de mantenimiento
  const runMaintenance = async (taskType: string) => {
    if (!user?.id) {
      toast.error("No se encontró información de usuario");
      return;
    }

    setIsRunningMaintenance(true);
    
    try {
      await executeMaintenanceTask(taskType);
      toast.success(`Tarea de mantenimiento "${taskType}" completada con éxito`);
      
      // Actualizar estadísticas después del mantenimiento
      refetchStats();
    } catch (error) {
      console.error("Error running maintenance task:", error);
      toast.error("Error al ejecutar la tarea de mantenimiento");
    } finally {
      setIsRunningMaintenance(false);
    }
  };

  // Función para abrir el modal de administración de tareas
  const openTasksModal = () => {
    setIsTasksModalOpen(true);
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estadísticas de la Base de Datos
          </CardTitle>
          <CardDescription>
            Información general sobre los datos almacenados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Clientes"
                value={dbStats?.clients || 0}
                icon={<BarChart3 className="h-5 w-5 text-blue-500" />}
                color="blue"
              />
              <StatsCard
                title="Servicios"
                value={dbStats?.services || 0}
                icon={<BarChart3 className="h-5 w-5 text-green-500" />}
                color="green"
              />
              <StatsCard
                title="Packs"
                value={dbStats?.packs || 0}
                icon={<BarChart3 className="h-5 w-5 text-purple-500" />}
                color="purple"
              />
              <StatsCard
                title="Mensajes"
                value={dbStats?.messages || 0}
                icon={<BarChart3 className="h-5 w-5 text-amber-500" />}
                color="amber"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Tareas de Mantenimiento
            </CardTitle>
            <CardDescription>
              Ejecuta tareas de mantenimiento para optimizar el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-md p-4 hover:bg-muted/50 transition-colors">
                <h3 className="text-sm font-semibold mb-1">Limpiar datos temporales</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Elimina archivos y registros temporales para liberar espacio
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => runMaintenance("Limpieza de datos temporales")}
                  disabled={isRunningMaintenance}
                >
                  {isRunningMaintenance ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Ejecutar
                </Button>
              </div>
              
              <div className="border rounded-md p-4 hover:bg-muted/50 transition-colors">
                <h3 className="text-sm font-semibold mb-1">Verificar integridad</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Verifica la integridad referencial de la base de datos
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => runMaintenance("Verificación de integridad")}
                  disabled={isRunningMaintenance}
                >
                  {isRunningMaintenance ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Ejecutar
                </Button>
              </div>
              
              <div className="border rounded-md p-4 hover:bg-muted/50 transition-colors">
                <h3 className="text-sm font-semibold mb-1">Optimizar base de datos</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Ejecuta operaciones de optimización en las tablas
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => runMaintenance("Optimización de base de datos")}
                  disabled={isRunningMaintenance}
                >
                  {isRunningMaintenance ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Ejecutar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlarmClock className="h-5 w-5" />
              Tareas Programadas
            </CardTitle>
            <CardDescription>
              Estado de las tareas programadas del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTasks ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : !scheduledTasks || scheduledTasks.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No hay tareas programadas configuradas
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledTasks.map(task => (
                  <div key={task.id} className="border rounded-md p-4">
                    <div className="flex justify-between mb-1">
                      <h3 className="text-sm font-semibold">{task.name}</h3>
                      <span className={`text-xs ${task.is_active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} px-2 py-1 rounded-full`}>
                        {task.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Programada para ejecutarse {formatCronExpression(task.cron_expression)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.last_run_at ? (
                        <>Última ejecución: {format(parseISO(task.last_run_at), 'dd/MM/yyyy HH:mm')}</>
                      ) : task.next_run_at ? (
                        <>Próxima ejecución: {format(parseISO(task.next_run_at), 'dd/MM/yyyy HH:mm')}</>
                      ) : (
                        'No se ha ejecutado aún'
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" size="sm" onClick={openTasksModal}>
              Administrar tareas
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Modal para administrar tareas */}
      <TasksManagementModal 
        open={isTasksModalOpen} 
        onClose={() => setIsTasksModalOpen(false)} 
      />
    </div>
  );
};

// Helper function para formatear expresiones cron
const formatCronExpression = (cron: string): string => {
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;
  
  // Casos comunes
  if (cron === '0 2 * * *') return 'diariamente a las 02:00 AM';
  if (cron === '0 1 * * 0') return 'los domingos a la 01:00 AM';
  if (cron === '0 8 * * 1') return 'los lunes a las 08:00 AM';
  
  return cron;
};

// Componente auxiliar para mostrar estadísticas
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'amber';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    purple: 'bg-purple-50 border-purple-100',
    amber: 'bg-amber-50 border-amber-100'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
};
