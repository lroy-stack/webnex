
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Check,
  CreditCard,
  Calendar,
  Loader2,
  LogIn,
} from "lucide-react";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { createOrderFromCart } from "@/services/orderService";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthStore } from "@/contexts/AuthContext";
import { useCartStore } from "@/store/useCartStore";
import { formatCurrency } from "@/lib/utils";

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openAuthModal } = useAuthStore();
  const [processingOrder, setProcessingOrder] = useState(false);
  const [installmentPlan, setInstallmentPlan] = useState<string | null>(null);
  
  // Usar el estado del carrito desde el store global
  const { 
    items, 
    total, 
    totalWithInterest, 
    isLoading, 
    fetchCart, 
    calculateInterest,
    updateItemQuantity,
    removeItem,
    setInstallmentPlan: setStorePlan 
  } = useCartStore();
  
  // Mantener sincronizado el plan de cuotas entre el componente y el store
  useEffect(() => {
    setStorePlan(installmentPlan);
  }, [installmentPlan, setStorePlan]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Función controlada para evitar recargas de página al cambiar cantidades
  const handleQuantityChange = async (itemId: string, newQuantity: number, event?: React.FormEvent) => {
    // Prevenir el comportamiento predeterminado del formulario si se proporciona un evento
    if (event) {
      event.preventDefault();
    }
    
    // No actualizar si la cantidad es menor a 1
    if (newQuantity < 1) return;
    
    // Usar la función del store para actualizar la cantidad
    const success = await updateItemQuantity(itemId, newQuantity);
    if (!success) {
      toast.error("Error al actualizar la cantidad");
    }
  };

  // Función para manejar la eliminación de items
  const handleRemoveItem = async (itemId: string) => {
    const success = await removeItem(itemId);
    if (!success) {
      toast.error("Error al eliminar el producto");
    }
  };

  const handleCheckout = async () => {
    if (!items || items.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    // Verificar que haya al menos un pack en el carrito
    const hasPack = items.some(item => item.item_type === 'pack');
    if (!hasPack) {
      toast.error("Debes incluir al menos un pack en tu compra");
      return;
    }

    // Si el usuario no está autenticado, mostrar el modal de autenticación
    if (!user) {
      toast.info("Debes iniciar sesión para finalizar la compra");
      openAuthModal();
      return;
    }

    setProcessingOrder(true);
    try {
      const orderId = await createOrderFromCart('credit_card', installmentPlan);
      if (orderId) {
        toast.success("Pedido realizado con éxito");
        navigate(`/order-confirmation/${orderId}`);
      }
    } catch (error) {
      console.error("Error processing order:", error);
      toast.error("Error al procesar el pedido");
    } finally {
      setProcessingOrder(false);
    }
  };

  const handleLogin = () => {
    openAuthModal();
  };
  
  // Calcular el monto por cuota
  const calculateMonthlyAmount = (): number => {
    if (!installmentPlan || !total) return 0;
    return Math.ceil(totalWithInterest / parseInt(installmentPlan));
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 md:py-8 px-4 max-w-5xl">
        <BreadcrumbNav />
        
        <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Tu Carrito</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {!user && (
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 mb-6 shadow-md">
                  <div className="flex items-start">
                    <div className="mr-3 text-amber-600 dark:text-amber-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-300">
                        Inicia sesión para finalizar la compra
                      </p>
                      <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                        Para completar tu compra, necesitas iniciar sesión o crear una cuenta.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleLogin}
                        className="mt-3 bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/20 dark:to-amber-800/20 hover:bg-amber-100 dark:hover:bg-amber-800/30 border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 gap-2"
                      >
                        <LogIn className="h-4 w-4" />
                        Iniciar sesión
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/30">
                <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/20 pb-4">
                  <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
                    <ShoppingCart className="h-5 w-5" />
                    Productos ({items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {items.map((item) => (
                    <div 
                      key={item.id}
                      className="border-b border-purple-100 dark:border-purple-900/50 last:border-0 pb-4 last:pb-0 rounded-lg transition-all hover:bg-purple-50/50 dark:hover:bg-purple-900/20 p-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-purple-900 dark:text-purple-200">{item.item_details?.name || "Producto"}</h3>
                          <p className="text-sm text-purple-600 dark:text-purple-400">
                            {item.item_type === 'pack' ? 'Pack' : 'Servicio adicional'}
                          </p>
                          <div className="mt-1">
                            <span className="font-semibold text-purple-700 dark:text-purple-300">
                              {formatCurrency(item.item_details?.price || 0)}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-sm text-purple-500 dark:text-purple-400 ml-1">
                                x{item.quantity}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center border border-purple-200 dark:border-purple-800 rounded-md shadow-sm bg-white dark:bg-purple-900/30">
                            <Button
                              type="button" 
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-r-none text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 hover:bg-purple-100 dark:hover:bg-purple-800"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            
                            <form 
                              onSubmit={(e) => handleQuantityChange(item.id, parseInt((e.target as HTMLFormElement).quantity.value) || 1, e)}
                              className="inline-flex"
                            >
                              <Input
                                name="quantity"
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                className="w-12 h-8 text-center p-0 border-y-0 border-x rounded-none bg-transparent"
                                min={1}
                              />
                            </form>
                            
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-l-none text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 hover:bg-purple-100 dark:hover:bg-purple-800"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Advertencia si está eliminando el único pack y hay servicios */}
                      {item.item_type === 'pack' &&
                        items.filter(i => i.item_type === 'pack').length === 1 &&
                        items.some(i => i.item_type === 'service') && (
                        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-sm rounded-md border border-amber-200 dark:border-amber-800/50">
                          <p>Si eliminas este pack, también se eliminarán todos los servicios del carrito.</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950/30">
                <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/20 pb-4">
                  <CardTitle className="text-blue-800 dark:text-blue-300">Resumen del pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex justify-between text-blue-700 dark:text-blue-300">
                    <span>Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  
                  {installmentPlan && (
                    <div className="flex justify-between text-blue-700 dark:text-blue-300">
                      <span>Interés ({installmentPlan === "3" ? "8%" : installmentPlan === "6" ? "12%" : "15%"})</span>
                      <span>+{formatCurrency(totalWithInterest - total)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-blue-100 dark:border-blue-900/50 text-blue-800 dark:text-blue-200">
                    <span>Total</span>
                    <span>{formatCurrency(totalWithInterest)}</span>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-300">Opciones de pago</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        type="button"
                        variant={installmentPlan === null ? "default" : "outline"} 
                        className={`flex flex-col py-4 h-auto gap-1 ${
                          installmentPlan === null 
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0" 
                            : "border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        }`}
                        onClick={() => setInstallmentPlan(null)}
                      >
                        <CreditCard className="h-5 w-5" />
                        <span>Pago único</span>
                        <span className="text-sm font-normal">{formatCurrency(total)}</span>
                      </Button>
                      
                      <Button 
                        type="button"
                        variant={installmentPlan === "3" ? "default" : "outline"} 
                        className={`flex flex-col py-4 h-auto gap-1 ${
                          installmentPlan === "3" 
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0" 
                            : "border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        }`}
                        onClick={() => setInstallmentPlan("3")}
                      >
                        <Calendar className="h-5 w-5" />
                        <span>3 plazos</span>
                        <span className="text-sm font-normal">{formatCurrency(calculateMonthlyAmount())}/mes</span>
                        <span className="text-xs text-blue-600 dark:text-blue-400">+8% interés</span>
                      </Button>
                      
                      <Button 
                        type="button"
                        variant={installmentPlan === "6" ? "default" : "outline"} 
                        className={`flex flex-col py-4 h-auto gap-1 ${
                          installmentPlan === "6" 
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0" 
                            : "border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        }`}
                        onClick={() => setInstallmentPlan("6")}
                      >
                        <Calendar className="h-5 w-5" />
                        <span>6 plazos</span>
                        <span className="text-sm font-normal">{formatCurrency(calculateMonthlyAmount())}/mes</span>
                        <span className="text-xs text-blue-600 dark:text-blue-400">+12% interés</span>
                      </Button>
                      
                      <Button 
                        type="button"
                        variant={installmentPlan === "12" ? "default" : "outline"} 
                        className={`flex flex-col py-4 h-auto gap-1 ${
                          installmentPlan === "12" 
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0" 
                            : "border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        }`}
                        onClick={() => setInstallmentPlan("12")}
                      >
                        <Calendar className="h-5 w-5" />
                        <span>12 plazos</span>
                        <span className="text-sm font-normal">{formatCurrency(calculateMonthlyAmount())}/mes</span>
                        <span className="text-xs text-blue-600 dark:text-blue-400">+15% interés</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 pt-4">
                  <Button 
                    type="button"
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all" 
                    size="lg"
                    onClick={handleCheckout}
                    disabled={processingOrder}
                  >
                    {processingOrder ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {!user ? "Iniciar sesión para finalizar" : "Finalizar compra"}
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Información adicional sobre pagos */}
              <div className="mt-4 bg-white dark:bg-gray-800/50 rounded-lg p-4 shadow-md text-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Información de pago</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Pagos seguros con cifrado SSL</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Aceptamos tarjetas de crédito y débito</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Sin cargos ocultos ni sorpresas</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/30 rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/30">
            <div className="bg-purple-100 dark:bg-purple-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-10 w-10 text-purple-500 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-purple-800 dark:text-purple-300">Tu carrito está vacío</h2>
            <p className="text-purple-600 dark:text-purple-400 mb-6 max-w-md mx-auto">
              Añade packs o servicios para comenzar tu proyecto
            </p>
            <Button 
              type="button"
              onClick={() => navigate("/packs")}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-md hover:shadow-lg transition-all"
            >
              Ver packs disponibles
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;
