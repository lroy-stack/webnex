
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Eye, 
  Edit, 
  Trash2,
  Check,
  X
} from "lucide-react";
import { AdminTable } from "../shared/AdminTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "../shared/StatusBadge";
import { Service } from "@/services/adminServiceService";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { categoryConfig } from "@/utils/categoryStyles";

interface ServicesTableProps {
  services: Service[];
  totalServices: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onDeleteService: (id: string) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
}

export function ServicesTable({
  services,
  totalServices,
  currentPage,
  pageSize,
  isLoading,
  onPageChange,
  onDeleteService,
  onToggleActive
}: ServicesTableProps) {
  const navigate = useNavigate();
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const handleViewService = (service: Service) => {
    navigate(`/auth-myweb/services/${service.id}`);
  };

  const handleEditService = (service: Service) => {
    navigate(`/auth-myweb/services/${service.id}/edit`);
  };

  const handleDeleteConfirm = async () => {
    if (serviceToDelete) {
      setIsDeleting(true);
      await onDeleteService(serviceToDelete);
      setIsDeleting(false);
      setServiceToDelete(null);
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    setIsToggling(id);
    await onToggleActive(id, !currentState);
    setIsToggling(null);
  };

  const columns = [
    {
      id: "name",
      header: "Nombre",
      cell: (service: Service) => (
        <div className="font-medium">
          {service.name}
        </div>
      ),
      sortable: true
    },
    {
      id: "category",
      header: "Categoría",
      cell: (service: Service) => {
        const category = categoryConfig[service.category] || categoryConfig.technical;
        return (
          <Badge className={category.badgeColor}>
            {category.name || service.category}
          </Badge>
        );
      },
      sortable: true
    },
    {
      id: "price",
      header: "Precio",
      cell: (service: Service) => (
        <div className="font-medium">
          {service.price.toLocaleString('es-ES')} €
        </div>
      ),
      sortable: true
    },
    {
      id: "packs",
      header: "Packs",
      cell: (service: Service) => (
        <Badge variant="outline">
          {service.packs_count} packs
        </Badge>
      ),
      sortable: true
    },
    {
      id: "clients",
      header: "Clientes",
      cell: (service: Service) => (
        <Badge variant="outline">
          {service.clients_count} clientes
        </Badge>
      ),
      sortable: true
    },
    {
      id: "status",
      header: "Estado",
      cell: (service: Service) => (
        <StatusBadge status={service.is_active ? "active" : "inactive"} />
      ),
      sortable: true
    },
  ];

  const renderActions = (service: Service) => (
    <>
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={(e) => {
          e.stopPropagation();
          handleViewService(service);
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
          handleEditService(service);
        }}
        title="Editar servicio"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={(e) => {
          e.stopPropagation();
          handleToggleActive(service.id, !!service.is_active);
        }}
        disabled={isToggling === service.id}
        title={service.is_active ? "Desactivar servicio" : "Activar servicio"}
      >
        {service.is_active ? (
          <X className="h-4 w-4 text-red-500" />
        ) : (
          <Check className="h-4 w-4 text-green-500" />
        )}
      </Button>
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={(e) => {
          e.stopPropagation();
          setServiceToDelete(service.id);
        }}
        title="Eliminar servicio"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );

  return (
    <>
      <AdminTable
        columns={columns}
        data={services}
        onRowClick={handleViewService}
        actions={renderActions}
        pagination={{
          currentPage,
          pageSize,
          total: totalServices,
          onPageChange
        }}
        isLoading={isLoading}
      />

      <ConfirmDialog
        open={!!serviceToDelete}
        title="Eliminar servicio"
        description="¿Estás seguro de que quieres eliminar este servicio? Esta acción no se puede deshacer y podría afectar a los packs y clientes que lo tengan contratado."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setServiceToDelete(null)}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}
