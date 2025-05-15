import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ClientProject, getProjectDetails } from "./projectService";

export interface UserStats {
  visits: number;
  forms_submitted: number;
  active_services: number;
  demos_generated: number;
  month: string;
}

export interface UserModule {
  id: string;
  status: "active" | "pending" | "development";
  service: {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
  };
  created_at: string;
}

export interface ProjectProgress {
  id: string;
  progress_percentage: number;
  start_date: string;
  estimated_end_date: string;
  milestones: ProjectMilestone[];
  project_id?: string; // Add this to link to the actual project
  name?: string; // Add project name
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;
}

export interface AvailableService {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export interface ClientProfile {
  business_name: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  website: string | null;
}

export interface ClientTaxInfo {
  tax_id: string | null;
  legal_name: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
}

export interface ClientPrivacySettings {
  marketing_emails: boolean;
  newsletter: boolean;
  usage_analytics: boolean;
  cookie_preferences: {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
  };
}

export interface ClientSubscription {
  subscription_status: string;
  subscription_tier: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
}

export const fetchUserStats = async (): Promise<UserStats | null> => {
  try {
    const currentDate = new Date();
    // Format as text YYYY-MM instead of a date
    const currentMonth = format(currentDate, "yyyy-MM");
    
    const { data, error } = await supabase
      .from("user_stats")
      .select("*")
      .eq("month", currentMonth)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching user stats:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return null;
  }
};

export const fetchUserModules = async (): Promise<UserModule[]> => {
  const { data, error } = await supabase
    .from("user_modules")
    .select(`
      id,
      status,
      created_at,
      service_id,
      my_services (
        id,
        name,
        description,
        category,
        price
      )
    `)
    .order("created_at", { ascending: false });
    
  if (error) {
    console.error("Error fetching user modules:", error);
    return [];
  }
  
  return data.map(item => ({
    id: item.id,
    status: item.status as "active" | "pending" | "development",
    service: {
      id: item.my_services.id,
      name: item.my_services.name,
      description: item.my_services.description,
      category: item.my_services.category,
      price: item.my_services.price
    },
    created_at: item.created_at
  }));
};

export const fetchProjectProgress = async (): Promise<ProjectProgress | null> => {
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User not authenticated");
      return null;
    }
    
    // Call the new RPC function that handles no rows properly
    const { data: progressData, error } = await supabase
      .rpc('get_project_progress', { p_user_id: user.id });
      
    if (error) {
      console.error("Error fetching project progress:", error);
      return null;
    }
    
    // If no progress data, return null
    if (!progressData || progressData.length === 0) {
      return null;
    }
    
    // Extract the single result
    const projectData = progressData[0];
    
    // Get the milestones for this project if project_id exists
    let milestones = [];
    if (projectData.project_id) {
      const { data: milestonesData, error: milestonesError } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", projectData.project_id)
        .order("position", { ascending: true });
      
      if (!milestonesError) {
        milestones = milestonesData || [];
      }
    }
    
    return {
      id: projectData.id,
      project_id: projectData.project_id, // Link to the actual project
      name: projectData.name,
      progress_percentage: projectData.progress_percentage,
      start_date: projectData.start_date,
      estimated_end_date: projectData.estimated_end_date,
      milestones: milestones
    };
  } catch (error) {
    console.error("Error in fetchProjectProgress:", error);
    return null;
  }
};

export const fetchAvailableServices = async (): Promise<AvailableService[]> => {
  // Primero obtenemos los servicios que ya tiene el usuario
  const { data: userModules, error: userModulesError } = await supabase
    .from("user_modules")
    .select("service_id");
    
  if (userModulesError) {
    console.error("Error fetching user modules:", userModulesError);
    return [];
  }
  
  // Extraemos los IDs de servicios que ya tiene el usuario
  const userServiceIds = userModules.map(module => module.service_id);
  
  // Obtenemos todos los servicios disponibles que el usuario no tiene aún
  const { data, error } = await supabase
    .from("my_services")
    .select("*")
    .filter("is_active", "eq", true);
    
  if (error) {
    console.error("Error fetching available services:", error);
    return [];
  }
  
  // Filtramos los servicios que el usuario ya tiene
  return data.filter(service => !userServiceIds.includes(service.id));
};

