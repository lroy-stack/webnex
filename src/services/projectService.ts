import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClientProject {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  estimated_completion_days: number;
  start_date: string | null;
  expected_end_date: string | null;
  actual_end_date: string | null;
  created_at: string;
  updated_at: string;
  order_id: string | null;
  progress_percentage: number; 
  milestones: ProjectMilestone[];
  updates?: ProjectUpdate[]; // Make sure this is defined
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  admin_id: string;
}

export interface ProjectForm {
  id: string;
  project_id: string;
  form_type: string;
  title: string;
  description?: string;
  form_data: Record<string, any>;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  conditional?: {
    field: string;
    value: string;
  };
}

// Get project details with milestones and updates
export const getProjectDetails = async (projectId: string): Promise<ClientProject | null> => {
  try {
    console.log("Fetching project details for ID:", projectId);
    
    // Get basic project data
    const { data: project, error } = await supabase
      .from('client_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error("Error fetching project:", error);
      toast.error("Error al cargar los datos del proyecto");
      return null;
    }

    console.log("Project basic data loaded:", project);

    // Get project milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true });

    if (milestonesError) {
      console.error("Error fetching milestones:", milestonesError);
      // Continue without milestones if there's an error
    } else {
      console.log("Milestones loaded:", milestones?.length || 0);
    }

    // Get project updates
    const { data: updates, error: updatesError } = await supabase
      .from('project_updates')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (updatesError) {
      console.error("Error fetching updates:", updatesError);
      // Continue without updates if there's an error
    } else {
      console.log("Updates loaded:", updates?.length || 0);
    }

    // Calculate progress percentage based on time elapsed vs total time
    // This is the new progress calculation based on time elapsed
    let progress_percentage = 0;
    if (project.start_date && project.expected_end_date) {
      const startDate = new Date(project.start_date).getTime();
      const endDate = new Date(project.expected_end_date).getTime();
      const today = new Date().getTime();
      
      // If project is completed, show 100% progress
      if (project.status === 'completed') {
        progress_percentage = 100;
      } 
      // If project is cancelled, keep progress as is
      else if (project.status === 'cancelled') {
        // Use either milestone based progress or 0
        const completedMilestones = milestones?.filter(m => m.is_completed)?.length || 0;
        const totalMilestones = milestones?.length || 0;
        progress_percentage = totalMilestones > 0 
          ? Math.round((completedMilestones / totalMilestones) * 100) 
          : 0;
      }
      // For pending or in_progress projects, calculate based on time
      else if (endDate > startDate) {
        // Cap the progress at 100% if we're past the end date
        if (today >= endDate) {
          progress_percentage = 99; // Use 99% to indicate it's due but not marked complete
        } else {
          // Calculate progress based on time elapsed
          const totalTime = endDate - startDate;
          const timeElapsed = today - startDate;
          progress_percentage = Math.round((timeElapsed / totalTime) * 100);
          
          // Ensure progress is between 0 and 99
          progress_percentage = Math.max(0, Math.min(99, progress_percentage));
        }
      }
    } else {
      // Fallback to milestone-based calculation if dates are not set
      const completedMilestones = milestones?.filter(m => m.is_completed)?.length || 0;
      const totalMilestones = milestones?.length || 0;
      progress_percentage = totalMilestones > 0 
        ? Math.round((completedMilestones / totalMilestones) * 100) 
        : 0;
    }

    // Ensure the project status is one of the allowed values
    let typedStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    
    // Convert status to the correct type
    switch (project.status) {
      case 'pending':
      case 'in_progress':
      case 'completed':
      case 'cancelled':
        typedStatus = project.status;
        break;
      default:
        // Default to 'pending' if the status is not one of the allowed values
        console.warn(`Invalid project status: ${project.status}, defaulting to 'pending'`);
        typedStatus = 'pending';
    }

    return {
      ...project,
      status: typedStatus,
      progress_percentage, // Add calculated progress percentage
      milestones: milestones || [],
      updates: updates || []
    } as ClientProject;
  } catch (error) {
    console.error("Error in getProjectDetails:", error);
    toast.error("Error al cargar los datos del proyecto");
    return null;
  }
};

// Get project details with milestones and other related information
export const getProjectWithDetails = async (projectId: string): Promise<ClientProject | null> => {
  try {
    return await getProjectDetails(projectId);
  } catch (error) {
    console.error("Error in getProjectWithDetails:", error);
    return null;
  }
};

