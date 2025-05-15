import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectsTable } from "@/components/admin/projects/ProjectsTable";
import { AdminProjectWithClient, getAllProjects, AdminProjectFilters } from "@/services/adminProjectService";
import { Search, Filter, AlertTriangle, RefreshCw } from "lucide-react";
import { DetailView } from "@/components/admin/shared/DetailView";
import { ProjectDetail } from "@/components/admin/projects/ProjectDetail";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProjectsManagementProps {
  embedded?: boolean;
}

const ProjectsManagement: React.FC<ProjectsManagementProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole } = useAuth();
  const [projects, setProjects] = useState<AdminProjectWithClient[]>([]);
  const [selectedProject, setSelectedProject] = useState<AdminProjectWithClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalProjects, setTotalProjects] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const isAdmin = userRole === 'admin';

  // Function to load projects with error handling
  const loadProjects = async () => {
    if (!isAdmin) {
      setLoadError("No tienes permisos de administrador para ver esta información");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log("Cargando proyectos con filtros:", { page, pageSize, searchTerm, statusFilter, dateFrom, dateTo });
      
      const filters: AdminProjectFilters = {};
      if (searchTerm && searchTerm.trim() !== '') filters.search = searchTerm;
      if (statusFilter && statusFilter !== 'all') filters.status = statusFilter;
      if (dateFrom && dateFrom.trim() !== '') filters.dateFrom = dateFrom;
      if (dateTo && dateTo.trim() !== '') filters.dateTo = dateTo;
      
      const result = await getAllProjects(page, pageSize, filters);
      
      console.log("Proyectos obtenidos:", result.data.length, "de", result.totalCount);
      setProjects(result.data);
      setTotalProjects(result.totalCount);
    } catch (error: any) {
      console.error("Error cargando proyectos:", error);
      setLoadError(error instanceof Error ? error.message : "Error desconocido al cargar proyectos");
    } finally {
      setIsLoading(false);
    }
  };

  // Load projects on initial render and when filters change
  useEffect(() => {
    loadProjects();
  }, [page, pageSize, isAdmin]);

  // Handle viewing a project
  const handleViewProject = (project: AdminProjectWithClient) => {
    if (embedded) {
      setSelectedProject(project);
    } else {
      navigate(`/auth-myweb/projects/${project.id}`);
    }
  };

  // Handle going back from project detail view
  const handleBack = () => {
    setSelectedProject(null);
  };

  // Apply filters
  const applyFilters = () => {
    setPage(1);
    loadProjects();
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    loadProjects();
  };

  // Render the project detail if a project is selected
  if (selectedProject) {
    return (
      <div className="space-y-6">
        <DetailView 
          title={selectedProject.name}
          description={`Gestión del proyecto ${selectedProject.id}`}
          onBack={handleBack}
        >
          <ProjectDetail 
            project={selectedProject} 
            onRefresh={() => {
              loadProjects();
              setSelectedProject(null);
            }} 
          />
        </DetailView>
      </div>
    );
  }

  // Si no es administrador, mostrar mensaje de acceso denegado
  if (!isAdmin && !isLoading) {
    return (
      <Alert variant="destructive" className="mb-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No tienes permisos de administrador para ver esta información.
        </AlertDescription>
      </Alert>
    );
  }

  const content = (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Proyectos</h1>
          <p className="text-muted-foreground">
            Administra y da seguimiento a los proyectos de tus clientes
          </p>
        </div>
      </div>
      
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nombre o cliente..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="in_progress">En progreso</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            type="date"
            className="w-full md:w-[180px]"
            placeholder="Desde"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          
          <Input
            type="date"
            className="w-full md:w-[180px]"
            placeholder="Hasta"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          
          <div className="flex gap-2">
            <Button onClick={applyFilters} className="w-full md:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button variant="outline" onClick={resetFilters} className="w-full md:w-auto">
              Limpiar
            </Button>
          </div>
        </div>
        
        {loadError ? (
          <div className="bg-destructive/10 text-destructive p-6 rounded-md my-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-medium">Error al cargar los proyectos</p>
                <p className="text-sm mt-1">{loadError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={loadProjects}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Intentar de nuevo
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <ProjectsTable
            projects={projects}
            isLoading={isLoading}
            onViewProject={handleViewProject}
            onRefresh={loadProjects}
            pagination={{
              currentPage: page,
              pageSize: pageSize,
              total: totalProjects,
              onPageChange: setPage,
            }}
          />
        )}
      </Card>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <BreadcrumbNav />
          {content}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ProjectsManagement;
