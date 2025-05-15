import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { 
  Table, 
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { Loader2, Trash2, UserX, AlertTriangle, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ClientInfo {
  id: string;
  user_id: string;
  email: string;
  business_name: string | null;
  first_name: string | null;
  last_name: string | null;
  onboarding_completed: boolean;
}

export const UserManagement: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClientInfo | null>(null);
  const [searchResults, setSearchResults] = useState<ClientInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Búsqueda de clientes por email o nombre de negocio
  const searchClients = async () => {
    if (!searchTerm) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('client_profiles_with_email')
        .select('*')
        .or(`email.ilike.%${searchTerm}%,business_name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
        .limit(5);
      
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching clients:", error);
      toast.error("Error al buscar clientes");
    } finally {
      setIsSearching(false);
    }
  };
  
  // Seleccionar un usuario para eliminar
  const selectUserForDeletion = (user: ClientInfo) => {
    setSelectedUser(user);
    setUserId(user.user_id);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteUser = async () => {
    if (!userId.trim()) {
      toast.error('Por favor, introduce un ID de usuario válido');
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Limpiar el ID de usuario (eliminar espacios)
      const cleanedUserId = userId.trim();
      
      // Llamar a la Edge Function para eliminar el usuario
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: cleanedUserId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || `Error: ${response.status}`);
      }
      
      const result = await response.json();
      toast.success(result.message || 'Usuario eliminado con éxito');
      setUserId('');
      setSelectedUser(null);
      setIsDeleteDialogOpen(false);
      
      // Actualizar la lista de resultados eliminando el usuario eliminado
      setSearchResults(prevResults => prevResults.filter(user => user.user_id !== cleanedUserId));
      
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(`Error al eliminar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Cargar clientes recientes al montar el componente
  useEffect(() => {
    const loadRecentClients = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('client_profiles_with_email')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error("Error loading recent clients:", error);
        toast.error("Error al cargar clientes recientes");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecentClients();
  }, []);
  
  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-destructive" />
            Gestión de Usuarios
          </CardTitle>
          <CardDescription>
            Buscar y eliminar usuarios del sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Búsqueda de usuarios */}
          <div className="space-y-2">
            <Label htmlFor="search-user">Buscar Usuario</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="search-user" 
                  placeholder="Email, nombre o empresa" 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchClients()}
                />
              </div>
              <Button 
                onClick={searchClients} 
                disabled={isSearching || !searchTerm}
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const { data, error } = await supabase
                      .from('client_profiles_with_email')
                      .select('*')
                      .order('created_at', { ascending: false })
                      .limit(10);
                    
                    if (error) throw error;
                    setSearchResults(data || []);
                    setSearchTerm('');
                  } catch (error) {
                    toast.error("Error al recargar usuarios");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                title="Recargar usuarios recientes"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Tabla de resultados */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nombre/Empresa</TableHead>
                  <TableHead>ID de Usuario</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      <span className="mt-2 block text-sm text-muted-foreground">Cargando usuarios...</span>
                    </TableCell>
                  </TableRow>
                ) : searchResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center p-4">
                      <p className="text-muted-foreground">No se encontraron usuarios.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  searchResults.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        {user.business_name || (
                          user.first_name || user.last_name ? 
                            `${user.first_name || ''} ${user.last_name || ''}`.trim() : 
                            'Sin nombre'
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {user.user_id}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => selectUserForDeletion(user)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Eliminar por ID (alternativa) */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-sm font-medium mb-2">Eliminar por ID de Usuario</h3>
            <div className="space-y-2">
              <Label htmlFor="user-id">ID del Usuario</Label>
              <Input 
                id="user-id" 
                placeholder="e0f7278a-29ea-411a-8976-fac97cdfe921" 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Introduce el ID UUID del usuario que deseas eliminar
              </p>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 p-4 rounded-md flex gap-3 items-start mt-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Advertencia</p>
                <p className="text-sm mt-1">
                  Esta acción eliminará permanentemente al usuario y todos sus datos asociados.
                  El usuario no podrá iniciar sesión de nuevo y se perderán todos sus datos.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={!userId.trim()}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Usuario
          </Button>
        </CardFooter>
      </Card>
      
      {/* Diálogo de confirmación */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente al usuario 
              {selectedUser ? ` ${selectedUser.email}` : ''} con ID:
              <code className="block mt-2 p-2 bg-muted rounded-md text-xs font-mono break-all">
                {userId}
              </code>
              <p className="mt-2 font-semibold text-destructive">
                Todos sus datos, proyectos, conversaciones y registros asociados serán eliminados.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteUser();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Sí, eliminar usuario'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};