// Get all projects for the current user
export const getUserProjects = async (): Promise<ClientProject[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user found");
      return [];
    }

    const { data: projects, error } = await supabase
      .from('client_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching user projects:", error);
      return [];
    }

    // Calculate progress percentage for each project
    const projectsWithDetails = await Promise.all(projects.map(async (project) => {
      const { data: milestones } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', project.id);
        
      const completedMilestones = milestones?.filter(m => m.is_completed)?.length || 0;
      const totalMilestones = milestones?.length || 0;
      const progress_percentage = totalMilestones > 0 
        ? Math.round((completedMilestones / totalMilestones) * 100) 
        : 0;
        
      // Ensure the project status is one of the allowed values
      let typedStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      
      // Convert status to the correct type
      switch (project.status) {
        case 'pending':
        case 'in_progress':
        case 'completed':
        case 'cancelled':
          typedStatus = project.status;
          break;
        default:
          // Default to 'pending' if the status is not one of the allowed values
          console.warn(`Invalid project status: ${project.status}, defaulting to 'pending'`);
          typedStatus = 'pending';
      }

      // Get project updates
      const { data: updates } = await supabase
        .from('project_updates')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      return {
        ...project,
        status: typedStatus,
        progress_percentage, // Add calculated progress percentage
        milestones: milestones || [],
        updates: updates || []
      } as ClientProject;
    }));

    return projectsWithDetails;
  } catch (error) {
    console.error("Error in getUserProjects:", error);
    return [];
  }
};

// Get project updates with improved error handling and ordering
export const getProjectUpdates = async (projectId: string): Promise<ProjectUpdate[]> => {
  try {
    console.log(`Fetching updates for project ${projectId}`);
    const { data, error } = await supabase
      .from('project_updates')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching project updates:", error);
      console.error("Error details:", JSON.stringify(error));
      return [];
    }

    console.log(`Successfully fetched ${data?.length || 0} updates`);
    return data as ProjectUpdate[];
  } catch (error) {
    console.error("Error in getProjectUpdates:", error);
    return [];
  }
};

// Mark a project update as read - Improved with detailed error handling and logging
export const markProjectUpdateAsRead = async (updateId: string): Promise<boolean> => {
  try {
    console.log("Marking update as read:", updateId);
    
    // First, verify the update exists and get its current state
    const { data: currentUpdate, error: fetchError } = await supabase
      .from('project_updates')
      .select('id, is_read')
      .eq('id', updateId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching update before marking as read:", fetchError);
      return false;
    }
    
    // If already read, no need to update
    if (currentUpdate?.is_read) {
      console.log("Update already marked as read:", updateId);
      return true;
    }
    
    // Mark as read and return updated record to confirm change
    const { data, error, count } = await supabase
      .from('project_updates')
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString() 
      })
      .eq('id', updateId)
      .select();

    if (error) {
      console.error("Error marking update as read:", error);
      console.error("Error details:", JSON.stringify(error));
      return false;
    }

    // Verify that a record was actually updated
    if (!data || data.length === 0) {
      console.error("No records were updated when marking as read");
      return false;
    }

    console.log("Update marked as read successfully:", data);
    return true;
  } catch (error) {
    console.error("Error in markProjectUpdateAsRead:", error);
    return false;
  }
};

// Count unread updates with improved logging
export const getUnreadUpdatesCount = async (projectId: string): Promise<number> => {
  try {
    console.log(`Counting unread updates for project ${projectId}`);
    const { data, error, count } = await supabase
      .from('project_updates')
      .select('*', { count: 'exact' })
      .eq('project_id', projectId)
      .eq('is_read', false);

    if (error) {
      console.error("Error counting unread updates:", error);
      console.error("Error details:", JSON.stringify(error));
      return 0;
    }

    console.log(`Found ${count || 0} unread updates for project ${projectId}`);
    return count || 0;
  } catch (error) {
    console.error("Error in getUnreadUpdatesCount:", error);
    return 0;
  }
};

