
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pack } from "./packService";
import { ServiceModule } from "./serviceModule";

export interface CartItem {
  id: string;
  cart_id: string;
  item_type: 'pack' | 'service';
  item_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  item_details?: Pack | ServiceModule;
}

interface CartSummary {
  id: string;
  total: number;
  items: CartItem[];
}

// Claves para el carrito anónimo
const ANONYMOUS_CART_ID = "anonymous-cart-id";
const ANONYMOUS_CART_ITEMS = "anonymous-cart-items";

// Debug logs
const DEBUG = true;
const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[Cart Debug] ${message}`, data || '');
  }
};

// Función para forzar la sincronización del carrito entre local y servidor
export const syncCartFromLocalToServer = async (): Promise<boolean> => {
  try {
    debugLog("Intentando sincronizar carrito local con servidor");
    // Verificar si hay un carrito anónimo para migrar
    const anonymousCartId = localStorage.getItem(ANONYMOUS_CART_ID);
    const anonymousItemsStr = localStorage.getItem(ANONYMOUS_CART_ITEMS);
    
    if (!anonymousCartId || !anonymousItemsStr) {
      debugLog("No hay carrito anónimo para sincronizar");
      return false;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      debugLog("No hay usuario autenticado para sincronizar el carrito");
      return false;
    }
    
    return await migrateAnonymousCartToUser();
  } catch (error) {
    console.error("Error syncing cart:", error);
    return false;
  }
};

// Limpiar carritos duplicados para un usuario
export const cleanupDuplicateCarts = async (userId: string): Promise<string | null> => {
  try {
    debugLog(`Limpiando carritos duplicados para usuario: ${userId}`);
    
    // Obtener todos los carritos del usuario ordenados por fecha (más reciente primero)
    const { data: carts, error } = await supabase
      .from('shopping_cart')
      .select('id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching user carts:", error);
      return null;
    }
    
    debugLog(`Encontrados ${carts?.length || 0} carritos para el usuario`);
    
    if (!carts || carts.length === 0) {
      return null;
    }
    
    // Conservar solo el carrito más reciente
    const latestCartId = carts[0].id;
    
    // Si hay más de un carrito, eliminar los antiguos después de migrar sus items
    if (carts.length > 1) {
      debugLog(`Migrando items de ${carts.length - 1} carritos antiguos al más reciente: ${latestCartId}`);
      
      // Para cada carrito antiguo
      for (let i = 1; i < carts.length; i++) {
        const oldCartId = carts[i].id;
        
        // Obtener sus items
        const { data: oldItems } = await supabase
          .from('shopping_cart_items')
          .select('*')
          .eq('cart_id', oldCartId);
        
        if (oldItems && oldItems.length > 0) {
          debugLog(`Migrando ${oldItems.length} items del carrito ${oldCartId}`);
          
          // Para cada item, verificar si ya existe en el nuevo carrito
          for (const item of oldItems) {
            const { data: existingItem } = await supabase
              .from('shopping_cart_items')
              .select('id, quantity')
              .eq('cart_id', latestCartId)
              .eq('item_type', item.item_type)
              .eq('item_id', item.item_id)
              .single();
            
            if (existingItem) {
              // Si ya existe, sumar las cantidades
              await supabase
                .from('shopping_cart_items')
                .update({ quantity: existingItem.quantity + item.quantity })
                .eq('id', existingItem.id);
            } else {
              // Si no existe, crear un nuevo item en el carrito actual
              await supabase
                .from('shopping_cart_items')
                .insert({
                  cart_id: latestCartId,
                  item_type: item.item_type,
                  item_id: item.item_id,
                  quantity: item.quantity
                });
            }
          }
        }
        
        // Eliminar el carrito antiguo y sus items (en cascada)
        await supabase
          .from('shopping_cart_items')
          .delete()
          .eq('cart_id', oldCartId);
        
        await supabase
          .from('shopping_cart')
          .delete()
          .eq('id', oldCartId);
          
        debugLog(`Carrito antiguo eliminado: ${oldCartId}`);
      }
    }
    
    return latestCartId;
  } catch (error) {
    console.error("Error cleaning up duplicate carts:", error);
    return null;
  }
};

// Función específica para migrar el carrito anónimo al autenticado cuando un usuario inicia sesión
export const migrateAnonymousCartToUser = async (): Promise<boolean> => {
  try {
    debugLog("Iniciando migración de carrito anónimo a autenticado");
    // Verificar si hay un carrito anónimo para migrar
    const anonymousCartId = localStorage.getItem(ANONYMOUS_CART_ID);
    const anonymousItemsStr = localStorage.getItem(ANONYMOUS_CART_ITEMS);
    
    if (!anonymousCartId || !anonymousItemsStr) {
      debugLog("No hay carrito anónimo para migrar");
      return false;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      debugLog("No hay usuario autenticado para migrar el carrito");
      return false;
    }
    
    debugLog("Migrando carrito anónimo a usuario autenticado");
    
    // Primero limpiar carritos duplicados y obtener el ID del carrito único
    let userCartId = await cleanupDuplicateCarts(user.id);
    
    if (!userCartId) {
      // Si no hay carrito, crear uno nuevo
      const { data: newCart, error } = await supabase
        .from('shopping_cart')
        .insert({
          user_id: user.id
        })
        .select('id')
        .single();
      
      if (error) {
        console.error("Error creating cart during migration:", error);
        return false;
      }
      
      userCartId = newCart.id;
      debugLog(`Nuevo carrito creado: ${userCartId}`);
    }
    
    // Migrar los items
    const items = JSON.parse(anonymousItemsStr);
    if (!items.length) {
      debugLog("El carrito anónimo está vacío");
      return false;
    }
    
    let migratedItems = 0;
    
    // Migrar cada item al carrito autenticado
    for (const item of items) {
      if (item.item_type === 'pack') {
        await addPackToCart(item.item_id, false, userCartId);
        migratedItems++;
      } else if (item.item_type === 'service') {
        await addServiceToCart(item.item_id, false, userCartId);
        migratedItems++;
      }
    }
    
    // Limpiar el carrito anónimo después de migrar
    localStorage.removeItem(ANONYMOUS_CART_ITEMS);
    localStorage.removeItem(ANONYMOUS_CART_ID);
    
    // Notificar solo si se migraron items
    if (migratedItems > 0) {
      debugLog(`Carrito sincronizado con ${migratedItems} productos`);
      toast.success(`Carrito sincronizado correctamente (${migratedItems} productos)`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error migrating anonymous cart to user:", error);
    return false;
  }
};

// Crear un carrito para el usuario actual o retornar el existente, o usar un carrito anónimo
export const getOrCreateCart = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Si no hay usuario, usar el carrito anónimo
    if (!user) {
      debugLog("Usuario no autenticado, usando carrito anónimo");
      // Crear un ID para el carrito anónimo si no existe
      let anonymousCartId = localStorage.getItem(ANONYMOUS_CART_ID);
      if (!anonymousCartId) {
        anonymousCartId = `anonymous-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem(ANONYMOUS_CART_ID, anonymousCartId);
        // Inicializar el carrito vacío
        localStorage.setItem(ANONYMOUS_CART_ITEMS, JSON.stringify([]));
        debugLog("Carrito anónimo creado:", anonymousCartId);
      }
      return anonymousCartId;
    }

    debugLog("Usuario autenticado, buscando carrito existente");
    
    // Para usuarios autenticados, primero limpiar carritos duplicados
    const existingCartId = await cleanupDuplicateCarts(user.id);
    
    if (existingCartId) {
      debugLog("Usando carrito existente:", existingCartId);
      return existingCartId;
    }

    debugLog("Creando nuevo carrito para usuario autenticado");
    // Crear un nuevo carrito si no existe
    const { data: newCart, error } = await supabase
      .from('shopping_cart')
      .insert({
        user_id: user.id
      })
      .select('id')
      .single();

    if (error) {
      console.error("Error creating cart:", error);
      toast.error("No se pudo crear el carrito de compras");
      return null;
    }

    debugLog("Nuevo carrito creado:", newCart.id);
    return newCart?.id || null;
  } catch (error) {
    console.error("Error in getOrCreateCart:", error);
    toast.error("Error al acceder al carrito de compras");
    return null;
  }
};

