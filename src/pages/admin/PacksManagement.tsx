import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { PacksTable } from "@/components/admin/packs/PacksTable";
import { Plus } from "lucide-react";
import { Pack, fetchPacks, deletePack, duplicatePack, togglePackActive } from "@/services/adminPackService";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface PacksManagementProps {
  embedded?: boolean;
}

const PacksManagement = ({ embedded = false }: PacksManagementProps) => {
  const navigate = useNavigate();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [totalPacks, setTotalPacks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 10;

  const loadPacks = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetchPacks({ 
        page, 
        pageSize,
        sortBy: 'position',
        sortOrder: 'asc'
      });
      setPacks(response.data);
      setTotalPacks(response.total);
    } catch (error) {
      console.error("Error loading packs:", error);
      toast.error("Error al cargar la lista de packs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPacks(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeletePack = async (id: string) => {
    try {
      const success = await deletePack(id);
      if (success) {
        // Reload the current page or go to previous page if this was the only item
        if (packs.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          loadPacks(currentPage);
        }
      }
    } catch (error) {
      console.error("Error deleting pack:", error);
      toast.error("Error al eliminar el pack");
    }
  };

  const handleDuplicatePack = async (id: string) => {
    try {
      const newPack = await duplicatePack(id);
      if (newPack) {
        toast.success("Pack duplicado con éxito");
        loadPacks(currentPage);
      }
    } catch (error) {
      console.error("Error duplicating pack:", error);
      toast.error("Error al duplicar el pack");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const success = await togglePackActive(id, isActive);
      if (success) {
        loadPacks(currentPage);
      }
    } catch (error) {
      console.error("Error toggling pack active status:", error);
      toast.error(`Error al ${isActive ? 'activar' : 'desactivar'} el pack`);
    }
  };

  // Content that's rendered regardless of embedded state
  const content = (
    <>
      {!embedded && <BreadcrumbNav />}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          {!embedded && <h1 className="text-3xl font-bold">Gestión de Packs</h1>}
          {embedded && <h2 className="text-2xl font-bold">Packs</h2>}
          <p className="text-muted-foreground">
            Administra los packs de servicios disponibles
          </p>
        </div>
        
        <Button 
          onClick={() => navigate("/auth-myweb/packs/new")}
          className="whitespace-nowrap"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo Pack
        </Button>
      </div>
      
      <div className={embedded ? "" : "bg-card border border-border rounded-xl p-6 shadow-sm"}>
        <PacksTable 
          packs={packs}
          totalPacks={totalPacks}
          currentPage={currentPage}
          pageSize={pageSize}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onDeletePack={handleDeletePack}
          onDuplicatePack={handleDuplicatePack}
          onToggleActive={handleToggleActive}
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

export default PacksManagement;