// Get project questionnaire (using the new project_forms table)
export const getProjectQuestionnaire = async (projectId: string): Promise<ProjectForm | null> => {
  try {
    // First check if we have a form for this project
    const { data: form, error: formError } = await supabase
      .from('project_forms')
      .select('*')
      .eq('project_id', projectId)
      .eq('form_type', 'questionnaire')
      .single();

    if (formError) {
      if (formError.code === 'PGRST116') { // No form found
        console.log("No questionnaire form found, creating one");
        
        // Get the default questionnaire template
        const { data: templateData, error: templateError } = await supabase
          .from('system_constants')
          .select('value')
          .eq('key', 'default_questionnaire_template')
          .single();
          
        if (templateError || !templateData) {
          console.error("Error fetching questionnaire template:", templateError);
          return null;
        }
        
        // Create a new questionnaire form
        const { data: newForm, error: createError } = await supabase
          .from('project_forms')
          .insert({
            project_id: projectId,
            form_type: 'questionnaire',
            title: 'Cuestionario del proyecto',
            description: 'Por favor complete la información solicitada para su proyecto.',
            form_data: {},
            is_completed: false
          })
          .select('*')
          .single();

        if (createError) {
          console.error("Error creating questionnaire form:", createError);
          return null;
        }
        
        return newForm as ProjectForm;
      } else {
        console.error("Error fetching questionnaire form:", formError);
        return null;
      }
    }

    return form as ProjectForm;
  } catch (error) {
    console.error("Error in getProjectQuestionnaire:", error);
    return null;
  }
};

// Get questionnaire template
export const getQuestionnaireTemplate = async (): Promise<QuestionnaireField[]> => {
  try {
    const { data, error } = await supabase
      .from('system_constants')
      .select('value')
      .eq('key', 'default_questionnaire_template')
      .single();
      
    if (error || !data) {
      console.error("Error fetching questionnaire template:", error);
      return [];
    }

    // Convertir explícitamente el valor a QuestionnaireField[]
    const template = data.value as unknown;
    if (Array.isArray(template)) {
      return template as QuestionnaireField[];
    }
    
    console.error("Template is not an array:", template);
    return [];
  } catch (error) {
    console.error("Error in getQuestionnaireTemplate:", error);
    return [];
  }
};

// Save questionnaire responses
export const saveQuestionnaireResponses = async (
  formId: string,
  responses: Record<string, any>,
  markAsCompleted = false
): Promise<boolean> => {
  try {
    // Get the current form
    const { data: form, error: formError } = await supabase
      .from('project_forms')
      .select('*')
      .eq('id', formId)
      .single();
      
    if (formError) {
      console.error("Error fetching form:", formError);
      return false;
    }
    
    // Update the form with the new responses and completion status
    const { error: updateError } = await supabase
      .from('project_forms')
      .update({
        form_data: responses,
        is_completed: markAsCompleted ? true : form.is_completed,
        updated_at: new Date().toISOString()
      })
      .eq('id', formId);
      
    if (updateError) {
      console.error("Error updating questionnaire responses:", updateError);
      return false;
    }
    
    // If marking as completed, create an update in the project
    if (markAsCompleted) {
      await supabase
        .from('project_updates')
        .insert({
          project_id: form.project_id,
          title: "Cuestionario completado",
          content: "El cliente ha completado el cuestionario del proyecto.",
          admin_id: "00000000-0000-0000-0000-000000000000", // ID genérico para el sistema
          is_read: false
        });
    }

    return true;
  } catch (error) {
    console.error("Error in saveQuestionnaireResponses:", error);
    return false;
  }
};

