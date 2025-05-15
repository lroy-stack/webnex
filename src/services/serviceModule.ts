import { supabase } from "@/integrations/supabase/client";

export interface ServiceModule {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  is_active?: boolean;
  created_at: string;
}

export const fetchServiceModules = async (): Promise<ServiceModule[]> => {
  try {
    const { data, error } = await supabase
      .from("my_services")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching service modules:", error);
      throw error;
    }

    // We need to map the data to match our expected ServiceModule interface
    const serviceModules: ServiceModule[] = data.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
      price: service.price,
      is_active: service.is_active,
      created_at: service.created_at,
    }));

    return serviceModules;
  } catch (error) {
    console.error("Error in fetchServiceModules:", error);
    return [];
  }
};

export const fetchServiceModuleById = async (id: string): Promise<ServiceModule | null> => {
  try {
    const { data, error } = await supabase
      .from("my_services")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching service module by id:", error);
      throw error;
    }

    if (!data) {
      return null;
    }

    // Map the data to match our expected ServiceModule interface
    const serviceModule: ServiceModule = {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      is_active: data.is_active,
      created_at: data.created_at,
    };

    return serviceModule;
  } catch (error) {
    console.error("Error in fetchServiceModuleById:", error);
    return null;
  }
};

// Add the missing function that's imported in Packs.tsx
export const fetchServiceModulesByCategory = async (category: string): Promise<ServiceModule[]> => {
  try {
    const { data, error } = await supabase
      .from("my_services")
      .select("*")
      .eq("category", category)
      .eq("is_active", true);

    if (error) {
      console.error(`Error fetching service modules for category ${category}:`, error);
      throw error;
    }

    // Map the data to match our expected ServiceModule interface
    const serviceModules: ServiceModule[] = data.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
      price: service.price,
      is_active: service.is_active,
      created_at: service.created_at,
    }));

    return serviceModules;
  } catch (error) {
    console.error(`Error in fetchServiceModulesByCategory for ${category}:`, error);
    return [];
  }
};
