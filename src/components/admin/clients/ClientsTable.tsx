import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Edit, Trash2, UserCog } from "lucide-react";
import { AdminTable } from "../shared/AdminTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "../shared/StatusBadge";
import { ClientProfile } from "@/services/adminClientService";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientsTableProps {
  clients: ClientProfile[];
  totalClients: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onDeleteClient: (id: string) => Promise<void>;
}

export function ClientsTable({
  clients,
  totalClients,
  currentPage,
  pageSize,
  isLoading,
  onPageChange,
  onDeleteClient
}: ClientsTableProps) {
  const navigate = useNavigate();
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleViewClient = (client: ClientProfile) => {
    navigate(`/auth-myweb/clients/${client.id}`);
  };

  const handleEditClient = (client: ClientProfile) => {
    navigate(`/auth-myweb/clients/${client.id}/edit`);
  };

  const handleDeleteConfirm = async () => {
    if (clientToDelete) {
      setIsDeleting(true);
      await onDeleteClient(clientToDelete);
      setIsDeleting(false);
      setClientToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Fecha desconocida";
    
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Fecha inválida";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between mb-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="border rounded-md">
          <div className="p-4 border-b">
            <div className="grid grid-cols-7 gap-4">
              <Skeleton className="h-6 col-span-2" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          </div>
          
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 border-b">
              <div className="grid grid-cols-7 gap-4">
                <div className="col-span-2">
                  <Skeleton className="h-6 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-6" />
                <Skeleton className="h-6" />
                <Skeleton className="h-6" />
                <Skeleton className="h-6" />
                <Skeleton className="h-6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  console.log("ClientsTable rendering with clients:", clients);

  const columns = [
    {
      id: "business_name",
      header: "Nombre",
      cell: (client: ClientProfile) => (
        <div className="font-medium">
          <div>{client.business_name || "Sin nombre"}</div>
          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
            {client.first_name && client.last_name 
              ? `${client.first_name} ${client.last_name}` 
              : client.email || "Sin contacto"}
          </div>
        </div>
      ),
      sortable: true
    },
    {
      id: "email",
      header: "Email",
      cell: (client: ClientProfile) => (
        <div className="truncate max-w-[200px]">
          {client.email ? (
            <a href={`mailto:${client.email}`} className="hover:text-primary transition-colors">
              {client.email}
            </a>
          ) : (
            <span className="text-muted-foreground italic">Sin email</span>
          )}
        </div>
      ),
      sortable: true
    },
    {
      id: "phone",
      header: "Teléfono",
      cell: (client: ClientProfile) => (
        <div>
          {client.phone ? (
            <a href={`tel:${client.phone}`} className="hover:text-primary transition-colors">
              {client.phone}
            </a>
          ) : (
            <span className="text-muted-foreground italic">-</span>
          )}
        </div>
      ),
      sortable: true
    },
    {
      id: "created_at",
      header: "Registro",
      cell: (client: ClientProfile) => formatDate(client.created_at),
      sortable: true
    },
    {
      id: "status",
      header: "Estado",
      cell: (client: ClientProfile) => (
        <StatusBadge status={client.status || "inactive"} />
      ),
      sortable: true
    },
    {
      id: "subscription",
      header: "Suscripción",
      cell: (client: ClientProfile) => (
        client.subscription_tier ? (
          <div className="flex flex-col">
            <StatusBadge 
              status={client.subscription_status || "inactive"}
              className="mb-1"
            />
            <span className="text-xs text-muted-foreground">
              {client.subscription_tier.charAt(0).toUpperCase() + 
              client.subscription_tier.slice(1)}
            </span>
          </div>
        ) : (
          <StatusBadge status="inactive" />
        )
      ),
      sortable: true
    },
    {
      id: "last_activity",
      header: "Últ. actividad",
      cell: (client: ClientProfile) => client.last_activity ? formatDate(client.last_activity) : "-",
      sortable: true
    }
  ];

  const renderActions = (client: ClientProfile) => (
    <>
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={(e) => {
          e.stopPropagation();
          handleViewClient(client);
        }}
        title="Ver detalles"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={(e) => {
          e.stopPropagation();
          handleEditClient(client);
        }}
        title="Editar cliente"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={(e) => {
          e.stopPropagation();
          setClientToDelete(client.id);
        }}
        title="Eliminar cliente"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );

  return (
    <>
      <AdminTable
        columns={columns}
        data={clients}
        onRowClick={handleViewClient}
        actions={renderActions}
        pagination={{
          currentPage,
          pageSize,
          total: totalClients,
          onPageChange
        }}
        isLoading={isLoading}
      />

      <ConfirmDialog
        open={!!clientToDelete}
        title="Eliminar cliente"
        description="¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setClientToDelete(null)}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}