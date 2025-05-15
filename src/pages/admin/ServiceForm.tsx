
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { DetailView } from "@/components/admin/shared/DetailView";
import { ServiceForm as ServiceFormComponent } from "@/components/admin/services/ServiceForm";
import { Service, fetchServiceById, updateService, createService } from "@/services/adminServiceService";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const ServiceForm = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

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

    if (isEditing) {
      loadService();
    } else {
      setIsLoading(false);
    }
  }, [id, isEditing]);

  const handleSubmit = async (data: Partial<Service>) => {
    setIsSaving(true);
    try {
      if (isEditing && id) {
        await updateService(id, data);
        toast.success("Servicio actualizado con éxito");
      } else {
        await createService(data);
        toast.success("Servicio creado con éxito");
      }
      navigate("/auth-myweb/services");
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error(`Error al ${isEditing ? 'actualizar' : 'crear'} el servicio`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate(isEditing ? `/auth-myweb/services/${id}` : "/auth-myweb/services");
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <BreadcrumbNav />
          
          <DetailView
            title={isEditing ? "Editar Servicio" : "Nuevo Servicio"}
            description={isEditing ? "Actualiza la información del servicio" : "Crea un nuevo servicio individual"}
            onBack={handleBack}
            isLoading={isLoading}
          >
            {!isLoading && (
              <ServiceFormComponent
                service={service || undefined}
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

export default ServiceForm;
