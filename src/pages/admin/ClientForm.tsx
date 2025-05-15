
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { DetailView } from "@/components/admin/shared/DetailView";
import { ClientForm as ClientFormComponent } from "@/components/admin/clients/ClientForm";
import { ClientProfile, fetchClientById, fetchClientByUserId, updateClientProfile, createClientProfile } from "@/services/adminClientService";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const ClientForm = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

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

    if (isEditing) {
      loadClient();
    } else {
      setIsLoading(false);
    }
  }, [id, isEditing]);

  const handleSubmit = async (data: Partial<ClientProfile>) => {
    setIsSaving(true);
    try {
      if (isEditing && id) {
        await updateClientProfile(id, data);
        toast.success("Cliente actualizado con éxito");
      } else {
        await createClientProfile(data);
        toast.success("Cliente creado con éxito");
      }
      navigate("/auth-myweb/clients");
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error(`Error al ${isEditing ? 'actualizar' : 'crear'} el cliente`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate(isEditing ? `/auth-myweb/clients/${id}` : "/auth-myweb/clients");
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <BreadcrumbNav />
          
          <DetailView
            title={isEditing ? "Editar Cliente" : "Nuevo Cliente"}
            description={isEditing ? "Actualiza los datos del cliente" : "Crea un nuevo cliente"}
            onBack={handleBack}
            isLoading={isLoading}
          >
            {!isLoading && (
              <ClientFormComponent
                client={client || undefined}
                onSubmit={handleSubmit}
                isLoading={isSaving}
              />
            )}
          </DetailView>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ClientForm;
