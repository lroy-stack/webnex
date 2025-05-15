
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { DetailView } from "@/components/admin/shared/DetailView";
import { ClientDetail as ClientDetailComponent } from "@/components/admin/clients/ClientDetail";
import { Edit, Trash2 } from "lucide-react";
import { ClientProfile, fetchClientById, fetchClientByUserId, deleteClientProfile } from "@/services/adminClientService";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadClient = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Intentar cargar por ID de perfil primero
        try {
          const data = await fetchClientById(id);
          setClient(data);
        } catch (error) {
          console.log("Error cargando por ID de perfil, intentando por user_id:", error);
          // Si falla, intentar por ID de usuario como respaldo
          const userClient = await fetchClientByUserId(id);
          setClient(userClient);
        }
      } catch (error) {
        console.error("Error loading client:", error);
        toast.error("Error al cargar la información del cliente");
      } finally {
        setIsLoading(false);
      }
    };

    loadClient();
  }, [id]);

  const handleEdit = () => {
    navigate(`/auth-myweb/clients/${id}/edit`);
  };

  const handleBack = () => {
    navigate("/auth-myweb/clients");
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteClientProfile(id);
      if (success) {
        toast.success("Cliente eliminado con éxito");
        navigate("/auth-myweb/clients");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Error al eliminar el cliente");
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
            title={client?.business_name || "Detalle de Cliente"}
            description={client ? `ID: ${client.id}` : "Cargando información..."}
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
            {client ? <ClientDetailComponent client={client} /> : null}
          </DetailView>
          
          <ConfirmDialog
            open={showDeleteDialog}
            title="Eliminar Cliente"
            description="¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer."
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

export default ClientDetail;
