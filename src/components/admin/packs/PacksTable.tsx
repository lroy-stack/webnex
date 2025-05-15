import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Eye, 
  Edit, 
  Trash2, 
  Copy,
  Check,
  X
} from "lucide-react";
import { AdminTable } from "../shared/AdminTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "../shared/StatusBadge";
import { Pack } from "@/services/adminPackService";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";

interface PacksTableProps {
  packs: Pack[];
  totalPacks: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onDeletePack: (id: string) => Promise<void>;
  onDuplicatePack: (id: string) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
}

export function PacksTable({
  packs,
  totalPacks,
  currentPage,
  pageSize,
  isLoading,
  onPageChange,
  onDeletePack,
  onDuplicatePack,
  onToggleActive
}: PacksTableProps) {
  const navigate = useNavigate();
  const [packToDelete, setPackToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const handleViewPack = (pack: Pack) => {
    navigate(`/auth-myweb/packs/${pack.id}`);
  };

  const handleEditPack = (pack: Pack) => {
    navigate(`/auth-myweb/packs/${pack.id}/edit`);
  };

  const handleDeleteConfirm = async () => {
    if (packToDelete) {
      setIsDeleting(true);
      await onDeletePack(packToDelete);
      setIsDeleting(false);
      setPackToDelete(null);
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
      cell: (pack: Pack) => (
        <div className="font-medium">
          <div>{pack.name}</div>
          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
            {pack.short_description || "-"}
          </div>
        </div>
      ),
      sortable: true
    },
    {
      id: "price",
      header: "Precio",
      cell: (pack: Pack) => (
        <div className="font-medium">
          {pack.price.toLocaleString('es-ES')} €
        </div>
      ),
      sortable: true
    },
    {
      id: "target",
      header: "Dirigido a",
      cell: (pack: Pack) => pack.target || "-",
      sortable: true
    },
    {
      id: "services",
      header: "Servicios",
      cell: (pack: Pack) => (
        <Badge variant="secondary">
          {pack.services_count || 0} servicios
        </Badge>
      ),
      sortable: true
    },
    {
      id: "clients",
      header: "Clientes",
      cell: (pack: Pack) => (
        <Badge variant="outline">
          {pack.clients_count || 0} clientes
        </Badge>
      ),
      sortable: true
    },
    {
      id: "status",
      header: "Estado",
      cell: (pack: Pack) => (
        <StatusBadge status={pack.is_active ? "active" : "inactive"} />
      ),
      sortable: true
    },
  ];

  const renderActions = (pack: Pack) => (
    <>
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={(e) => {
          e.stopPropagation();
          handleViewPack(pack);
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
          handleEditPack(pack);
        }}
        title="Editar pack"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={(e) => {
          e.stopPropagation();
          onDuplicatePack(pack.id);
        }}
        title="Duplicar pack"
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={(e) => {
          e.stopPropagation();
          handleToggleActive(pack.id, !!pack.is_active);
        }}
        disabled={isToggling === pack.id}
        title={pack.is_active ? "Desactivar pack" : "Activar pack"}
      >
        {pack.is_active ? (
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
          setPackToDelete(pack.id);
        }}
        title="Eliminar pack"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );

  return (
    <>
      <AdminTable
        columns={columns}
        data={packs}
        onRowClick={handleViewPack}
        actions={renderActions}
        pagination={{
          currentPage,
          pageSize,
          total: totalPacks,
          onPageChange
        }}
        isLoading={isLoading}
      />

      <ConfirmDialog
        open={!!packToDelete}
        title="Eliminar pack"
        description="¿Estás seguro de que quieres eliminar este pack? Esta acción no se puede deshacer y podría afectar a los clientes que lo tengan contratado."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPackToDelete(null)}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}
