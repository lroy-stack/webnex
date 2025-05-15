import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isProtectedAdminEmail } from "@/utils/adminHelpers";

export interface ClientProfile {
  id: string;
  user_id: string;
  business_name: string;
  first_name: string | null;
  last_name: string | null;
  email?: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
  status?: string;
  subscription_status?: string | null;
  subscription_tier?: string | null;
  last_activity?: string | null;
}

export interface ClientProfileFilters {
  search?: string;
  status?: string;
  subscription_status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

interface ClientProfilesResponse {
  data: ClientProfile[];
  total: number;
}

interface ClientPacksResponse {
  id: string;
  pack_name: string;
  pack_id: string;
  price: number;
  created_at: string;
}

interface ClientServicesResponse {
  id: string;
  service_name: string;
  service_id: string;
  category: string;
  status: string;
  created_at: string;
}

export interface ClientInvitationRequest {
  businessName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  notes?: string;
}

export interface ClientInvitationResponse {
  success: boolean;
  error?: string;
  invitation?: {
    id: string;
    email: string;
    token: string;
    expires_at: string;
  };
}

export const fetchClientProfiles = async (
  filters: ClientProfileFilters = {}
): Promise<ClientProfilesResponse> => {
  try {
    const {
      search,
      status,
      subscription_status,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      pageSize = 10
    } = filters;

    console.log("Fetching client profiles with filters:", filters);

    // Use the client_profiles_with_email view to get profiles with emails
    const { data, error, count } = await supabase
      .from('client_profiles_with_email')
      .select('*', { count: 'exact' });

    if (error) {
      throw error;
    }

    // Client-side filtering and processing
    let filteredClients = data || [];
    
    // Filter out any protected admin emails
    filteredClients = filteredClients.filter(client => 
      client.email ? !isProtectedAdminEmail(client.email) : true
    );
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredClients = filteredClients.filter(client => 
        (client.business_name || '').toLowerCase().includes(searchLower) ||
        (client.first_name || '').toLowerCase().includes(searchLower) ||
        (client.last_name || '').toLowerCase().includes(searchLower) ||
        (client.email || '').toLowerCase().includes(searchLower)
      );
    }
    
    // Add default status values
    filteredClients = filteredClients.map(client => ({
      ...client,
      status: 'active', // Default status
      subscription_status: 'inactive',
      subscription_tier: null
    }));
    
    // Apply sorting
    filteredClients.sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];
      
      // Handle nested properties for subscription status
      if (sortBy === 'subscription_status') {
        valueA = a.subscription_status || 'inactive';
        valueB = b.subscription_status || 'inactive';
      }
      
      // String comparison
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortOrder === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      // Date comparison
      if (sortBy === 'created_at' || sortBy === 'last_activity') {
        const dateA = valueA ? new Date(valueA).getTime() : 0;
        const dateB = valueB ? new Date(valueB).getTime() : 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      // Default comparison
      return 0;
    });

    // Apply pagination
    const total = filteredClients.length;
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const paginatedClients = filteredClients.slice(from, to);

    return {
      data: paginatedClients,
      total: total
    };
    
  } catch (error) {
    console.error("Error fetching client profiles:", error);
    toast.error("Error al cargar los perfiles de clientes. Por favor, inténtelo de nuevo.");
    return {
      data: [],
      total: 0
    };
  }
};

export const fetchClientById = async (id: string): Promise<ClientProfile | null> => {
  try {
    // Use the client_profiles_with_email view instead of client_profiles table
    const { data, error } = await supabase
      .from('client_profiles_with_email')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Failed to fetch client with ID:", id, error);
      throw error;
    }
    
    if (!data) {
      console.error("No client found with ID:", id);
      toast.error("Cliente no encontrado");
      return null;
    }
    
    // Check if this is a protected admin email and return null if so
    if (data.email && isProtectedAdminEmail(data.email)) {
      console.warn("Attempted to fetch protected admin email as client:", data.email);
      toast.error("Cliente no encontrado");
      return null;
    }

    // Return client with real email and default status values
    const clientWithEmail: ClientProfile = {
      ...data,
      status: 'active', // Default status
      subscription_status: null,
      subscription_tier: null,
      last_activity: null
    };

    return clientWithEmail;
    
  } catch (error) {
    console.error("Error fetching client by id:", error);
    toast.error("Error al cargar la información del cliente");
    return null;
  }
};

export const fetchClientByUserId = async (userId: string): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("client_profiles_with_email")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching client by user ID:", error);
      throw new Error(`Error al cargar la información del cliente: ${error.message}`);
    }
    
    // Check if this is a protected admin email and return null if so
    if (data.email && isProtectedAdminEmail(data.email)) {
      console.warn("Attempted to fetch protected admin email as client:", data.email);
      return null;
    }

    return data as ClientProfile;
  } catch (error) {
    toast.error("Error al cargar la información del cliente");
    throw error;
  }
};

