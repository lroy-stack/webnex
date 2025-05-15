import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { ServicesTable } from "@/components/admin/services/ServicesTable";
import { Plus } from "lucide-react";
import { Service, fetchServices, deleteService, toggleServiceActive } from "@/services/adminServiceService";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface ServicesManagementProps {
  embedded?: boolean;
}

const ServicesManagement = ({ embedded = false }: ServicesManagementProps) => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [totalServices, setTotalServices] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 10;

  const loadServices = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetchServices({ 
        page, 
        pageSize,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      setServices(response.data);
      setTotalServices(response.total);
    } catch (error) {
      console.error("Error loading services:", error);
      toast.error("Error al cargar la lista de servicios");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteService = async (id: string) => {
    try {
      const success = await deleteService(id);
      if (success) {
        // Reload the current page or go to previous page if this was the only item
        if (services.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          loadServices(currentPage);
        }
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Error al eliminar el servicio");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const success = await toggleServiceActive(id, isActive);
      if (success) {
        loadServices(currentPage);
      }
    } catch (error) {
      console.error("Error toggling service active status:", error);
      toast.error(`Error al ${isActive ? 'activar' : 'desactivar'} el servicio`);
    }
  };

  // Content that's rendered regardless of embedded state
  const content = (
    <>
      {!embedded && <BreadcrumbNav />}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          {!embedded && <h1 className="text-3xl font-bold">Gestión de Servicios</h1>}
          {embedded && <h2 className="text-2xl font-bold">Servicios</h2>}
          <p className="text-muted-foreground">
            Administra los servicios individuales disponibles
          </p>
        </div>
        
        <Button 
          onClick={() => navigate("/auth-myweb/services/new")}
          className="whitespace-nowrap"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
        </Button>
      </div>
      
      <div className={embedded ? "" : "bg-card border border-border rounded-xl p-6 shadow-sm"}>
        <ServicesTable 
          services={services}
          totalServices={totalServices}
          currentPage={currentPage}
          pageSize={pageSize}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onDeleteService={handleDeleteService}
          onToggleActive={handleToggleActive}
        />
      </div>
    </>
  );

  // If embedded, just return the content
  if (embedded) {
    return content;
  }

  // Otherwise wrap in Layout and ProtectedRoute
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Layout>
        <div className="container mx-auto py-8 px-4">
          {content}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ServicesManagement;
