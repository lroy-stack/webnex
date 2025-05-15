
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { DetailView } from "@/components/admin/shared/DetailView";
import { ServiceDetail as ServiceDetailComponent } from "@/components/admin/services/ServiceDetail";
import { Edit, Trash2 } from "lucide-react";
import { Service, fetchServiceById, deleteService } from "@/services/adminServiceService";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadService = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await fetchServiceById(id);
        setService(data);
      } catch (error) {
        console.error("Error loading service:", error);
        toast.error("Error al cargar la información del servicio");
      } finally {
        setIsLoading(false);
      }
    };

    loadService();
  }, [id]);

  const handleEdit = () => {
    navigate(`/auth-myweb/services/${id}/edit`);
  };

  const handleBack = () => {
    navigate("/auth-myweb/services");
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteService(id);
      if (success) {
        toast.success("Servicio eliminado con éxito");
        navigate("/auth-myweb/services");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Error al eliminar el servicio");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <BreadcrumbNav />
          
          <DetailView
            title={service?.name || "Detalle de Servicio"}
            description={service ? `${service.price.toLocaleString('es-ES')} € - ${service.category}` : "Cargando información..."}
            onBack={handleBack}
            isLoading={isLoading}
            actions={
              <>
                <Button 
                  variant="outline" 
                  onClick={handleEdit}
                  disabled={isLoading}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              </>
            }
          >
            {service ? <ServiceDetailComponent service={service} /> : null}
          </DetailView>
          
          <ConfirmDialog
            open={showDeleteDialog}
            title="Eliminar Servicio"
            description="¿Estás seguro de que quieres eliminar este servicio? Esta acción no se puede deshacer y podría afectar a los packs y clientes que lo tengan contratado."
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteDialog(false)}
            confirmText="Eliminar"
            cancelText="Cancelar"
            variant="destructive"
            isLoading={isDeleting}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ServiceDetail;