export const fetchClientPacks = async (clientId: string): Promise<ClientPacksResponse[]> => {
  try {
    // Get orders made by this client
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', clientId);
      
    if (ordersError) throw ordersError;
    
    if (!orders || orders.length === 0) {
      return []; // No orders found for this client
    }
    
    // Get all order IDs
    const orderIds = orders.map(order => order.id);
    
    // Get pack items from orders
    const { data: packItems, error: packItemsError } = await supabase
      .from('order_items')
      .select(`
        id, 
        order_id,
        item_id,
        quantity,
        price_at_purchase
      `)
      .in('order_id', orderIds)
      .eq('item_type', 'pack');
      
    if (packItemsError) throw packItemsError;
    
    if (!packItems || packItems.length === 0) {
      return []; // No pack items found in orders
    }
    
    // Get pack details for these items
    const packIds = packItems.map(item => item.item_id);
    const { data: packs, error: packsError } = await supabase
      .from('my_packs')
      .select('id, name, price')
      .in('id', packIds);
      
    if (packsError) throw packsError;
    
    // Combine the data
    return packItems.map(item => {
      const pack = packs?.find(p => p.id === item.item_id);
      return {
        id: item.id,
        pack_name: pack?.name || 'Pack desconocido',
        pack_id: item.item_id,
        price: item.price_at_purchase || pack?.price || 0,
        created_at: new Date().toISOString() // Using current date as we don't have the actual purchase date
      };
    });
    
  } catch (error) {
    console.error("Error fetching client packs:", error);
    toast.error("Error al cargar los packs del cliente");
    return [];
  }
};

export const fetchClientServices = async (clientId: string): Promise<ClientServicesResponse[]> => {
  try {
    // Try to get real data from user_modules if available
    const { data: realData, error } = await supabase
      .from('user_modules')
      .select('id, service_id, status, created_at, my_services(name, category)')
      .eq('user_id', clientId);
      
    if (error) throw error;
    
    if (realData && realData.length > 0) {
      return realData.map(item => ({
        id: item.id,
        service_name: item.my_services?.name || 'Servicio desconocido',
        service_id: item.service_id,
        category: item.my_services?.category || 'sin categoría',
        status: item.status,
        created_at: item.created_at
      }));
    }
    
    // If no real data, return an empty array instead of mock data
    return [];
    
  } catch (error) {
    console.error("Error fetching client services:", error);
    toast.error("Error al cargar los servicios del cliente");
    return [];
  }
};

