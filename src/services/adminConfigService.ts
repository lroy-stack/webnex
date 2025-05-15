
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WebsiteSettings {
  id: string;
  site_name: string;
  meta_title: string;
  meta_description: string;
  tagline: string | null;
  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  google_analytics_id: string | null;
  maintenance_mode: boolean;
  enable_registration: boolean;
  enable_blog: boolean;
}

interface NotificationSettings {
  id: string;
  user_id: string;
  notification_email: string;
  new_contact_messages: boolean;
  new_user_signup: boolean;
  user_subscription_changes: boolean;
  security_alerts: boolean;
  daily_notification_summary: boolean;
  notify_telegram: boolean;
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
  notify_slack: boolean;
  slack_webhook_url: string | null;
}

interface CustomizationSettings {
  id: string;
  theme_primary_color: string;
  theme_secondary_color: string | null;
  theme_style: "default" | "modern" | "classic";
  logo_url: string | null;
  favicon_url: string | null;
  enable_dark_mode: boolean;
  custom_css: string | null;
  footer_text: string | null;
  email_template: "default" | "minimal" | "branded";
}

interface IntegrationSettings {
  id: string;
  type: string;
  name: string;
  active: boolean;
  config: Record<string, any>;
  last_updated: string;
}

// Función para obtener la configuración general del sitio web
export const getWebsiteSettings = async (): Promise<WebsiteSettings> => {
  try {
    const { data, error } = await supabase
      .from("website_settings")
      .select("*")
      .single();

    if (error) throw error;

    return data as WebsiteSettings;
  } catch (error) {
    console.error("Error fetching website settings:", error);
    throw error;
  }
};

// Función para actualizar la configuración general
export const updateWebsiteSettings = async (settings: Partial<WebsiteSettings>): Promise<void> => {
  try {
    const { error } = await supabase
      .from("website_settings")
      .update(settings)
      .eq("id", settings.id);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating website settings:", error);
    throw error;
  }
};

// Funciones para notificaciones
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const { data: userRoleData, error: userRoleError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (userRoleError) throw userRoleError;
    
    const adminUserId = userRoleData?.user_id;

    // Buscar configuración existente
    const { data, error } = await supabase
      .from("admin_notification_settings")
      .select("*")
      .eq("user_id", adminUserId)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 es el código para "no se encontraron resultados"
      throw error;
    }

    if (!data) {
      // Si no existe configuración, crear una por defecto
      const { data: newSettings, error: createError } = await supabase
        .from("admin_notification_settings")
        .insert({
          user_id: adminUserId,
          notification_email: "",  // Valor por defecto
          new_contact_messages: true,
          new_user_signup: true,
          user_subscription_changes: true,
          security_alerts: true,
          daily_notification_summary: false
        })
        .select("*")
        .single();

      if (createError) throw createError;
      return newSettings as NotificationSettings;
    }

    return data as NotificationSettings;
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    throw error;
  }
};

export const updateNotificationSettings = async (settings: Partial<NotificationSettings>): Promise<void> => {
  try {
    const { error } = await supabase
      .from("admin_notification_settings")
      .update(settings)
      .eq("id", settings.id);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating notification settings:", error);
    throw error;
  }
};

// Funciones para facturación
export const getBillingSettings = async () => {
  try {
    // Como esto es más complejo y podría involucrar múltiples tablas,
    // podríamos simularlo por ahora o implementarlo según sea necesario
    return null; // Por ahora devolvemos null hasta que se implemente
  } catch (error) {
    console.error("Error fetching billing settings:", error);
    throw error;
  }
};

// Funciones para personalización
export const getCustomizationSettings = async (): Promise<CustomizationSettings | null> => {
  try {
    // En una implementación real, esto buscaría en una tabla específica
    // Por ahora, podemos devolver valores por defecto
    return null;
  } catch (error) {
    console.error("Error fetching customization settings:", error);
    throw error;
  }
};

export const updateCustomizationSettings = async (settings: Partial<CustomizationSettings>): Promise<void> => {
  try {
    // Implementar cuando tengamos la tabla correspondiente
    console.log("Customization settings to update:", settings);
    toast.success("Configuración de personalización simulada correctamente");
    return;
  } catch (error) {
    console.error("Error updating customization settings:", error);
    throw error;
  }
};

// Funciones para integraciones
export const getIntegrationSettings = async (): Promise<IntegrationSettings[] | null> => {
  try {
    // En una implementación real, esto buscaría en una tabla específica
    return null;
  } catch (error) {
    console.error("Error fetching integration settings:", error);
    throw error;
  }
};

export const updateIntegrationSettings = async (type: string, config: any): Promise<void> => {
  try {
    // Implementar cuando tengamos la tabla correspondiente
    console.log(`Integration settings for ${type} to update:`, config);
    toast.success(`Configuración de integración ${type} simulada correctamente`);
    return;
  } catch (error) {
    console.error(`Error updating ${type} integration settings:`, error);
    throw error;
  }
};
