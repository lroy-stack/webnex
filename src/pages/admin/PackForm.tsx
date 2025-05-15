
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { DetailView } from "@/components/admin/shared/DetailView";
import { PackForm as PackFormComponent } from "@/components/admin/packs/PackForm";
import { Pack, fetchPackById, updatePack, createPack } from "@/services/adminPackService";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const PackForm = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [pack, setPack] = useState<Pack | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

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

    if (isEditing) {
      loadPack();
    } else {
      setIsLoading(false);
    }
  }, [id, isEditing]);

  const handleSubmit = async (data: Partial<Pack>, features: string[]) => {
    setIsSaving(true);
    try {
      const packData = {
        ...data,
        features
      };
      
      if (isEditing && id) {
        await updatePack(id, packData);
        toast.success("Pack actualizado con éxito");
      } else {
        await createPack(packData);
        toast.success("Pack creado con éxito");
      }
      navigate("/auth-myweb/packs");
    } catch (error) {
      console.error("Error saving pack:", error);
      toast.error(`Error al ${isEditing ? 'actualizar' : 'crear'} el pack`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate(isEditing ? `/auth-myweb/packs/${id}` : "/auth-myweb/packs");
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <BreadcrumbNav />
          
          <DetailView
            title={isEditing ? "Editar Pack" : "Nuevo Pack"}
            description={isEditing ? "Actualiza la información del pack" : "Crea un nuevo pack de servicios"}
            onBack={handleBack}
            isLoading={isLoading}
          >
            {!isLoading && (
              <PackFormComponent
                pack={pack || undefined}
                onSubmit={handleSubmit}
                onCancel={handleBack}
                isLoading={isSaving}
              />
            )}
          </DetailView>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default PackForm;
