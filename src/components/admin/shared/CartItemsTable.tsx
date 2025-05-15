import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { DownloadIcon, RefreshCw, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string;
  cart_id: string;
  item_id: string;
  item_type: string;
  quantity: number;
  item_name: string;
  item_price: number;
  total_price: number;
  user_id: string;
  business_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  created_at: string;
}

export function CartItemsTable() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);
  const { toast } = useToast();
  const { session, userRole } = useAuth();
  const maxRetries = 3;
  const requestInProgress = useRef<boolean>(false);

  // Verificar que el usuario tiene rol de administrador
  const isAdmin = userRole === 'admin';

  // Función simplificada para cargar los elementos del carrito directamente desde la vista
  const fetchCartItems = async () => {
    // Prevent multiple concurrent requests
    if (requestInProgress.current) {
      console.log("Request already in progress, skipping");
      return;
    }

    if (!isAdmin) {
      setError("Acceso denegado: Se requieren privilegios de administrador");
      setLoading(false);
      return;
    }
    
    if (!session?.access_token) {
      setError("No hay sesión activa. Por favor, inicia sesión nuevamente.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    requestInProgress.current = true;
    
    try {
      console.log("Consultando elementos del carrito usando la vista directamente");
      
      // Consultar directamente a la vista en lugar de usar una función
      const { data, error } = await supabase
        .from('admin_cart_items_view')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log("Datos recibidos desde la vista:", data?.length || 0, "elementos");
      setCartItems(data || []);
      
      if (retries > 0) {
        toast({
          title: "Conexión recuperada",
          description: "Los datos del carrito se han cargado correctamente",
        });
      }
      
    } catch (err: any) {
      console.error("Error al cargar los elementos del carrito:", err);
      setError(err instanceof Error ? err.message : 'Error desconocido');

      // Intentar de nuevo si no hemos excedido el número máximo de reintentos
      if (retries < maxRetries) {
        setRetries(prev => prev + 1);
        
        // Esperar un momento antes de reintentar
        setTimeout(() => {
          requestInProgress.current = false;
          fetchCartItems();
        }, 2000);
        return; // Exit early to prevent setting requestInProgress to false
      } else {
        toast({
          variant: "destructive",
          title: "Error persistente",
          description: "No se pueden cargar los datos del carrito. Comprueba tu conexión y permisos.",
        });
      }
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  };

  // Initial cart loading when component mounts
  useEffect(() => {
    if (session?.access_token) {
      fetchCartItems();
    }
  }, [session]);

  // Exportar a CSV
  const exportToCsv = () => {
    if (!cartItems.length) return;
    
    const headers = [
      'ID', 'Usuario', 'Email', 'Negocio', 'Tipo', 
      'Item', 'Precio', 'Cantidad', 'Total', 'Fecha'
    ];
    
    const rows = cartItems.map(item => [
      item.id,
      `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'N/A',
      item.email || 'N/A',
      item.business_name || 'N/A',
      item.item_type === 'pack' ? 'Pack' : 'Servicio',
      item.item_name || 'N/A',
      item.item_price,
      item.quantity,
      item.total_price,
      new Date(item.created_at).toLocaleString('es-ES')
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cart-items-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Si el usuario no es admin, mostrar mensaje de acceso denegado
  if (!isAdmin) {
    return (
      <Alert variant="destructive" className="mb-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No tienes permisos de administrador para ver esta información.
        </AlertDescription>
      </Alert>
    );
  }

  // Si no hay sesión activa, mostrar mensaje de inicio de sesión
  if (!session) {
    return (
      <Alert variant="destructive" className="mb-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Debes iniciar sesión para acceder a esta información.
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4"
            onClick={() => window.location.href = '/auth'}
          >
            Iniciar sesión
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Elementos en Carritos</h2>
        </div>
        
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <p className="font-medium">Error: {error}</p>
          <p className="text-sm mt-1">
            Asegúrate de tener permisos de administrador para ver esta información.
            {retries > 0 && (
              <span className="block mt-2">
                Intentando reconexión... ({retries}/{maxRetries})
              </span>
            )}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={() => {
              setRetries(0);
              fetchCartItems();
            }}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Si está cargando, mostrar esqueleto
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Elementos en Carritos</h2>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        
        {[1, 2].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Función para agrupar elementos por usuario
  const groupedCartItems = cartItems.reduce((groups, item) => {
    const key = item.user_id || 'unknown';
    if (!groups[key]) {
      groups[key] = {
        user: {
          id: item.user_id,
          email: item.email,
          business_name: item.business_name,
          first_name: item.first_name,
          last_name: item.last_name,
        },
        items: [],
        totalAmount: 0,
      };
    }
    groups[key].items.push(item);
    groups[key].totalAmount += item.total_price;
    return groups;
  }, {} as Record<string, { user: any, items: CartItem[], totalAmount: number }>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Elementos en Carritos</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchCartItems} 
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCsv}
            disabled={loading || cartItems.length === 0}
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="bg-muted p-8 text-center rounded-md">
          <p className="text-lg font-medium">No hay elementos en los carritos</p>
          <p className="text-muted-foreground mt-1">
            Los elementos aparecerán aquí cuando los usuarios agreguen productos a sus carritos.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.values(groupedCartItems).map((group) => (
            <Card key={group.user.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium">
                      {group.user.business_name || 'Cliente sin nombre'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {group.user.email} • 
                      {group.user.first_name || group.user.last_name ? 
                        ` ${group.user.first_name || ''} ${group.user.last_name || ''}`.trim() : 
                        ' No hay datos personales'}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {formatCurrency(group.totalAmount)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-center">Cantidad</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item_name || 'Desconocido'}</TableCell>
                        <TableCell>
                          <Badge variant={item.item_type === 'pack' ? 'default' : 'secondary'}>
                            {item.item_type === 'pack' ? 'Pack' : 'Servicio'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.item_price)}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.total_price)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}