// Crear un proyecto a partir de una orden - Properly implemented with dynamic development times
export const createProjectFromOrder = async (orderId: string, projectName: string): Promise<string | null> => {
  try {
    console.log("Creating project from order:", orderId);
    
    // Obtener los datos de la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      toast.error("No se pudo encontrar la orden");
      return null;
    }

    // Verificar que la orden tenga al menos un pack
    const hasPack = order.items?.some((item: any) => item.item_type === 'pack');
    if (!hasPack) {
      toast.error("La orden no contiene ningún pack");
      return null;
    }

    // Calculate total order amount and determine project duration
    let totalAmount = 0;
    let packName = "";
    
    // Get pack details to determine development days
    for (const item of order.items) {
      if (item.item_type === 'pack') {
        // Get the pack details to determine price
        const { data: packData } = await supabase
          .from('my_packs')
          .select('price, name')
          .eq('id', item.item_id)
          .single();
          
        if (packData) {
          totalAmount += packData.price * item.quantity;
          packName = packData.name || "";
        }
      }
    }
    
    // Determine estimated days based on pack price or name
    let estimatedDays;
    if (packName.toLowerCase().includes('base') || packName.toLowerCase().includes('básico')) {
      estimatedDays = 10; // 10 days for base pack
    } else if (totalAmount < 2000) {
      estimatedDays = 20; // 20 days for packs under 2000€
    } else {
      estimatedDays = 30; // 30 days for packs 2000€ or more
    }
    
    console.log(`Estimated project duration: ${estimatedDays} days based on total: ${totalAmount}€ and pack: ${packName}`);

    // Calcular la fecha estimada de finalización
    const today = new Date();
    const startDate = new Date(today);
    const expectedEndDate = new Date(today);
    expectedEndDate.setDate(expectedEndDate.getDate() + estimatedDays);

    // Crear el proyecto
    const { data: project, error: projectError } = await supabase
      .from('client_projects')
      .insert({
        name: projectName,
        description: `Proyecto creado a partir de la orden ${orderId}`,
        user_id: order.user_id,
        order_id: orderId,
        status: 'pending',
        estimated_completion_days: estimatedDays,
        start_date: startDate.toISOString(),
        expected_end_date: expectedEndDate.toISOString()
      })
      .select('id')
      .single();

    if (projectError || !project) {
      console.error("Error creating project:", projectError);
      toast.error("Error al crear el proyecto");
      return null;
    }

    // Creating milestones - use service role client to bypass RLS
    console.log("Creating milestones for the new project");
    
    try {
      // Create appropriate milestones based on project size
      const milestones = [];
      
      // Always add start milestone
      milestones.push({
        project_id: project.id,
        title: "Inicio del proyecto",
        description: "Recopilación de requisitos iniciales",
        is_completed: true,
        position: 1,
        due_date: startDate.toISOString()
      });
      
      // For all projects, add design milestone
      const designDate = new Date(startDate);
      designDate.setDate(designDate.getDate() + Math.round(estimatedDays * 0.3));
      milestones.push({
        project_id: project.id,
        title: "Entrega de diseño",
        description: "Aprobación del diseño visual",
        is_completed: false,
        position: 2,
        due_date: designDate.toISOString()
      });
      
      // For all projects, add development milestone
      const devDate = new Date(startDate);
      devDate.setDate(devDate.getDate() + Math.round(estimatedDays * 0.6));
      milestones.push({
        project_id: project.id,
        title: "Desarrollo",
        description: "Implementación de funcionalidades",
        is_completed: false,
        position: 3,
        due_date: devDate.toISOString()
      });
      
      // For larger projects (20+ days), add testing milestone
      if (estimatedDays >= 20) {
        const testDate = new Date(startDate);
        testDate.setDate(testDate.getDate() + Math.round(estimatedDays * 0.8));
        milestones.push({
          project_id: project.id,
          title: "Pruebas y revisión",
          description: "Testing y ajustes finales",
          is_completed: false,
          position: 4,
          due_date: testDate.toISOString()
        });
      }
      
      // Always add final delivery milestone
      milestones.push({
        project_id: project.id,
        title: "Entrega final",
        description: "Lanzamiento del proyecto",
        is_completed: false,
        position: estimatedDays >= 20 ? 5 : 4,
        due_date: expectedEndDate.toISOString()
      });

      // Use Supabase Edge Function instead of direct insert to bypass RLS
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-project-milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          projectId: project.id,
          milestones: milestones
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

    } catch (error) {
      console.error("Error creating milestones:", error);
      toast.error("Advertencia: Error al crear algunos hitos del proyecto");
      // No fallamos por este error, ya que el proyecto se creó correctamente
    }

    try {
      // Crear un cuestionario vacío para el proyecto
      const { error: formError } = await supabase
        .from('project_forms')
        .insert({
          project_id: project.id,
          form_type: 'questionnaire',
          title: 'Cuestionario del proyecto',
          description: 'Por favor complete la información solicitada para su proyecto.',
          form_data: {},
          is_completed: false
        });

      if (formError) {
        console.error("Error creating questionnaire:", formError);
        // No fallamos por este error, ya que el proyecto se creó correctamente
      }
    } catch (error) {
      console.error("Error creating project form:", error);
    }

    try {
      // Use Supabase Edge Function to create the first project update
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-project-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          projectId: project.id,
          title: "¡Proyecto iniciado!",
          content: `Tu proyecto "${projectName}" ha sido creado con éxito. El plazo estimado de entrega es de ${estimatedDays} días. Pronto nos pondremos en contacto contigo para los siguientes pasos.`,
          adminId: "00000000-0000-0000-0000-000000000000",
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

    } catch (error) {
      console.error("Error creating initial project update:", error);
      // We continue even if this fails
    }

    console.log("Project successfully created with ID:", project.id);
    return project.id;
  } catch (error) {
    console.error("Error in createProjectFromOrder:", error);
    toast.error("Error al crear el proyecto");
    return null;
  }
};