// Obtener el contenido del carrito con detalles
export const getCartWithItems = async (): Promise<CartSummary | null> => {
  try {
    const cartId = await getOrCreateCart();
    if (!cartId) return null;

    // Verificar si es un carrito anónimo
    const isAnonymousCart = cartId.startsWith('anonymous-');
    debugLog(`Obteniendo contenido del carrito: ${cartId} (${isAnonymousCart ? 'anónimo' : 'autenticado'})`);

    if (isAnonymousCart) {
      // Manejar carrito anónimo desde localStorage
      const anonymousItemsStr = localStorage.getItem(ANONYMOUS_CART_ITEMS) || '[]';
      const anonymousItems = JSON.parse(anonymousItemsStr);
      
      debugLog(`Carrito anónimo contiene ${anonymousItems.length} items`);
      
      // Si no hay items, retornar carrito vacío
      if (anonymousItems.length === 0) {
        return {
          id: cartId,
          total: 0,
          items: []
        };
      }

      // Obtener información de packs y servicios
      const packIds = anonymousItems
        .filter((item: any) => item.item_type === 'pack')
        .map((item: any) => item.item_id);
      
      const serviceIds = anonymousItems
        .filter((item: any) => item.item_type === 'service')
        .map((item: any) => item.item_id);

      let packs: any[] = [];
      let services: any[] = [];

      // Obtener detalles de los packs
      if (packIds.length > 0) {
        const { data: packsData } = await supabase
          .from('my_packs')
          .select('*')
          .in('id', packIds);
        
        packs = packsData || [];
        debugLog(`Recuperados ${packs.length} packs`);
      }

      // Obtener detalles de los servicios
      if (serviceIds.length > 0) {
        const { data: servicesData } = await supabase
          .from('my_services')
          .select('*')
          .in('id', serviceIds);
        
        services = servicesData || [];
        debugLog(`Recuperados ${services.length} servicios`);
      }

      // Calcular el total y añadir detalles a cada item
      let total = 0;
      const itemsWithDetails = anonymousItems.map((item: any) => {
        let itemDetails;
        
        if (item.item_type === 'pack') {
          itemDetails = packs.find(pack => pack.id === item.item_id);
        } else {
          itemDetails = services.find(service => service.id === item.item_id);
        }
        
        if (itemDetails) {
          total += itemDetails.price * item.quantity;
        }
        
        return {
          ...item,
          item_type: item.item_type as 'pack' | 'service',
          item_details: itemDetails
        };
      });

      return {
        id: cartId,
        total,
        items: itemsWithDetails
      };
    } else {
      // Manejar carrito autenticado desde la base de datos
      debugLog("Recuperando items del carrito desde Supabase");
      
      // Obtener items del carrito
      const { data: cartItems, error } = await supabase
        .from('shopping_cart_items')
        .select('*')
        .eq('cart_id', cartId);

      if (error) {
        console.error("Error fetching cart items:", error);
        toast.error("Error al cargar los productos del carrito");
        return null;
      }

      debugLog(`Carrito autenticado contiene ${cartItems?.length || 0} items`);

      // Si no hay items, retornar carrito vacío
      if (!cartItems || cartItems.length === 0) {
        return {
          id: cartId,
          total: 0,
          items: []
        };
      }

      // Obtener detalles de los packs en el carrito
      const packIds = cartItems
        .filter(item => item.item_type === 'pack')
        .map(item => item.item_id);

      const serviceIds = cartItems
        .filter(item => item.item_type === 'service')
        .map(item => item.item_id);

      let packs: any[] = [];
      let services: any[] = [];

      // Obtener detalles de los packs si hay alguno
      if (packIds.length > 0) {
        const { data: packsData } = await supabase
          .from('my_packs')
          .select('*')
          .in('id', packIds);
        
        packs = packsData || [];
        debugLog(`Recuperados ${packs.length} packs`);
      }

      // Obtener detalles de los servicios si hay alguno
      if (serviceIds.length > 0) {
        const { data: servicesData } = await supabase
          .from('my_services')
          .select('*')
          .in('id', serviceIds);
        
        services = servicesData || [];
        debugLog(`Recuperados ${services.length} servicios`);
      }

      // Calcular el total y añadir detalles a cada item
      let total = 0;
      const itemsWithDetails: CartItem[] = cartItems.map(item => {
        let itemDetails;
        
        if (item.item_type === 'pack') {
          itemDetails = packs.find(pack => pack.id === item.item_id);
        } else {
          itemDetails = services.find(service => service.id === item.item_id);
        }
        
        if (itemDetails) {
          total += itemDetails.price * item.quantity;
        }
        
        return {
          ...item,
          item_type: item.item_type as 'pack' | 'service',
          item_details: itemDetails
        };
      });

      return {
        id: cartId,
        total,
        items: itemsWithDetails
      };
    }
  } catch (error) {
    console.error("Error in getCartWithItems:", error);
    toast.error("Error al cargar el carrito de compras");
    return null;
  }
};