export const updateClientProfile = async (
  id: string, 
  data: Partial<ClientProfile>
): Promise<ClientProfile | null> => {
  try {
    // Validate data before updating
    if (data.business_name && data.business_name.trim() === '') {
      toast.error("El nombre de la empresa no puede estar vacío");
      return null;
    }
    
    // Validate website format if provided
    if (data.website && data.website !== '') {
      try {
        new URL(data.website); // This will throw if the URL is invalid
      } catch (e) {
        toast.error("Formato de URL inválido. Asegúrate de incluir http:// o https://");
        return null;
      }
    }

    const { error } = await supabase
      .from('client_profiles')
      .update({
        business_name: data.business_name,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        website: data.website,
        address: data.address,
        city: data.city,
        province: data.province,
        postal_code: data.postal_code,
        country: data.country,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error("Error updating client profile:", error);
      throw error;
    }
    
    toast.success("Perfil del cliente actualizado con éxito");
    
    // Get the updated client
    return fetchClientById(id);
    
  } catch (error) {
    console.error("Error updating client profile:", error);
    toast.error("Error al actualizar el perfil del cliente");
    return null;
  }
};

export const createClientProfile = async (
  data: Partial<ClientProfile>
): Promise<ClientProfile | null> => {
  try {
    // Validate business_name (required)
    if (!data.business_name || data.business_name.trim() === '') {
      toast.error("El nombre de la empresa es obligatorio");
      return null;
    }
    
    // Validate website format if provided
    if (data.website && data.website !== '') {
      try {
        new URL(data.website); // This will throw if the URL is invalid
      } catch (e) {
        toast.error("Formato de URL inválido. Asegúrate de incluir http:// o https://");
        return null;
      }
    }
    
    // In a real app, you'd first create a user in auth.users and get the user_id
    // For demo purposes, we'll generate a UUID
    const mockUserId = crypto.randomUUID();
    
    const { data: newClient, error } = await supabase
      .from('client_profiles')
      .insert({
        user_id: mockUserId,
        business_name: data.business_name || 'Nuevo Cliente',
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        website: data.website,
        address: data.address,
        city: data.city,
        province: data.province,
        postal_code: data.postal_code,
        country: data.country,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating client profile:", error);
      throw error;
    }
    
    toast.success("Cliente creado con éxito");
    
    // For demo clients (no real auth users), use a consistent placeholder email
    const clientWithEmail: ClientProfile = {
      ...newClient,
      email: `nuevo_cliente@example.com`, // Placeholder email for new clients
      status: 'active',
      subscription_status: 'inactive',
      subscription_tier: null,
      last_activity: new Date().toISOString()
    };
    
    return clientWithEmail;
    
  } catch (error) {
    console.error("Error creating client profile:", error);
    toast.error("Error al crear el perfil del cliente");
    return null;
  }
};

export const deleteClientProfile = async (id: string): Promise<boolean> => {
  try {
    // First check if the client exists
    const { data, error: checkError } = await supabase
      .from('client_profiles')
      .select('id, business_name, user_id')
      .eq('id', id)
      .single();
      
    if (checkError || !data) {
      console.error("Client not found or error checking:", checkError);
      toast.error("Cliente no encontrado o error al verificar");
      return false;
    }

    // Check if this is a protected admin email
    if (data.user_id) {
      const { data: userData } = await supabase
        .from('users_with_email')
        .select('email')
        .eq('id', data.user_id)
        .single();
        
      if (userData?.email && isProtectedAdminEmail(userData.email)) {
        console.warn("Attempted to delete protected admin as client:", userData.email);
        toast.error("No se puede eliminar este usuario");
        return false;
      }
    }

    // Perform the deletion with proper error handling
    const { error } = await supabase
      .from('client_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting client profile:", error);
      throw error;
    }
    
    toast.success(`Cliente "${data.business_name}" eliminado con éxito`);
    
    return true;
    
  } catch (error) {
    console.error("Error deleting client profile:", error);
    toast.error("Error al eliminar el cliente");
    return false;
  }
};

// Create a client invitation for onboarding
export const createClientInvitation = async (
  data: ClientInvitationRequest
): Promise<ClientInvitationResponse> => {
  try {
    // Check for required fields
    if (!data.businessName || !data.email) {
      return {
        success: false,
        error: "El nombre de la empresa y el email son obligatorios"
      };
    }

    // Get current admin user id
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return {
        success: false,
        error: "No hay una sesión de administrador activa"
      };
    }

    // Check if email already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users_with_email')
      .select('id')
      .eq('email', data.email);

    if (checkError) {
      console.error("Error checking existing user:", checkError);
      return {
        success: false,
        error: "Error al verificar si el email ya existe"
      };
    }

    if (existingUsers && existingUsers.length > 0) {
      return {
        success: false,
        error: "Ya existe un usuario con este email"
      };
    }

    // Generate a unique token for the invitation
    const token = crypto.randomUUID();
    
    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .insert({
        email: data.email,
        token,
        role: 'client',
        created_by: authData.user.id,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (invitationError) {
      console.error("Error creating invitation:", invitationError);
      return {
        success: false,
        error: "Error al crear la invitación"
      };
    }

    // Now send the invitation email using a service function
    try {
      const { error: emailError } = await supabase.functions.invoke("send-client-invitation", {
        body: {
          email: data.email,
          businessName: data.businessName,
          firstName: data.firstName,
          lastName: data.lastName,
          token: token,
          expiresAt: expiresAt.toISOString()
        }
      });

      if (emailError) {
        console.error("Error sending invitation email:", emailError);
        return {
          success: true,
          error: "La invitación se creó, pero hubo un problema al enviar el email",
          invitation
        };
      }

      // Log admin action
      await supabase.from('admin_action_logs').insert({
        admin_id: authData.user.id,
        action_type: 'invite_client',
        description: `Invitación enviada a ${data.email}`,
        entity_type: 'user_invitations',
        entity_id: invitation.id
      });

      return {
        success: true,
        invitation
      };
    } catch (emailError) {
      console.error("Error in send-client-invitation function:", emailError);
      return {
        success: true,
        error: "La invitación se creó, pero hubo un problema al enviar el email",
        invitation
      };
    }
  } catch (error) {
    console.error("Error creating client invitation:", error);
    return {
      success: false,
      error: "Error del servidor al procesar la invitación"
    };
  }
};

// Helper function to convert DB client profile to client profile type
export const mapToClientProfile = (dbProfile: any): ClientProfile => {
  return {
    id: dbProfile.id,
    user_id: dbProfile.user_id,
    business_name: dbProfile.business_name,
    first_name: dbProfile.first_name,
    last_name: dbProfile.last_name,
    email: dbProfile.email,
    phone: dbProfile.phone,
    website: dbProfile.website,
    address: dbProfile.address,
    city: dbProfile.city,
    province: dbProfile.province,
    postal_code: dbProfile.postal_code,
    country: dbProfile.country,
    created_at: dbProfile.created_at,
    updated_at: dbProfile.updated_at,
    status: 'active', // Default status
    subscription_status: null,
    subscription_tier: null,
    last_activity: null
  };
};