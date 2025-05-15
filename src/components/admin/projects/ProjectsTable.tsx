import React from "react";
import { AdminTable } from "@/components/admin/shared/AdminTable";
import { Button } from "@/components/ui/button";
import { Eye, CalendarClock, CheckCircle, Clock, AlertTriangle, ThumbsUp, Trash } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AdminProjectWithClient, updateProjectStatus, deleteProject } from "@/services/adminProjectService";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";

interface ProjectsTableProps {
  projects: AdminProjectWithClient[];
  isLoading: boolean;
  onViewProject: (project: AdminProjectWithClient) => void;
  onRefresh: () => void;
  pagination: {
    currentPage: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export const ProjectsTable: React.FC<ProjectsTableProps> = ({
  projects,
  isLoading,
  onViewProject,
  onRefresh,
  pagination,
}) => {
  const [projectToAccept, setProjectToAccept] = React.useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = React.useState<string | null>(null);
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [projectBeingAccepted, setProjectBeingAccepted] = React.useState<AdminProjectWithClient | null>(null);

  const getProgressColor = (percentage: number) => {
    if (percentage < 25) return "bg-amber-500";
    if (percentage < 50) return "bg-blue-500";
    if (percentage < 75) return "bg-indigo-500";
    return "bg-green-500";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No definida";
    return format(new Date(dateStr), "d MMM, yyyy", { locale: es });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30 flex items-center gap-1 font-normal">
            <Clock size={14} className="text-amber-500" />
            Pendiente
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30 flex items-center gap-1 font-normal">
            <CalendarClock size={14} className="text-blue-500" />
            En progreso
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/30 flex items-center gap-1 font-normal">
            <CheckCircle size={14} className="text-green-500" />
            Completado
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30 flex items-center gap-1 font-normal">
            <AlertTriangle size={14} className="text-red-500" />
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handle accepting a project
  const handleAcceptProject = async () => {
    if (!projectToAccept || !projectBeingAccepted) return;
    
    setIsAccepting(true);
    try {
      // Updated to use the enhanced updateProjectStatus function that creates notifications
      const success = await updateProjectStatus(projectToAccept, 'in_progress');
      
      if (success) {
        toast.success(`Proyecto "${projectBeingAccepted.name}" aceptado correctamente`);
        toast.success("Se ha enviado una notificación al cliente");
        onRefresh(); // Refresh the project list
      } else {
        toast.error("Error al aceptar el proyecto");
      }
    } catch (error) {
      console.error("Error accepting project:", error);
      toast.error("Error al aceptar el proyecto");
    } finally {
      setIsAccepting(false);
      setProjectToAccept(null);
      setProjectBeingAccepted(null);
    }
  };

  // Handle deleting a project
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    setIsDeleting(true);
    const success = await deleteProject(projectToDelete);
    
    if (success) {
      toast.success("Proyecto eliminado correctamente");
      onRefresh(); // Refresh the project list
    } else {
      toast.error("Error al eliminar el proyecto");
    }
    
    setIsDeleting(false);
    setProjectToDelete(null);
  };

  const columns = [
    {
      id: "name",
      header: "Proyecto",
      cell: (project: AdminProjectWithClient) => (
        <div>
          <div className="font-medium">{project.name}</div>
          <div className="text-muted-foreground text-xs">ID: {project.id.slice(0, 8)}</div>
        </div>
      ),
      sortable: true,
    },
    {
      id: "client",
      header: "Cliente",
      cell: (project: AdminProjectWithClient) => (
        <div>
          <div>{project.first_name} {project.last_name}</div>
          <div className="text-muted-foreground text-xs">{project.email}</div>
        </div>
      ),
      sortable: true,
    },
    {
      id: "status",
      header: "Estado",
      cell: (project: AdminProjectWithClient) => getStatusBadge(project.status),
      sortable: true,
    },
    {
      id: "progress",
      header: "Progreso",
      cell: (project: AdminProjectWithClient) => (
        <div className="w-32">
          <div className="flex justify-between mb-1 text-xs">
            <span>{project.progress_percentage || 0}%</span>
          </div>
          <Progress 
            value={project.progress_percentage || 0} 
            className="h-2" 
            indicatorClassName={getProgressColor(project.progress_percentage || 0)}
          />
        </div>
      ),
      sortable: true,
    },
    {
      id: "dates",
      header: "Fechas",
      cell: (project: AdminProjectWithClient) => (
        <div className="space-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">Inicio:</span>{" "}
            {formatDate(project.start_date)}
          </div>
          <div>
            <span className="text-muted-foreground">Fin est.:</span>{" "}
            {formatDate(project.expected_end_date)}
          </div>
        </div>
      ),
      sortable: true,
    },
  ];

  return (
    <>
      <AdminTable
        columns={columns}
        data={projects}
        isLoading={isLoading}
        pagination={pagination}
        onRowClick={onViewProject}
        actions={(project) => (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onViewProject(project)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver
            </Button>
            {project.status === 'pending' && (
              <Button 
                size="sm" 
                variant="default"
                className="bg-green-600 hover:bg-green-700" 
                onClick={(e) => {
                  e.stopPropagation();
                  setProjectToAccept(project.id);
                  setProjectBeingAccepted(project);
                }}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                Aceptar
              </Button>
            )}
            <Button 
              size="sm" 
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                setProjectToDelete(project.id);
              }}
            >
              <Trash className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        )}
      />

      <ConfirmDialog
        open={!!projectToAccept}
        title="Aceptar proyecto"
        description={`¿Estás seguro de que deseas aceptar este proyecto? El estado cambiará a 'En progreso' y se enviará una notificación al cliente.`}
        confirmText="Aceptar proyecto"
        cancelText="Cancelar"
        onConfirm={handleAcceptProject}
        onCancel={() => {
          setProjectToAccept(null);
          setProjectBeingAccepted(null);
        }}
        isLoading={isAccepting}
      />

      <ConfirmDialog
        open={!!projectToDelete}
        title="Eliminar proyecto"
        description="¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer."
        confirmText="Eliminar proyecto"
        cancelText="Cancelar"
        onConfirm={handleDeleteProject}
        onCancel={() => setProjectToDelete(null)}
        isLoading={isDeleting}
        variant="destructive"
      />
    </>
  );
};
