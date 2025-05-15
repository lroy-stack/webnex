import { create } from "zustand";
import { 
  getCartWithItems, 
  addPackToCart, 
  addServiceToCart,
  syncCartFromLocalToServer,
  updateCartItemQuantity,
  removeCartItem
} from "@/services/cartService";
import { CartItem } from "@/services/cartService";
import { toast } from "sonner";

interface CartState {
  items: CartItem[];
  total: number;
  totalWithInterest: number;
  itemCount: number;
  isLoading: boolean;
  isOpen: boolean;
  installmentPlan: string | null;
  fetchCart: () => Promise<void>;
  addPack: (packId: string) => Promise<boolean>;
  addService: (serviceId: string) => Promise<boolean>;
  setIsOpen: (isOpen: boolean) => void;
  setInstallmentPlan: (plan: string | null) => void;
  calculateInterest: (amount: number) => number;
  syncAnonymousCart: () => Promise<boolean>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  totalWithInterest: 0,
  itemCount: 0,
  isLoading: false,
  isOpen: false,
  installmentPlan: null,
  
  fetchCart: async () => {
    // Evitar múltiples solicitudes simultáneas
    if (get().isLoading) return;
    
    set({ isLoading: true });
    try {
      console.log("CartStore: Fetching cart data");
      const cartData = await getCartWithItems();
      if (cartData) {
        const itemCount = cartData.items.reduce((acc, item) => acc + item.quantity, 0);
        const totalWithInterest = get().calculateInterest(cartData.total);
        
        console.log(`CartStore: Cart updated with ${cartData.items.length} unique items (${itemCount} total)`);
        
        set({
          items: cartData.items,
          total: cartData.total,
          totalWithInterest,
          itemCount,
        });
      } else {
        console.log("CartStore: Empty cart or error fetching cart");
        set({ items: [], total: 0, totalWithInterest: 0, itemCount: 0 });
      }
    } catch (error) {
      console.error("CartStore Error: Error fetching cart:", error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Add pack with immediate state update
  addPack: async (packId: string) => {
    console.log(`CartStore: Adding pack ${packId} to cart`);
    const success = await addPackToCart(packId);
    if (success) {
      // Mostrar toast de confirmación aquí
      toast.success("Pack añadido al carrito");
      // Update cart state immediately after adding item
      await get().fetchCart();
    }
    return success;
  },
  
  // Add service with immediate state update
  addService: async (serviceId: string) => {
    console.log(`CartStore: Adding service ${serviceId} to cart`);
    const success = await addServiceToCart(serviceId);
    if (success) {
      // Mostrar toast de confirmación aquí
      toast.success("Servicio añadido al carrito");
      // Update cart state immediately after adding item
      await get().fetchCart();
    }
    return success;
  },
  
  // Actualizar la cantidad de un item directamente desde el store
  updateItemQuantity: async (itemId: string, quantity: number) => {
    const { items } = get();
    const itemIndex = items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) return false;
    
    try {
      // Actualización optimista: actualizar el estado primero
      const updatedItems = [...items];
      const oldQuantity = updatedItems[itemIndex].quantity;
      updatedItems[itemIndex] = { ...updatedItems[itemIndex], quantity };
      
      // Calcular nuevo total e itemCount
      const newItemCount = get().itemCount - oldQuantity + quantity;
      let newTotal = 0;
      
      updatedItems.forEach(item => {
        if (item.item_details) {
          newTotal += item.item_details.price * item.quantity;
        }
      });
      
      const newTotalWithInterest = get().calculateInterest(newTotal);
      
      // Actualizar el estado inmediatamente
      set({ 
        items: updatedItems, 
        total: newTotal, 
        totalWithInterest: newTotalWithInterest, 
        itemCount: newItemCount 
      });
      
      // Enviar la actualización al servidor en segundo plano
      const success = await updateCartItemQuantity(itemId, quantity);
      
      // Si falla la actualización en el servidor, volver al estado anterior
      if (!success) {
        console.error("Failed to update item quantity on server");
        // Volver a cargar el carrito para sincronizar con el servidor
        await get().fetchCart();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error updating item quantity:", error);
      // Volver a cargar el carrito para sincronizar con el servidor
      await get().fetchCart();
      return false;
    }
  },
  
  // Eliminar un item directamente desde el store
  removeItem: async (itemId: string) => {
    const { items } = get();
    const itemIndex = items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) return false;
    
    try {
      // Buscar el item a eliminar para guardar su información
      const itemToRemove = items[itemIndex];
      
      // Verificar si es el último pack y hay servicios
      if (itemToRemove.item_type === 'pack') {
        const packsCount = items.filter(i => i.item_type === 'pack').length;
        const hasServices = items.some(i => i.item_type === 'service');
        
        if (packsCount === 1 && hasServices) {
          if (!confirm("Si eliminas este pack, también se eliminarán todos los servicios del carrito. ¿Deseas continuar?")) {
            return false;
          }
          
          // Si confirma, eliminar del servidor y luego actualizar el estado
          const success = await removeCartItem(itemId);
          if (success) {
            // Actualizar completo tras eliminar para asegurar consistencia
            await get().fetchCart();
          }
          return success;
        }
      }
      
      // Actualización optimista para casos simples
      const updatedItems = items.filter(item => item.id !== itemId);
      let newTotal = 0;
      let newItemCount = 0;
      
      updatedItems.forEach(item => {
        if (item.item_details) {
          newTotal += item.item_details.price * item.quantity;
          newItemCount += item.quantity;
        }
      });
      
      const newTotalWithInterest = get().calculateInterest(newTotal);
      
      // Actualizar el estado inmediatamente
      set({ 
        items: updatedItems, 
        total: newTotal, 
        totalWithInterest: newTotalWithInterest, 
        itemCount: newItemCount 
      });
      
      // Enviar la eliminación al servidor en segundo plano
      const success = await removeCartItem(itemId);
      
      // Si falla la eliminación en el servidor, volver a cargar el carrito
      if (!success) {
        console.error("Failed to remove item on server");
        await get().fetchCart();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error removing item:", error);
      await get().fetchCart();
      return false;
    }
  },
  
  setIsOpen: (isOpen) => set({ isOpen }),
  
  setInstallmentPlan: (plan) => {
    console.log(`CartStore: Setting installment plan to ${plan}`);
    set({ installmentPlan: plan });
    const totalWithInterest = get().calculateInterest(get().total);
    set({ totalWithInterest });
  },
  
  calculateInterest: (amount) => {
    const { installmentPlan } = get();
    if (!installmentPlan) return amount;
    
    const interestRates: Record<string, number> = {
      "3": 1.08, // 8% de interés
      "6": 1.12, // 12% de interés
      "12": 1.15, // 15% de interés
    };
    
    return Math.round(amount * (interestRates[installmentPlan] || 1));
  },
  
  syncAnonymousCart: async () => {
    console.log("CartStore: Syncing anonymous cart to server");
    const result = await syncCartFromLocalToServer();
    if (result) {
      await get().fetchCart();
    }
    return result;
  }
}));
