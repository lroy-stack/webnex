
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { getProjectDetails, updateProjectStatus, updateProjectDates } from "@/services/adminProjectService";
import { DetailView } from "@/components/admin/shared/DetailView";
import { ProjectDetail as ProjectDetailComponent } from "@/components/admin/projects/ProjectDetail";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { Clock, Play, CheckCircle, X, Calendar } from "lucide-react";
import { toast } from "sonner";

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'pending' | 'in_progress' | 'completed' | 'cancelled' | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingDates, setIsUpdatingDates] = useState(false);
  
  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        console.log("Loading project details for ID:", id);
        const projectData = await getProjectDetails(id);
        
        if (projectData) {
          console.log("Project data loaded successfully:", projectData);
          setProject(projectData);
        } else {
          console.error("Failed to load project details, received null");
          toast.error("Error al cargar los detalles del proyecto");
          navigate("/auth-myweb/projects");
        }
      } catch (error) {
        console.error("Error loading project:", error);
        toast.error("Error al cargar el proyecto");
        navigate("/auth-myweb/projects");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProject();
  }, [id, navigate]);
  
  const handleBack = () => {
    navigate("/auth-myweb/projects");
  };
  
  const refreshProject = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const projectData = await getProjectDetails(id);
      
      if (projectData) {
        console.log("Project refreshed:", projectData);
        setProject(projectData);
      } else {
        toast.error("Error al actualizar los datos del proyecto");
      }
    } catch (error) {
      console.error("Error refreshing project:", error);
      toast.error("Error al actualizar los datos del proyecto");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle status change confirmation with improved error handling
  const handleStatusChange = async () => {
    if (!id || !newStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      console.log(`Updating project status to: ${newStatus}`);
      const success = await updateProjectStatus(id, newStatus);
      
      if (success) {
        toast.success(`Estado del proyecto actualizado a "${newStatus}"`);
        refreshProject(); // Refresh project data
      } else {
        toast.error("Error al actualizar el estado del proyecto");
      }
    } catch (error) {
      console.error("Error updating project status:", error);
      toast.error("Error al actualizar el estado del proyecto");
    } finally {
      setIsUpdatingStatus(false);
      setStatusDialogOpen(false);
      setNewStatus(null);
    }
  };

  // Handle date updates with validation and improved error handling
  const handleDateUpdate = async (startDate: string | null, endDate: string | null) => {
    if (!id) return false;
    
    // Basic validation
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      
      // Ensure start date is not in the past
      if (start < new Date(today.setHours(0, 0, 0, 0))) {
        toast.error("La fecha de inicio no puede ser en el pasado");
        return false;
      }
      
      // Ensure end date is after start date
      if (start >= end) {
        toast.error("La fecha de finalización debe ser posterior a la fecha de inicio");
        return false;
      }
    }
    
    setIsUpdatingDates(true);
    try {
      console.log(`Updating project dates: start=${startDate}, end=${endDate}`);
      const success = await updateProjectDates(id, startDate, endDate);
      
      if (success) {
        toast.success("Fechas del proyecto actualizadas correctamente");
        refreshProject(); // Refresh project data with new dates
        return true;
      } else {
        toast.error("Error al actualizar las fechas del proyecto");
      }
    } catch (error) {
      console.error("Error updating project dates:", error);
      toast.error("Error al actualizar las fechas del proyecto");
    } finally {
      setIsUpdatingDates(false);
    }
    
    return false;
  };

  // Open status dialog with the specified status
  const openStatusDialog = (status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    setNewStatus(status);
    setStatusDialogOpen(true);
  };
  
  // Helper function to get status action text
  const getStatusActionText = (status: string) => {
    switch (status) {
      case 'pending': return 'marcar como pendiente';
      case 'in_progress': return 'iniciar';
      case 'completed': return 'marcar como completado';
      case 'cancelled': return 'cancelar';
      default: return 'cambiar el estado de';
    }
  };
  
  // Render status action buttons based on current project status
  const renderStatusActions = () => {
    if (!project) return null;
    
    const currentStatus = project.status;
    
    return (
      <div className="flex items-center gap-2 mt-4">
        <div className="text-sm text-muted-foreground mr-2">Cambiar estado:</div>
        
        {currentStatus !== 'in_progress' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600"
            onClick={() => openStatusDialog('in_progress')}
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            Iniciar
          </Button>
        )}
        
        {currentStatus !== 'completed' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="border-green-200 bg-green-50 hover:bg-green-100 text-green-600"
            onClick={() => openStatusDialog('completed')}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Completar
          </Button>
        )}
        
        {currentStatus !== 'pending' && currentStatus !== 'cancelled' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-600"
            onClick={() => openStatusDialog('pending')}
          >
            <Clock className="h-3.5 w-3.5 mr-1" />
            Pendiente
          </Button>
        )}
        
        {currentStatus !== 'cancelled' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="border-red-200 bg-red-50 hover:bg-red-100 text-red-600"
            onClick={() => openStatusDialog('cancelled')}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancelar
          </Button>
        )}
      </div>
    );
  };
  
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <BreadcrumbNav />
          
          <DetailView
            title={project?.name || "Detalles del Proyecto"}
            description={`ID: ${id}`}
            isLoading={isLoading}
            onBack={handleBack}
            actions={project ? renderStatusActions() : undefined}
          >
            {project && (
              <ProjectDetailComponent 
                project={project} 
                onRefresh={refreshProject}
                onUpdateDates={handleDateUpdate}
                isUpdatingDates={isUpdatingDates}
              />
            )}
          </DetailView>

          <ConfirmDialog
            open={statusDialogOpen}
            title={`Cambiar estado del proyecto`}
            description={`¿Estás seguro de que deseas ${getStatusActionText(newStatus || '')} este proyecto?`}
            confirmText="Confirmar cambio"
            cancelText="Cancelar"
            onConfirm={handleStatusChange}
            onCancel={() => {
              setStatusDialogOpen(false);
              setNewStatus(null);
            }}
            isLoading={isUpdatingStatus}
            variant={newStatus === 'cancelled' ? 'destructive' : 'default'}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ProjectDetailPage;