// Añadir un pack al carrito
export const addPackToCart = async (packId: string, shouldToast: boolean = true, forcedCartId?: string): Promise<boolean> => {
  try {
    debugLog(`Añadiendo pack: ${packId} al carrito`);
    const cartId = forcedCartId || await getOrCreateCart();
    if (!cartId) return false;

    // Verificar si es un carrito anónimo
    const isAnonymousCart = cartId.startsWith('anonymous-');
    debugLog(`Usando carrito ${cartId} (${isAnonymousCart ? 'anónimo' : 'autenticado'})`);

    if (isAnonymousCart) {
      // Añadir al carrito anónimo en localStorage
      const anonymousItemsStr = localStorage.getItem(ANONYMOUS_CART_ITEMS) || '[]';
      const anonymousItems = JSON.parse(anonymousItemsStr);
      
      // Verificar si ya existe el pack en el carrito
      const existingItemIndex = anonymousItems.findIndex((item: any) => 
        item.item_type === 'pack' && item.item_id === packId
      );
      
      if (existingItemIndex >= 0) {
        // Si ya existe, incrementar la cantidad
        anonymousItems[existingItemIndex].quantity += 1;
        debugLog(`Pack ya existe, incrementada cantidad a ${anonymousItems[existingItemIndex].quantity}`);
      } else {
        // Si no existe, añadir nuevo item
        anonymousItems.push({
          id: `anon-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          cart_id: cartId,
          item_type: 'pack',
          item_id: packId,
          quantity: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        debugLog("Nuevo pack añadido al carrito anónimo");
      }
      
      // Guardar en localStorage
      localStorage.setItem(ANONYMOUS_CART_ITEMS, JSON.stringify(anonymousItems));
      
      if (shouldToast) toast.success("Pack añadido al carrito");
      return true;
    } else {
      // Para carrito autenticado: usar la base de datos
      // Verificar si ya existe el pack en el carrito
      const { data: existingItem, error: fetchError } = await supabase
        .from('shopping_cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('item_type', 'pack')
        .eq('item_id', packId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking if pack exists in cart:", fetchError);
        return false;
      }

      if (existingItem) {
        debugLog(`Pack ya existe en carrito, incrementando cantidad de ${existingItem.quantity} a ${existingItem.quantity + 1}`);
        // Si ya existe, incrementar la cantidad
        const { error: updateError } = await supabase
          .from('shopping_cart_items')
          .update({ quantity: existingItem.quantity + 1, updated_at: new Date().toISOString() })
          .eq('id', existingItem.id);

        if (updateError) {
          console.error("Error updating cart item:", updateError);
          toast.error("No se pudo actualizar el carrito");
          return false;
        }
      } else {
        debugLog("Añadiendo nuevo pack al carrito en base de datos");
        // Si no existe, añadir nuevo item
        const { error: insertError } = await supabase
          .from('shopping_cart_items')
          .insert({
            cart_id: cartId,
            item_type: 'pack',
            item_id: packId,
            quantity: 1
          });

        if (insertError) {
          console.error("Error adding item to cart:", insertError);
          toast.error("No se pudo añadir el pack al carrito");
          return false;
        }
      }

      if (shouldToast) toast.success("Pack añadido al carrito");
      return true;
    }
  } catch (error) {
    console.error("Error in addPackToCart:", error);
    toast.error("Error al añadir el pack al carrito");
    return false;
  }
};

// Añadir un servicio al carrito
export const addServiceToCart = async (serviceId: string, shouldToast: boolean = true, forcedCartId?: string): Promise<boolean> => {
  try {
    debugLog(`Añadiendo servicio: ${serviceId} al carrito`);
    const cart = await getCartWithItems();
    if (!cart) return false;

    // Verificar si es un carrito anónimo
    const isAnonymousCart = cart.id.startsWith('anonymous-');
    debugLog(`Usando carrito ${cart.id} (${isAnonymousCart ? 'anónimo' : 'autenticado'})`);
    
    // Verificar si hay un pack en el carrito
    const hasPack = cart.items.some(item => item.item_type === 'pack');
    if (!hasPack) {
      toast.error("Primero debes añadir un pack al carrito");
      return false;
    }

    const cartId = forcedCartId || cart.id;

    if (isAnonymousCart) {
      // Añadir al carrito anónimo en localStorage
      const anonymousItemsStr = localStorage.getItem(ANONYMOUS_CART_ITEMS) || '[]';
      const anonymousItems = JSON.parse(anonymousItemsStr);
      
      // Verificar si ya existe el servicio en el carrito
      const existingItemIndex = anonymousItems.findIndex((item: any) => 
        item.item_type === 'service' && item.item_id === serviceId
      );
      
      if (existingItemIndex >= 0) {
        // Si ya existe, incrementar la cantidad
        anonymousItems[existingItemIndex].quantity += 1;
        debugLog(`Servicio ya existe, incrementada cantidad a ${anonymousItems[existingItemIndex].quantity}`);
      } else {
        // Si no existe, añadir nuevo item
        anonymousItems.push({
          id: `anon-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          cart_id: cartId,
          item_type: 'service',
          item_id: serviceId,
          quantity: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        debugLog("Nuevo servicio añadido al carrito anónimo");
      }
      
      // Guardar en localStorage
      localStorage.setItem(ANONYMOUS_CART_ITEMS, JSON.stringify(anonymousItems));
      
      if (shouldToast) toast.success("Servicio añadido al carrito");
      return true;
    } else {
      // Para carrito autenticado: usar la base de datos
      // Verificar si ya existe el servicio en el carrito
      const { data: existingItem, error: fetchError } = await supabase
        .from('shopping_cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('item_type', 'service')
        .eq('item_id', serviceId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking if service exists in cart:", fetchError);
        return false;
      }

      if (existingItem) {
        debugLog(`Servicio ya existe en carrito, incrementando cantidad de ${existingItem.quantity} a ${existingItem.quantity + 1}`);
        // Si ya existe, incrementar la cantidad
        const { error: updateError } = await supabase
          .from('shopping_cart_items')
          .update({ quantity: existingItem.quantity + 1, updated_at: new Date().toISOString() })
          .eq('id', existingItem.id);

        if (updateError) {
          console.error("Error updating cart item:", updateError);
          toast.error("No se pudo actualizar el carrito");
          return false;
        }
      } else {
        debugLog("Añadiendo nuevo servicio al carrito en base de datos");
        // Si no existe, añadir nuevo item
        const { error: insertError } = await supabase
          .from('shopping_cart_items')
          .insert({
            cart_id: cartId,
            item_type: 'service',
            item_id: serviceId,
            quantity: 1
          });

        if (insertError) {
          console.error("Error adding service to cart:", insertError);
          toast.error("No se pudo añadir el servicio al carrito");
          return false;
        }
      }

      if (shouldToast) toast.success("Servicio añadido al carrito");
      return true;
    }
  } catch (error) {
    console.error("Error in addServiceToCart:", error);
    toast.error("Error al añadir el servicio al carrito");
    return false;
  }
};

// Actualizar la cantidad de un item en el carrito
export const updateCartItemQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
  if (quantity < 1) {
    return removeCartItem(itemId);
  }

  try {
    debugLog(`Actualizando cantidad de item: ${itemId} a ${quantity}`);
    // Verificar si es un carrito anónimo
    const cartId = await getOrCreateCart();
    if (!cartId) return false;
    
    const isAnonymousCart = cartId.startsWith('anonymous-');
    debugLog(`Operando en carrito ${cartId} (${isAnonymousCart ? 'anónimo' : 'autenticado'})`);

    if (isAnonymousCart) {
      // Actualizar en localStorage
      const anonymousItemsStr = localStorage.getItem(ANONYMOUS_CART_ITEMS) || '[]';
      let anonymousItems = JSON.parse(anonymousItemsStr);
      
      // Buscar el item
      const itemIndex = anonymousItems.findIndex((item: any) => item.id === itemId);
      if (itemIndex === -1) return false;
      
      // Actualizar cantidad
      anonymousItems[itemIndex].quantity = quantity;
      anonymousItems[itemIndex].updated_at = new Date().toISOString();
      
      debugLog(`Cantidad actualizada en item anónimo, nueva cantidad: ${quantity}`);
      
      // Guardar en localStorage
      localStorage.setItem(ANONYMOUS_CART_ITEMS, JSON.stringify(anonymousItems));
      return true;
    } else {
      // Para carrito autenticado: usar la base de datos
      const { error } = await supabase
        .from('shopping_cart_items')
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) {
        console.error("Error updating cart item quantity:", error);
        toast.error("No se pudo actualizar la cantidad");
        return false;
      }

      debugLog(`Cantidad actualizada en base de datos, nueva cantidad: ${quantity}`);
      return true;
    }
  } catch (error) {
    console.error("Error in updateCartItemQuantity:", error);
    toast.error("Error al actualizar el carrito");
    return false;
  }
};

// Eliminar un item del carrito
export const removeCartItem = async (itemId: string): Promise<boolean> => {
  try {
    debugLog(`Eliminando item: ${itemId}`);
    // Verificar si es un carrito anónimo
    const cartId = await getOrCreateCart();
    if (!cartId) return false;
    
    const isAnonymousCart = cartId.startsWith('anonymous-');
    debugLog(`Operando en carrito ${cartId} (${isAnonymousCart ? 'anónimo' : 'autenticado'})`);

    if (isAnonymousCart) {
      // Eliminar del localStorage
      const anonymousItemsStr = localStorage.getItem(ANONYMOUS_CART_ITEMS) || '[]';
      let anonymousItems = JSON.parse(anonymousItemsStr);
      
      // Buscar el item
      const itemToRemove = anonymousItems.find((item: any) => item.id === itemId);
      if (!itemToRemove) return false;
      
      debugLog(`Item encontrado para eliminar: ${itemToRemove.item_type}`);
      
      // Si es un pack y hay servicios, mostrar advertencia
      if (itemToRemove.item_type === 'pack') {
        const packsCount = anonymousItems.filter((i: any) => i.item_type === 'pack').length;
        const hasServices = anonymousItems.some((i: any) => i.item_type === 'service');
        
        if (packsCount === 1 && hasServices) {
          if (!confirm("Si eliminas este pack, también se eliminarán todos los servicios del carrito. ¿Deseas continuar?")) {
            return false;
          }
          
          debugLog("Eliminando todos los servicios del carrito anónimo");
          // Eliminar todos los servicios
          anonymousItems = anonymousItems.filter((i: any) => i.item_type !== 'service');
        }
      }
      
      // Filtrar para eliminar el item
      anonymousItems = anonymousItems.filter((item: any) => item.id !== itemId);
      
      // Guardar en localStorage
      localStorage.setItem(ANONYMOUS_CART_ITEMS, JSON.stringify(anonymousItems));
      
      debugLog("Item eliminado del carrito anónimo");
      toast.success("Producto eliminado del carrito");
      return true;
    } else {
      // Para carrito autenticado: usar la base de datos
      // Verificar si es un pack y si hay servicios que dependen de él
      const { data: item, error: fetchError } = await supabase
        .from('shopping_cart_items')
        .select('item_type, cart_id')
        .eq('id', itemId)
        .single();
      
      if (fetchError) {
        console.error("Error fetching item type:", fetchError);
        return false;
      }

      if (item && item.item_type === 'pack') {
        const cartData = await getCartWithItems();
        
        // Si es el único pack y hay servicios, mostrar advertencia
        const packsCount = cartData?.items.filter(i => i.item_type === 'pack').length || 0;
        const hasServices = cartData?.items.some(i => i.item_type === 'service') || false;
        
        if (packsCount === 1 && hasServices) {
          if (!confirm("Si eliminas este pack, también se eliminarán todos los servicios del carrito. ¿Deseas continuar?")) {
            return false;
          }
          
          debugLog("Eliminando todos los servicios del carrito en la base de datos");
          // Eliminar todos los servicios del carrito
          await supabase
            .from('shopping_cart_items')
            .delete()
            .eq('cart_id', item.cart_id)
            .eq('item_type', 'service');
        }
      }

      // Eliminar el item solicitado
      const { error } = await supabase
        .from('shopping_cart_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error("Error removing cart item:", error);
        toast.error("No se pudo eliminar el ítem del carrito");
        return false;
      }

      debugLog("Item eliminado del carrito en la base de datos");
      toast.success("Producto eliminado del carrito");
      return true;
    }
  } catch (error) {
    console.error("Error in removeCartItem:", error);
    toast.error("Error al eliminar el ítem del carrito");
    return false;
  }
};

// Vaciar el carrito
export const clearCart = async (): Promise<boolean> => {
  try {
    debugLog("Vaciando carrito");
    const cartId = await getOrCreateCart();
    if (!cartId) return false;

    // Verificar si es un carrito anónimo
    const isAnonymousCart = cartId.startsWith('anonymous-');
    debugLog(`Operando en carrito ${cartId} (${isAnonymousCart ? 'anónimo' : 'autenticado'})`);

    if (isAnonymousCart) {
      // Vaciar localStorage
      localStorage.setItem(ANONYMOUS_CART_ITEMS, JSON.stringify([]));
      debugLog("Carrito anónimo vaciado");
      toast.success("Carrito vaciado con éxito");
      return true;
    } else {
      // Para carrito autenticado: usar la base de datos
      const { error } = await supabase
        .from('shopping_cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (error) {
        console.error("Error clearing cart:", error);
        toast.error("No se pudo vaciar el carrito");
        return false;
      }

      debugLog("Carrito en base de datos vaciado");
      toast.success("Carrito vaciado con éxito");
      return true;
    }
  } catch (error) {
    console.error("Error in clearCart:", error);
    toast.error("Error al vaciar el carrito");
    return false;
  }
};

// Función para depuración - obtiene todos los carritos de un usuario
export const getAllUserCarts = async (userId: string): Promise<any[] | null> => {
  if (!DEBUG) return null;
  
  try {
    const { data, error } = await supabase
      .from('shopping_cart')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error("Error fetching user carts:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getAllUserCarts:", error);
    return null;
  }
};
