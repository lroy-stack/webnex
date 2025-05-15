
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CategoryType } from "@/utils/categoryStyles";

export interface Service {
  id: string;
  name: string;
  description: string;
  category: CategoryType;
  price: number;
  is_active?: boolean;
  created_at: string;
  packs_count?: number;
  clients_count?: number;
}

export interface ServiceFilters {
  search?: string;
  category?: CategoryType;
  is_active?: boolean;
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

interface ServicesResponse {
  data: Service[];
  total: number;
}

interface ServicePackItem {
  id: string;
  pack_id: string;
  pack_name: string;
  price: number;
  is_active: boolean;
}

interface ServiceClientItem {
  id: string;
  client_id: string;
  client_name: string;
  status: string;
  created_at: string;
}

// Define a type for the database response structure
interface ServiceDatabaseRow {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  is_active: boolean;
  created_at: string;
  packs_count: { count: number }[] | null;  // Updated type to match Supabase response
  clients_count: { count: number }[] | null; // Updated type to match Supabase response
}

export const fetchServices = async (
  filters: ServiceFilters = {}
): Promise<ServicesResponse> => {
  try {
    const {
      search,
      category,
      is_active,
      priceMin,
      priceMax,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      pageSize = 10
    } = filters;

    // Build a query with subqueries for counts instead of nested relationships
    let query = supabase
      .from('my_services')
      .select(`
        *,
        packs_count:pack_services(count),
        clients_count:user_modules(count)
      `, { count: 'exact' });
    
    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active);
    }
    if (priceMin !== undefined) {
      query = query.gte('price', priceMin);
    }
    if (priceMax !== undefined) {
      query = query.lte('price', priceMax);
    }
    
    // Add sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range((page - 1) * pageSize, (page - 1) * pageSize + pageSize - 1);
    
    // Execute the query
    const { data: servicesData, error, count } = await query;

    if (error) throw error;

    // Map the response to our Service interface
    const services: Service[] = [];
    
    if (servicesData) {
      for (const item of servicesData) {
        // Skip null items
        if (!item) continue;
        
        // Extract count values properly from the array response
        const packsCount = item.packs_count && item.packs_count.length > 0 ? 
          (item.packs_count[0] as { count: number }).count : 0;
          
        const clientsCount = item.clients_count && item.clients_count.length > 0 ? 
          (item.clients_count[0] as { count: number }).count : 0;
        
        services.push({
          id: item.id,
          name: item.name,
          description: item.description,
          category: item.category as CategoryType,
          price: item.price,
          is_active: item.is_active,
          created_at: item.created_at,
          packs_count: packsCount,
          clients_count: clientsCount
        });
      }
    }

    return {
      data: services,
      total: count || 0
    };
    
  } catch (error) {
    console.error("Error fetching services:", error);
    toast.error("Error al cargar los servicios");
    return {
      data: [],
      total: 0
    };
  }
};

