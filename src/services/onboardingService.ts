import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FormTemplate } from "@/components/onboarding/OnboardingForm";

// Get onboarding forms from Supabase
export const getOnboardingForms = async (): Promise<FormTemplate[]> => {
  try {
    const { data, error } = await supabase.rpc('get_onboarding_forms');
    
    if (error) {
      console.error("Error fetching onboarding forms:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getOnboardingForms:", error);
    toast.error("Error al cargar los formularios de onboarding");
    return [];
  }
};

// Save onboarding form data
export const saveOnboardingForm = async (formType: string, formData: Record<string, any>, isCompleted: boolean = false): Promise<boolean> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast.error("Debes iniciar sesión para guardar tus datos");
      return false;
    }

    const token = session.session.access_token;
    const payload = {
      [formType]: formData,
      isCompleted,
    };
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error saving ${formType} form:`, error);
    toast.error(`Error al guardar el formulario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    return false;
  }
};

// Check the onboarding status of the current user
export const checkOnboardingStatus = async (): Promise<{ completed: boolean, profile: any | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { completed: false, profile: null };
    }
    
    // Get client profile
    const { data: profile, error } = await supabase
      .from("client_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking onboarding status:", error);
      return { completed: false, profile: null };
    }
    
    return { 
      completed: profile?.onboarding_completed || false,
      profile 
    };
  } catch (error) {
    console.error("Error in checkOnboardingStatus:", error);
    return { completed: false, profile: null };
  }
};

// Get user questionnaire data
export const getUserQuestionnaire = async (): Promise<any | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }
    
    const { data, error } = await supabase
      .from("project_preliminary_questionnaire")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching user questionnaire:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getUserQuestionnaire:", error);
    return null;
  }
};

// Mark onboarding as completed
export const completeOnboarding = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('complete_user_onboarding', {
        user_uuid: (await supabase.auth.getUser()).data.user?.id
      });
    
    if (error) {
      console.error("Error completing onboarding:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in completeOnboarding:", error);
    return false;
  }
};