export const addUserModule = async (serviceId: string): Promise<boolean> => {
  // Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("User not authenticated");
    return false;
  }
  
  const { error } = await supabase
    .from("user_modules")
    .insert({
      service_id: serviceId,
      status: "pending" as "active" | "pending" | "development",
      user_id: user.id
    });
    
  if (error) {
    console.error("Error adding user module:", error);
    return false;
  }
  
  return true;
};

export const fetchClientProfile = async (): Promise<ClientProfile | null> => {
  try {
    // Get the current user's email
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User not authenticated");
      return null;
    }
    
    // First check if the profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("client_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking client profile:", checkError);
    }
    
    // If profile doesn't exist, create a default one
    if (!existingProfile) {
      const defaultProfile = {
        user_id: user.id,
        business_name: "Nuevo Cliente", // Ensure this is not optional as required by schema
        first_name: "",
        last_name: "",
        phone: "",
        address: "",
        postal_code: "",
        city: "",
        province: "",
        country: "España",
        website: ""
      };
      
      const { error: insertError } = await supabase
        .from("client_profiles")
        .insert(defaultProfile);
        
      if (insertError) {
        console.error("Error creating default profile:", insertError);
        return {
          ...defaultProfile,
          email: user.email || ''
        };
      }
      
      return {
        ...defaultProfile,
        email: user.email || ''
      };
    }
    
    // Return the existing profile
    return {
      ...existingProfile,
      email: user.email || ''
    };
  } catch (error) {
    console.error("Error in fetchClientProfile:", error);
    return null;
  }
};

export const updateClientProfile = async (profile: Partial<ClientProfile>): Promise<{ error: any | null }> => {
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: new Error("User not authenticated") };
    }
    
    // Remove email from the update data since it shouldn't be modified
    const { email, ...updateData } = profile;
    
    // First check if the profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("client_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking client profile:", checkError);
      return { error: checkError };
    }
    
    if (!existingProfile) {
      // If profile doesn't exist, create a new one
      // Make sure business_name is not optional as required by the schema
      const insertData = {
        user_id: user.id,
        business_name: updateData.business_name || "Nuevo Cliente", // Provide default value
        ...updateData
      };
      
      const { error: insertError } = await supabase
        .from("client_profiles")
        .insert(insertData);
        
      return { error: insertError };
    } else {
      // Otherwise, update the existing profile
      const { error } = await supabase
        .from("client_profiles")
        .update(updateData)
        .eq("user_id", user.id);
        
      return { error };
    }
  } catch (error) {
    console.error("Error in updateClientProfile:", error);
    return { error };
  }
};

export const fetchClientTaxInfo = async (): Promise<ClientTaxInfo | null> => {
  // Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("User not authenticated");
    return null;
  }
  
  const { data, error } = await supabase
    .from("client_tax_info")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
    
  if (error) {
    console.error("Error fetching client tax info:", error);
    return null;
  }
  
  return data;
};

export const updateClientTaxInfo = async (taxInfo: Partial<ClientTaxInfo>): Promise<{ error: any | null }> => {
  // Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: new Error("User not authenticated") };
  }
  
  // Check if tax info exists for this user
  const { data } = await supabase
    .from("client_tax_info")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
    
  if (data) {
    // Update existing record
    const { error } = await supabase
      .from("client_tax_info")
      .update({
        tax_id: taxInfo.tax_id,
        legal_name: taxInfo.legal_name,
        address: taxInfo.address,
        postal_code: taxInfo.postal_code,
        city: taxInfo.city,
        province: taxInfo.province,
        country: taxInfo.country
      })
      .eq("user_id", user.id);
      
    return { error };
  } else {
    // Insert new record
    const { error } = await supabase
      .from("client_tax_info")
      .insert({
        user_id: user.id,
        tax_id: taxInfo.tax_id,
        legal_name: taxInfo.legal_name,
        address: taxInfo.address,
        postal_code: taxInfo.postal_code,
        city: taxInfo.city,
        province: taxInfo.province,
        country: taxInfo.country
      });
      
    return { error };
  }
};

