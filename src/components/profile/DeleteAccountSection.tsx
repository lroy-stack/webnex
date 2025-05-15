
import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, Trash2 } from "lucide-react";

export const DeleteAccountSection: React.FC = () => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { deleteAccount } = useAuth();

  const handleDeleteAccount = async () => {
    if (!password) {
      toast({
        title: "Contraseña requerida",
        description: "Por favor, introduce tu contraseña para confirmar",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await deleteAccount(reason);
      
      if (error) throw error;
      
      toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada correctamente. Serás redirigido al inicio.",
      });

      // La redirección es automática debido a que `deleteAccount` llama a `signOut`
      
    } catch (error) {
      console.error("Error al eliminar la cuenta:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la cuenta. Por favor intenta nuevamente más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsConfirmDialogOpen(false);
    }
  };

  return (
    <>
      <div className="space-y-4 border-t pt-6">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h3 className="text-lg font-medium text-destructive">Eliminar cuenta</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Eliminar tu cuenta es una acción permanente. Todos tus datos serán borrados 
          y no podrás recuperarlos. Sin embargo, podrás registrarte nuevamente con 
          el mismo correo electrónico si lo deseas.
        </p>
        <Button 
          variant="destructive" 
          onClick={() => setIsConfirmDialogOpen(true)}
        >
          Eliminar mi cuenta
        </Button>
      </div>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Tu cuenta será eliminada permanentemente
              y todos tus datos asociados serán borrados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <label htmlFor="delete-reason" className="text-sm font-medium">
                ¿Hay alguna razón por la que deseas eliminar tu cuenta? (opcional)
              </label>
              <Textarea
                id="delete-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Cuéntanos por qué te vas..."
                className="mt-1"
              />
            </div>
            
            <div>
              <label htmlFor="delete-confirm-password" className="text-sm font-medium">
                Ingresa tu contraseña para confirmar
              </label>
              <Input
                id="delete-confirm-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="mt-1"
                required
              />
            </div>
            
            <div className="flex items-center p-3 text-sm border rounded-md bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-500 mr-2 flex-shrink-0" />
              <p className="text-amber-800">
                Si eliminas tu cuenta, podrás registrarte nuevamente con el mismo correo electrónico en el futuro.
              </p>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Sí, eliminar mi cuenta"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
