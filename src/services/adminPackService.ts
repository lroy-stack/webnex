import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Pack {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  position: number;
  type: string;
  is_active?: boolean;
  target: string | null;
  color: string | null;
  features: string[];
  created_at: string;
  // Add these properties to fix the TypeScript errors
  services_count?: number;
  clients_count?: number;
}

export interface PackFilters {
  search?: string;
  type?: string;
  is_active?: boolean;
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

interface PacksResponse {
  data: Pack[];
  total: number;
}

interface PackServiceItem {
  id: string;
  service_id: string;
  service_name: string;
  category: string;
  price: number;
}

interface PackClientItem {
  id: string;
  client_id: string;
  client_name: string;
  status: string;
  subscription_date: string;
}

export const fetchPacks = async (
  filters: PackFilters = {}
): Promise<PacksResponse> => {
  try {
    const {
      search,
      type,
      is_active,
      priceMin,
      priceMax,
      sortBy = 'position',
      sortOrder = 'asc',
      page = 1,
      pageSize = 10
    } = filters;

    let query = supabase
      .from('my_packs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,target.ilike.%${search}%`);
    }

    if (type) {
      query = query.eq('type', type);
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

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Execute query with pagination
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    // Add real data for services and clients count (default to 0)
    const packsWithCounts = data?.map(pack => ({
      ...pack,
      services_count: 0,  // Will be updated when we have a proper relationship table
      clients_count: 0    // Will be updated when we have client subscriptions
    })) || [];

    return {
      data: packsWithCounts,
      total: count || 0
    };
    
  } catch (error) {
    console.error("Error fetching packs:", error);
    toast.error("Error al cargar los packs");
    return {
      data: [],
      total: 0
    };
  }
};

export const fetchPackById = async (id: string): Promise<Pack | null> => {
  try {
    const { data, error } = await supabase
      .from('my_packs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
    
  } catch (error) {
    console.error("Error fetching pack by id:", error);
    toast.error("Error al cargar la información del pack");
    return null;
  }
};

export const fetchPackServices = async (packId: string): Promise<PackServiceItem[]> => {
  try {
    // Query the pack_services join table to get services included in this pack
    const { data, error } = await supabase
      .from('pack_services')
      .select(`
        id,
        service_id,
        my_services!inner(name, category, price)
      `)
      .eq('pack_id', packId);
    
    if (error) throw error;
    
    // Map the data to PackServiceItem format
    return (data || []).map(item => ({
      id: item.id,
      service_id: item.service_id,
      service_name: item.my_services.name,
      category: item.my_services.category,
      price: item.my_services.price
    }));
    
  } catch (error) {
    console.error("Error fetching pack services:", error);
    toast.error("Error al cargar los servicios incluidos en el pack");
    return [];
  }
};

export const fetchPackClients = async (packId: string): Promise<PackClientItem[]> => {
  try {
    // In a real app, you'd query based on client subscriptions or order history
    // For now, we'll return an empty array to indicate no clients have subscribed to this pack
    return [];
    
  } catch (error) {
    console.error("Error fetching pack clients:", error);
    toast.error("Error al cargar los clientes con este pack");
    return [];
  }
};

export const updatePack = async (
  id: string, 
  data: Partial<Pack>
): Promise<Pack | null> => {
  try {
    const { error } = await supabase
      .from('my_packs')
      .update({
        name: data.name,
        price: data.price,
        target: data.target,
        slug: data.slug,
        description: data.description,
        short_description: data.short_description,
        is_active: data.is_active,
        color: data.color,
        features: data.features,
        type: data.type,
        position: data.position
      })
      .eq('id', id);

    if (error) throw error;
    
    toast.success("Pack actualizado con éxito");
    
    // Get the updated pack
    return fetchPackById(id);
    
  } catch (error) {
    console.error("Error updating pack:", error);
    toast.error("Error al actualizar el pack");
    return null;
  }
};

export const createPack = async (
  data: Partial<Pack>
): Promise<Pack | null> => {
  try {
    // Get the highest position value to place the new pack at the end
    const { data: positionData, error: positionError } = await supabase
      .from('my_packs')
      .select('position')
      .order('position', { ascending: false })
      .limit(1);
      
    if (positionError) throw positionError;
    
    const nextPosition = positionData && positionData.length > 0 ? (positionData[0].position + 1) : 1;
    
    const { data: newPack, error } = await supabase
      .from('my_packs')
      .insert({
        name: data.name || 'Nuevo Pack',
        price: data.price || 0,
        target: data.target || 'Todo tipo de negocios',
        slug: data.slug || `nuevo-pack-${Date.now().toString(36)}`,
        description: data.description || '',
        short_description: data.short_description || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
        color: data.color || 'blue-500',
        features: data.features || [],
        type: data.type || 'basic',
        position: nextPosition
      })
      .select()
      .single();

    if (error) throw error;
    
    toast.success("Pack creado con éxito");
    
    // Add mock data for counts
    const packWithCounts: Pack = {
      ...newPack,
      services_count: 0,
      clients_count: 0
    };
    
    return packWithCounts;
    
  } catch (error) {
    console.error("Error creating pack:", error);
    toast.error("Error al crear el pack");
    return null;
  }
};

export const duplicatePack = async (id: string): Promise<Pack | null> => {
  try {
    // First get the pack to duplicate
    const { data: packToDuplicate, error: fetchError } = await supabase
      .from('my_packs')
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError) throw fetchError;
    if (!packToDuplicate) throw new Error("Pack not found");
    
    // Get the highest position value to place the new pack at the end
    const { data: positionData, error: positionError } = await supabase
      .from('my_packs')
      .select('position')
      .order('position', { ascending: false })
      .limit(1);
      
    if (positionError) throw positionError;
    
    const nextPosition = positionData && positionData.length > 0 ? (positionData[0].position + 1) : 1;
    
    // Create a new pack based on the original
    const { data: newPack, error } = await supabase
      .from('my_packs')
      .insert({
        name: `${packToDuplicate.name} (copia)`,
        price: packToDuplicate.price,
        target: packToDuplicate.target,
        slug: `${packToDuplicate.slug}-copia-${Date.now().toString(36)}`,
        description: packToDuplicate.description,
        short_description: packToDuplicate.short_description,
        is_active: true,
        color: packToDuplicate.color,
        features: packToDuplicate.features,
        type: packToDuplicate.type,
        position: nextPosition
      })
      .select()
      .single();

    if (error) throw error;
    
    toast.success("Pack duplicado con éxito");
    
    // Add mock data for counts
    const packWithCounts: Pack = {
      ...newPack,
      services_count: 0,
      clients_count: 0
    };
    
    return packWithCounts;
    
  } catch (error) {
    console.error("Error duplicating pack:", error);
    toast.error("Error al duplicar el pack");
    return null;
  }
};

export const deletePack = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('my_packs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    toast.success("Pack eliminado con éxito");
    
    return true;
    
  } catch (error) {
    console.error("Error deleting pack:", error);
    toast.error("Error al eliminar el pack");
    return false;
  }
};

export const togglePackActive = async (id: string, isActive: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('my_packs')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
    
    toast.success(`Pack ${isActive ? 'activado' : 'desactivado'} con éxito`);
    
    return true;
    
  } catch (error) {
    console.error("Error toggling pack active status:", error);
    toast.error(`Error al ${isActive ? 'activar' : 'desactivar'} el pack`);
    return false;
  }
};

export const addServiceToPack = async (packId: string, serviceId: string): Promise<boolean> => {
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

export const fetchServicesForPackManager = async (): Promise<{id: string, name: string, category: string}[]> => {
  try {
    const { data, error } = await supabase
      .from('my_services')
      .select('id, name, category')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    
    return data || [];
    
  } catch (error) {
    console.error("Error fetching services for pack manager:", error);
    toast.error("Error al cargar la lista de servicios");
    return [];
  }
};
