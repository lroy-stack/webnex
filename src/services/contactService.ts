import { ContactFormValues } from "@/lib/schemas/contactSchema";
import { supabase } from "@/integrations/supabase/client";

export const submitContactForm = async (data: ContactFormValues) => {
  // Get current user if logged in, but don't require authentication
  const { data: { session } } = await supabase.auth.getSession();
  const user_id = session?.user?.id || null;

  // Ensure all required fields are present
  const submissionData = {
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
    phone: data.phone || null,
    company: data.company || null,
    project_type: data.project_type || null,
    priority: data.priority,
    user_id // Esto puede ser null para usuarios no autenticados
  };

  // No necesitamos encabezados de autenticación especiales
  const { error, data: response } = await supabase
    .from("contact_messages")
    .insert(submissionData)
    .select("id")
    .single();

  if (error) {
    console.error("Error submitting contact form:", error);
    throw error;
  }

  return response;
};