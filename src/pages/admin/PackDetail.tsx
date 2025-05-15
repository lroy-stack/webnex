
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { DetailView } from "@/components/admin/shared/DetailView";
import { PackDetail as PackDetailComponent } from "@/components/admin/packs/PackDetail";
import { Edit, Trash2, Copy } from "lucide-react";
import { Pack, fetchPackById, deletePack, duplicatePack } from "@/services/adminPackService";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const PackDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [pack, setPack] = useState<Pack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  useEffect(() => {
    const loadPack = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await fetchPackById(id);
        setPack(data);
      } catch (error) {
        console.error("Error loading pack:", error);
        toast.error("Error al cargar la información del pack");
      } finally {
        setIsLoading(false);
      }
    };

    loadPack();
  }, [id]);

  const handleEdit = () => {
    navigate(`/auth-myweb/packs/${id}/edit`);
  };

  const handleBack = () => {
    navigate("/auth-myweb/packs");
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      const success = await deletePack(id);
      if (success) {
        toast.success("Pack eliminado con éxito");
        navigate("/auth-myweb/packs");
      }
    } catch (error) {
      console.error("Error deleting pack:", error);
      toast.error("Error al eliminar el pack");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDuplicate = async () => {
    if (!id) return;
    
    setIsDuplicating(true);
    try {
      const newPack = await duplicatePack(id);
      if (newPack) {
        toast.success("Pack duplicado con éxito");
        navigate(`/auth-myweb/packs/${newPack.id}`);
      }
    } catch (error) {
      console.error("Error duplicating pack:", error);
      toast.error("Error al duplicar el pack");
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <BreadcrumbNav />
          
          <DetailView
            title={pack?.name || "Detalle de Pack"}
            description={pack ? `${pack.price.toLocaleString('es-ES')} €` : "Cargando información..."}
            onBack={handleBack}
            isLoading={isLoading}
            actions={
              <>
                <Button 
                  variant="outline" 
                  onClick={handleDuplicate}
                  disabled={isLoading || isDuplicating}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {isDuplicating ? "Duplicando..." : "Duplicar"}
                </Button>
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
            {pack ? <PackDetailComponent pack={pack} /> : null}
          </DetailView>
          
          <ConfirmDialog
            open={showDeleteDialog}
            title="Eliminar Pack"
            description="¿Estás seguro de que quieres eliminar este pack? Esta acción no se puede deshacer y podría afectar a los clientes que lo tengan contratado."
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

export default PackDetail;
