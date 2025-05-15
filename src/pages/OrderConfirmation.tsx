import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Loader2, CalendarClock } from "lucide-react";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { getOrderWithItems } from "@/services/orderService";
import { createProjectFromOrder } from "@/services/projectService";
import { useAuth } from "@/contexts/AuthContext";

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectCreated, setProjectCreated] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [autoCreating, setAutoCreating] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.error("Debes iniciar sesión para ver este contenido");
      navigate("/");
      return;
    }
    
    if (orderId) {
      loadOrder(orderId);
    }
  }, [orderId, user]);

  const loadOrder = async (id: string) => {
    setLoading(true);
    try {
      const orderData = await getOrderWithItems(id);
      setOrder(orderData);
      
      // Generar un nombre de proyecto predeterminado
      if (orderData) {
        const packItem = orderData.items.find(item => item.item_type === 'pack');
        if (packItem && packItem.item_details) {
          const projectNameValue = `Proyecto ${packItem.item_details.name}`;
          setProjectName(projectNameValue);
          
          // Iniciar la creación automática del proyecto después de cargar la orden
          if (autoCreating && !projectCreated) {
            setAutoCreating(false); // Evitar múltiples creaciones
            setTimeout(() => {
              handleCreateProject(projectNameValue);
            }, 1500);
          }
        } else {
          setProjectName(`Proyecto Web ${new Date().toLocaleDateString()}`);
        }
      }
    } catch (error) {
      console.error("Error loading order:", error);
      toast.error("Error al cargar la información del pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (nameToUse = projectName) => {
    if (!orderId || !nameToUse.trim()) {
      toast.error("Por favor, proporciona un nombre para tu proyecto");
      return;
    }
    
    setCreatingProject(true);
    try {
      const newProjectId = await createProjectFromOrder(orderId, nameToUse);
      if (newProjectId) {
        setProjectCreated(true);
        setProjectId(newProjectId);
        toast.success("Proyecto creado con éxito");
        
        // Redirigir automáticamente después de 2 segundos
        setTimeout(() => {
          navigate(`/project/${newProjectId}`);
        }, 2000);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Error al crear el proyecto");
    } finally {
      setCreatingProject(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 md:py-8 px-4 max-w-4xl">
        <BreadcrumbNav />
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">¡Pedido realizado con éxito!</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Gracias por confiar en nosotros para tu proyecto web
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : order ? (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Resumen del pedido</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    #{orderId?.substring(0, 8)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Productos</h3>
                  <div className="space-y-3">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">
                            {item.item_details?.name || "Producto"}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-sm text-muted-foreground ml-2">
                              x{item.quantity}
                            </span>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {item.item_type === 'pack' ? 'Pack' : 'Servicio adicional'}
                          </p>
                        </div>
                        <span>{item.price_at_purchase}€</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{order.total_amount}€</span>
                  </div>
                  {order.installment_plan && (
                    <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                      <CalendarClock className="h-4 w-4" />
                      <span>
                        Pago en {order.installment_plan} plazos de {Math.ceil(order.total_amount / Number(order.installment_plan))}€/mes
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información del proyecto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectCreated ? (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                      <Check className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">¡Proyecto creado correctamente!</h3>
                    <p className="text-muted-foreground mb-4">
                      Tu proyecto ha sido creado y está listo para comenzar.
                    </p>
                    {projectId && (
                      <Button 
                        onClick={() => navigate(`/project/${projectId}`)}
                        className="gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Ver mi proyecto
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="project-name">Nombre del proyecto</Label>
                      <Input
                        id="project-name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Ej: Mi Nuevo Sitio Web"
                        className="max-w-md"
                      />
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        onClick={() => handleCreateProject()}
                        disabled={!projectName.trim() || creatingProject}
                        className="gap-2"
                      >
                        {creatingProject ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        {creatingProject ? "Creando proyecto..." : "Crear proyecto"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontró información del pedido</p>
            <Button onClick={() => navigate("/packs")} className="mt-4">
              Ver packs disponibles
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
