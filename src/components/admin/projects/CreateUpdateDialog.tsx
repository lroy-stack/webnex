
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createProjectUpdate } from "@/services/adminProjectService";

interface CreateUpdateDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  newUpdate: { title: string; content: string };
  setNewUpdate: (update: { title: string; content: string }) => void;
  onCreate: () => void;
  projectId?: string; // Added projectId prop
  adminId?: string; // Added adminId prop
  isCreating: boolean;
  onSuccess?: () => void; // Added success callback
}

export const CreateUpdateDialog: React.FC<CreateUpdateDialogProps> = ({
  open,
  setOpen,
  newUpdate,
  setNewUpdate,
  onCreate,
  projectId,
  adminId,
  isCreating,
  onSuccess
}) => {
  const handleCreate = async () => {
    // If projectId and adminId are provided, create the update directly in this component
    if (projectId && adminId) {
      try {
        const success = await createProjectUpdate(
          projectId,
          adminId,
          newUpdate.title,
          newUpdate.content
        );
        
        if (success) {
          toast.success("Actualización creada correctamente");
          setNewUpdate({ title: "", content: "" });
          setOpen(false);
          if (onSuccess) {
            onSuccess(); // Call the success callback to refresh data
          }
        } else {
          toast.error("Error al crear la actualización");
        }
      } catch (error) {
        console.error("Error creating update:", error);
        toast.error("Error al crear la actualización");
      }
    } else {
      // Fall back to the original behavior
      onCreate();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        variant="default"
      >
        Crear nueva actualización
      </Button>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Actualización</DialogTitle>
          <DialogDescription>
            Añade una nueva actualización al proyecto. Esto será visible para el cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Título de la actualización"
              value={newUpdate.title}
              onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Contenido</Label>
            <Textarea
              id="content"
              placeholder="Escribe el contenido de la actualización..."
              rows={6}
              value={newUpdate.content}
              onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleCreate}
            disabled={isCreating || !newUpdate.title || !newUpdate.content}
          >
            {isCreating ? 'Creando...' : 'Crear actualización'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
