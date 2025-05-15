import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { ClientsTable } from "@/components/admin/clients/ClientsTable";
import { Plus, RefreshCw, Mail } from "lucide-react";
import { ClientProfile, fetchClientProfiles, deleteClientProfile } from "@/services/adminClientService";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface ClientsManagementProps {
  embedded?: boolean;
}

const ClientsManagement = ({ embedded = false }: ClientsManagementProps) => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Para forzar actualizaciones
  const pageSize = 10;

  const loadClients = async (page: number) => {
    setIsLoading(true);
    try {
      console.log("Loading clients for page:", page);
      const response = await fetchClientProfiles({ 
        page, 
        pageSize,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      console.log("Clients loaded:", response.data.length);
      setClients(response.data);
      setTotalClients(response.total);
    } catch (error) {
      console.error("Error loading clients:", error);
      toast.error("Error al cargar la lista de clientes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients(currentPage);
  }, [currentPage, refreshKey]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1); // Forzar recarga de datos
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const success = await deleteClientProfile(id);
      if (success) {
        toast.success("Cliente eliminado con éxito");
        // Reload the current page or go to previous page if this was the only item
        if (clients.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          loadClients(currentPage);
        }
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Error al eliminar el cliente");
    }
  };

  // Content that's rendered regardless of embedded state
  const content = (
    <>
      {!embedded && <BreadcrumbNav />}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          {!embedded && <h1 className="text-3xl font-bold">Gestión de Clientes</h1>}
          {embedded && <h2 className="text-2xl font-bold">Clientes</h2>}
          <p className="text-muted-foreground">
            Administra los clientes registrados en la plataforma
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleRefresh}
            className="whitespace-nowrap"
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Opciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/auth-myweb/clients/new")}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Crear manualmente</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/auth-myweb/clients/new-onboarding")}>
                <Mail className="mr-2 h-4 w-4" />
                <span>Enviar invitación</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className={embedded ? "" : "bg-card border border-border rounded-xl p-6 shadow-sm"}>
        <ClientsTable 
          clients={clients}
          totalClients={totalClients}
          currentPage={currentPage}
          pageSize={pageSize}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onDeleteClient={handleDeleteClient}
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

export default ClientsManagement;