export const fetchClientPrivacySettings = async (): Promise<ClientPrivacySettings | null> => {
  // Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("User not authenticated");
    return null;
  }
  
  const { data, error } = await supabase
    .from("client_privacy_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
    
  if (error) {
    console.error("Error fetching privacy settings:", error);
    return null;
  }
  
  // If no settings found, return defaults
  if (!data) {
    return {
      marketing_emails: true,
      newsletter: true,
      usage_analytics: true,
      cookie_preferences: {
        essential: true,
        analytics: true,
        marketing: false
      }
    };
  }
  
  // Ensure cookie_preferences is properly structured
  let cookiePreferences = {
    essential: true,
    analytics: true,
    marketing: false
  };
  
  // Check if cookie_preferences exists and is an object before accessing its properties
  if (data.cookie_preferences && typeof data.cookie_preferences === 'object' && data.cookie_preferences !== null) {
    const cp = data.cookie_preferences as Record<string, unknown>;
    cookiePreferences = {
      essential: cp.essential === false ? false : true, // Default to true if not explicitly false
      analytics: cp.analytics === false ? false : true, // Default to true if not explicitly false
      marketing: cp.marketing === true // Default to false if not explicitly true
    };
  }
  
  return {
    marketing_emails: data.marketing_emails !== false, // Default to true if not explicitly false
    newsletter: data.newsletter !== false, // Default to true if not explicitly false
    usage_analytics: data.usage_analytics !== false, // Default to true if not explicitly false
    cookie_preferences: cookiePreferences
  };
};

export const updateClientPrivacySettings = async (settings: Partial<ClientPrivacySettings>): Promise<{ error: any | null }> => {
  // Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: new Error("User not authenticated") };
  }
  
  // Ensure cookie_preferences is properly structured
  let cookiePreferences;
  
  if (settings.cookie_preferences && typeof settings.cookie_preferences === 'object') {
    cookiePreferences = {
      essential: settings.cookie_preferences.essential === false ? false : true, // Default to true if not explicitly false
      analytics: settings.cookie_preferences.analytics === false ? false : true, // Default to true if not explicitly false
      marketing: settings.cookie_preferences.marketing === true // Default to false if not explicitly true
    };
  }
  
  const updateData = {
    ...settings,
    cookie_preferences: cookiePreferences
  };
  
  // Check if settings exist for this user
  const { data } = await supabase
    .from("client_privacy_settings")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
    
  if (data) {
    // Update existing record
    const { error } = await supabase
      .from("client_privacy_settings")
      .update(updateData)
      .eq("user_id", user.id);
      
    return { error };
  } else {
    // Insert new record
    const { error } = await supabase
      .from("client_privacy_settings")
      .insert({
        user_id: user.id,
        ...updateData
      });
      
    return { error };
  }
};

export const fetchClientSubscription = async (): Promise<ClientSubscription | null> => {
  // Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("User not authenticated");
    return null;
  }
  
  const { data, error } = await supabase
    .from("client_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
    
  if (error) {
    console.error("Error fetching subscription:", error);
    return null;
  }
  
  // If no subscription found, return defaults
  if (!data) {
    return {
      subscription_status: "inactive",
      subscription_tier: null,
      subscription_start_date: null,
      subscription_end_date: null
    };
  }
  
  return {
    subscription_status: data.subscription_status || "inactive",
    subscription_tier: data.subscription_tier,
    subscription_start_date: data.subscription_start_date,
    subscription_end_date: data.subscription_end_date
  };
};

// Crear o recuperar checkout de Stripe
export const createCheckoutSession = async (priceId: string): Promise<{ url: string | null, error: string | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { url: null, error: "Usuario no autenticado" };
    }
    
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        priceId,
        userId: user.id,
        customerEmail: user.email
      }
    });
    
    if (error) {
      console.error("Error creating checkout:", error);
      return { url: null, error: error.message || "Error al crear la sesión de pago" };
    }
    
    return { url: data.url, error: null };
  } catch (err: any) {
    console.error("Checkout error:", err);
    return { url: null, error: err.message || "Error al procesar el pago" };
  }
};

// Recuperar el portal de cliente de Stripe
export const createCustomerPortalSession = async (): Promise<{ url: string | null, error: string | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { url: null, error: "Usuario no autenticado" };
    }
    
    const { data, error } = await supabase.functions.invoke("customer-portal", {
      body: { userId: user.id }
    });
    
    if (error) {
      console.error("Error creating customer portal:", error);
      return { url: null, error: error.message || "Error al crear el portal de cliente" };
    }
    
    return { url: data.url, error: null };
  } catch (err: any) {
    console.error("Customer portal error:", err);
    return { url: null, error: err.message || "Error al acceder al portal de cliente" };
  }
};