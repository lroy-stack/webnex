import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCartWithItems, clearCart } from "./cartService";
import { createProjectFromOrder } from "./projectService";

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  payment_method: string | null;
  payment_id: string | null;
  total_amount: number;
  installment_plan: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: 'pack' | 'service';
  item_id: string;
  quantity: number;
  price_at_purchase: number;
  created_at: string;
  item_details?: any;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

// Crear una orden a partir del carrito actual
export const createOrderFromCart = async (
  paymentMethod?: string,
  installmentPlan?: string
): Promise<string | null> => {
  try {
    // Obtener el carrito con sus items
    const cart = await getCartWithItems();
    if (!cart || cart.items.length === 0) {
      toast.error("El carrito está vacío");
      return null;
    }

    // Verificar que haya al menos un pack en el carrito
    const hasPack = cart.items.some(item => item.item_type === 'pack');
    if (!hasPack) {
      toast.error("Debes incluir al menos un pack en tu orden");
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Debes iniciar sesión para realizar una compra");
      return null;
    }

    // Crear la orden
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: cart.total,
        payment_method: paymentMethod || null,
        installment_plan: installmentPlan || null,
        status: 'paid' // Asumimos que la orden se paga inmediatamente para este flujo
      })
      .select('id')
      .single();

    if (error) {
      console.error("Error creating order:", error);
      toast.error("No se pudo crear la orden");
      return null;
    }

    // Crear los items de la orden
    const orderItems = cart.items.map(item => ({
      order_id: order.id,
      item_type: item.item_type,
      item_id: item.item_id,
      quantity: item.quantity,
      price_at_purchase: item.item_details?.price || 0
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      toast.error("Error al procesar los items de la orden");
      
      // Eliminar la orden si falló la creación de items
      await supabase.from('orders').delete().eq('id', order.id);
      return null;
    }

    // Vaciar el carrito después de crear la orden exitosamente
    await clearCart();

    // Aquí enviamos un correo electrónico con la confirmación de compra
    try {
      // Obtener detalles del usuario para el correo
      const { data: userProfile } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      // Generar nombre de proyecto basado en el pack principal
      const packItem = cart.items.find(item => item.item_type === 'pack');
      const projectName = packItem && packItem.item_details 
        ? `Proyecto ${packItem.item_details.name}`
        : `Proyecto Web ${new Date().toLocaleDateString()}`;
      
      // Enviar correo electrónico con la factura (esto se implementará después con una edge function)
      // Por ahora solo mostramos un mensaje en consola
      console.log("Enviando correo de confirmación a", user.email, "con orden", order.id);
      
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // No interrumpimos el flujo si falla el envío del correo
    }

    toast.success("Orden creada con éxito");
    return order.id;
  } catch (error) {
    console.error("Error in createOrderFromCart:", error);
    toast.error("Error al crear la orden");
    return null;
  }
};

// Obtener todas las órdenes del usuario actual
export const getUserOrders = async (): Promise<Order[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching user orders:", error);
      toast.error("Error al cargar las órdenes");
      return [];
    }

    return data?.map(order => ({
      ...order,
      status: order.status as OrderStatus
    })) || [];
  } catch (error) {
    console.error("Error in getUserOrders:", error);
    toast.error("Error al cargar las órdenes");
    return [];
  }
};

// Obtener una orden con sus items
export const getOrderWithItems = async (orderId: string): Promise<OrderWithItems | null> => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error("Error fetching order:", error);
      toast.error("Error al cargar la información de la orden");
      return null;
    }

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
      toast.error("Error al cargar los items de la orden");
      return null;
    }

    // Obtener detalles de los packs
    const packIds = items
      .filter(item => item.item_type === 'pack')
      .map(item => item.item_id);

    // Obtener detalles de los servicios
    const serviceIds = items
      .filter(item => item.item_type === 'service')
      .map(item => item.item_id);

    // Fix: handle empty arrays by using conditional in() call
    let packsData = [];
    if (packIds.length > 0) {
      const { data: packs } = await supabase
        .from('my_packs')
        .select('*')
        .in('id', packIds);
      packsData = packs || [];
    }
    
    // Fix: handle empty arrays by using conditional in() call
    let servicesData = [];
    if (serviceIds.length > 0) {
      const { data: services } = await supabase
        .from('my_services')
        .select('*')
        .in('id', serviceIds);
      servicesData = services || [];
    }

    // Asignar detalles a cada item
    const itemsWithDetails: OrderItem[] = items.map(item => {
      let itemDetails = null;
      
      if (item.item_type === 'pack') {
        itemDetails = packsData.find(pack => pack.id === item.item_id);
      } else if (item.item_type === 'service') {
        itemDetails = servicesData.find(service => service.id === item.item_id);
      }
      
      return {
        ...item,
        item_type: item.item_type as 'pack' | 'service',
        item_details: itemDetails
      };
    });

    return {
      ...order,
      status: order.status as OrderStatus,
      items: itemsWithDetails
    };
  } catch (error) {
    console.error("Error in getOrderWithItems:", error);
    toast.error("Error al cargar los detalles de la orden");
    return null;
  }
};

// Actualizar el estado de una orden
export const updateOrderStatus = async (
  orderId: string, 
  status: OrderStatus,
  paymentId?: string
): Promise<boolean> => {
  try {
    const updateData: { 
      status: OrderStatus,
      payment_id?: string 
    } = { status };
    
    if (paymentId) {
      updateData.payment_id = paymentId;
    }
    
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error("Error updating order status:", error);
      toast.error("Error al actualizar el estado de la orden");
      return false;
    }

    toast.success("Estado de la orden actualizado");
    return true;
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    toast.error("Error al actualizar la orden");
    return false;
  }
};