export const fetchServiceById = async (id: string): Promise<Service | null> => {
  try {
    // Use subqueries for counts instead of nested relationships
    const { data, error } = await supabase
      .from('my_services')
      .select(`
        *,
        packs_count:pack_services(count),
        clients_count:user_modules(count)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Extract count values properly from the array response
    const packsCount = data.packs_count && data.packs_count.length > 0 ? 
      (data.packs_count[0] as { count: number }).count : 0;
      
    const clientsCount = data.clients_count && data.clients_count.length > 0 ? 
      (data.clients_count[0] as { count: number }).count : 0;

    // Create service with proper mapping
    const serviceWithCounts: Service = {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category as CategoryType,
      price: data.price,
      is_active: data.is_active,
      created_at: data.created_at,
      packs_count: packsCount,
      clients_count: clientsCount
    };

    return serviceWithCounts;
    
  } catch (error) {
    console.error("Error fetching service by id:", error);
    toast.error("Error al cargar la información del servicio");
    return null;
  }
};

export const fetchServicePacks = async (serviceId: string): Promise<ServicePackItem[]> => {
  try {
    // Query the pack_services join table to get packs that include this service
    const { data, error } = await supabase
      .from('pack_services')
      .select(`
        id,
        pack_id,
        my_packs!inner(name, price, is_active)
      `)
      .eq('service_id', serviceId);
    
    if (error) throw error;
    
    // Map the data to ServicePackItem format
    return (data || []).map(item => ({
      id: item.id,
      pack_id: item.pack_id,
      pack_name: item.my_packs.name,
      price: item.my_packs.price,
      is_active: item.my_packs.is_active
    }));
    
  } catch (error) {
    console.error("Error fetching service packs:", error);
    toast.error("Error al cargar los packs que incluyen este servicio");
    return [];
  }
};

export const fetchServiceClients = async (serviceId: string): Promise<ServiceClientItem[]> => {
  try {
    // Query user_modules to get clients who have this service
    const { data: userModules, error } = await supabase
      .from('user_modules')
      .select('id, user_id, status, created_at')
      .eq('service_id', serviceId);
      
    if (error) throw error;
    
    if (userModules && userModules.length > 0) {
      // Get client profiles for these users
      const userIds = userModules.map(m => m.user_id);
      
      const { data: clients, error: clientsError } = await supabase
        .from('client_profiles')
        .select('id, user_id, business_name')
        .in('user_id', userIds);
        
      if (clientsError) throw clientsError;
      
      // Map the clients to the modules
      return userModules.map(module => {
        const client = clients?.find(c => c.user_id === module.user_id);
        return {
          id: module.id,
          client_id: client?.id || 'unknown',
          client_name: client?.business_name || 'Cliente desconocido',
          status: module.status,
          created_at: module.created_at
        };
      });
    }
    
    return [];
    
  } catch (error) {
    console.error("Error fetching service clients:", error);
    toast.error("Error al cargar los clientes con este servicio");
    return [];
  }
};

export const updateService = async (
  id: string, 
  data: Partial<Service>
): Promise<Service | null> => {
  try {
    const { error } = await supabase
      .from('my_services')
      .update({
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        is_active: data.is_active
      })
      .eq('id', id);

    if (error) throw error;
    
    toast.success("Servicio actualizado con éxito");
    
    // Get the updated service
    return fetchServiceById(id);
    
  } catch (error) {
    console.error("Error updating service:", error);
    toast.error("Error al actualizar el servicio");
    return null;
  }
};

export const createService = async (
  data: Partial<Service>
): Promise<Service | null> => {
  try {
    const { data: newService, error } = await supabase
      .from('my_services')
      .insert({
        name: data.name || 'Nuevo Servicio',
        description: data.description || '',
        category: data.category || 'technical',
        price: data.price || 0,
        is_active: data.is_active !== undefined ? data.is_active : true
      })
      .select()
      .single();

    if (error) throw error;
    
    toast.success("Servicio creado con éxito");
    
    // Add mock data for counts
    const serviceWithCounts: Service = {
      ...newService,
      category: newService.category as CategoryType,
      packs_count: 0,
      clients_count: 0
    };
    
    return serviceWithCounts;
    
  } catch (error) {
    console.error("Error creating service:", error);
    toast.error("Error al crear el servicio");
    return null;
  }
};

export const deleteService = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('my_services')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    toast.success("Servicio eliminado con éxito");
    
    return true;
    
  } catch (error) {
    console.error("Error deleting service:", error);
    toast.error("Error al eliminar el servicio");
    return false;
  }
};

export const toggleServiceActive = async (id: string, isActive: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('my_services')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
    
    toast.success(`Servicio ${isActive ? 'activado' : 'desactivado'} con éxito`);
    
    return true;
    
  } catch (error) {
    console.error("Error toggling service active status:", error);
    toast.error(`Error al ${isActive ? 'activar' : 'desactivar'} el servicio`);
    return false;
  }
};

export const addServiceToPack = async (serviceId: string, packId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('pack_services')
      .insert({
        pack_id: packId,
        service_id: serviceId
      });

    if (error) {
      // If it's a unique constraint error, service is already in the pack
      if (error.code === '23505') {
        toast.error("Este servicio ya está incluido en este pack");
        return false;
      }
      throw error;
    }
    
    toast.success("Servicio añadido al pack con éxito");
    return true;
    
  } catch (error) {
    console.error("Error adding service to pack:", error);
    toast.error("Error al añadir el servicio al pack");
    return false;
  }
};

export const removeServiceFromPack = async (packServiceId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('pack_services')
      .delete()
      .eq('id', packServiceId);

    if (error) throw error;
    
    toast.success("Servicio eliminado del pack con éxito");
    return true;
    
  } catch (error) {
    console.error("Error removing service from pack:", error);
    toast.error("Error al eliminar el servicio del pack");
    return false;
  }
};

export const fetchPacksForServiceManager = async (): Promise<{id: string, name: string}[]> => {
  try {
    const { data, error } = await supabase
      .from('my_packs')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw error;
    
    return data || [];
    
  } catch (error) {
    console.error("Error fetching packs for service manager:", error);
    toast.error("Error al cargar la lista de packs");
    return [];
  }
};
