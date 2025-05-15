import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminProjectWithClient {
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
  // Client info
  first_name?: string;
  last_name?: string;
  business_name?: string;
  email?: string;
  order_total?: number;
  milestones: ProjectMilestone[];
  updates?: ProjectUpdate[];
  forms?: ProjectForm[];
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

// Add type for ProjectUpdate if it doesn't exist
export interface ProjectUpdate {
  id: string;
  project_id: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
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

export interface AdminProjectFilters {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Get all projects with client information and filters
export const getAllProjects = async (
  page: number = 1, 
  pageSize: number = 10,
  filters?: AdminProjectFilters
): Promise<{ data: AdminProjectWithClient[]; totalCount: number }> => {
  try {
    let query = supabase
      .from('admin_projects_view')
      .select('*', { count: 'exact' });
    
    // Apply filters if provided
    if (filters) {
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,business_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        // Add one day to include the end date
        const nextDay = new Date(filters.dateTo);
        nextDay.setDate(nextDay.getDate() + 1);
        query = query.lt('created_at', nextDay.toISOString());
      }
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query.order('created_at', { ascending: false }).range(from, to);
    
    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching projects:", error);
      toast.error("Error al cargar los proyectos");
      return { data: [], totalCount: 0 };
    }

    return { 
      data: data as AdminProjectWithClient[], 
      totalCount: count || 0 
    };
  } catch (error) {
    console.error("Error in getAllProjects:", error);
    toast.error("Error al cargar los proyectos");
    return { data: [], totalCount: 0 };
  }
};

// Get all projects with client information
export const getProjects = async (): Promise<AdminProjectWithClient[]> => {
  try {
    // Using the admin_projects_view to get projects with client info
    const { data, error } = await supabase
      .from('admin_projects_view')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      toast.error("Error al cargar los proyectos");
      return [];
    }

    return data as AdminProjectWithClient[];
  } catch (error) {
    console.error("Error in getProjects:", error);
    toast.error("Error al cargar los proyectos");
    return [];
  }
};

// Get project by ID with milestones, updates, and forms
export const getProjectDetails = async (projectId: string): Promise<AdminProjectWithClient | null> => {
  try {
    console.log("Fetching project details for ID:", projectId);
    
    // First, get the basic project data with client info
    const { data: project, error } = await supabase
      .from('admin_projects_view')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error("Error fetching project details:", error);
      toast.error("Error al cargar los detalles del proyecto");
      return null;
    }

    // Get project milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true });

    if (milestonesError) {
      console.error("Error fetching milestones:", milestonesError);
      toast.error("Error al cargar los hitos del proyecto");
    }

    // Get project updates
    const { data: updates, error: updatesError } = await supabase
      .from('project_updates')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (updatesError) {
      console.error("Error fetching updates:", updatesError);
      toast.error("Error al cargar las actualizaciones del proyecto");
    }

    // Get project forms (questionnaires, etc)
    const { data: forms, error: formsError } = await supabase
      .from('project_forms')
      .select('*')
      .eq('project_id', projectId);

    if (formsError) {
      console.error("Error fetching project forms:", formsError);
      toast.error("Error al cargar los formularios del proyecto");
    }

    return {
      ...project,
      milestones: milestones || [],
      updates: updates || [],
      forms: forms || []
    } as AdminProjectWithClient;
  } catch (error) {
    console.error("Error in getProjectDetails:", error);
    toast.error("Error al cargar los detalles del proyecto");
    return null;
  }
};

// Get project updates for admin panel with improved error handling
export const getProjectUpdates = async (projectId: string): Promise<ProjectUpdate[]> => {
  try {
    const { data, error } = await supabase
      .from('project_updates')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching project updates:", error);
      return [];
    }

    return data as ProjectUpdate[];
  } catch (error) {
    console.error("Error in getProjectUpdates:", error);
    return [];
  }
};

// Update project status with improved error handling and automatic notification creation
export const updateProjectStatus = async (
  projectId: string, 
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
): Promise<boolean> => {
  try {
    console.log(`Updating project ${projectId} status to ${status}`);
    
    const updates: any = { status };
    
    // If marking as completed, set the actual_end_date
    if (status === 'completed') {
      updates.actual_end_date = new Date().toISOString();
    }
    
    // If marking as in_progress and start_date is null, set it to today
    let startDate = null;
    let expectedEndDate = null;
    
    if (status === 'in_progress') {
      // First check if start_date is null
      const { data: project } = await supabase
        .from('client_projects')
        .select('start_date, estimated_completion_days')
        .eq('id', projectId)
        .single();
        
      if (!project?.start_date) {
        startDate = new Date().toISOString();
        updates.start_date = startDate;
        
        // Calculate expected end date based on estimated_completion_days
        if (project?.estimated_completion_days) {
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + project.estimated_completion_days);
          expectedEndDate = endDate.toISOString();
          updates.expected_end_date = expectedEndDate;
        }
      } else {
        startDate = project.start_date;
        
        // Get the expected_end_date
        const { data: projectEndDate } = await supabase
          .from('client_projects')
          .select('expected_end_date')
          .eq('id', projectId)
          .single();
        
        if (projectEndDate) {
          expectedEndDate = projectEndDate.expected_end_date;
        }
      }
    }

    const { error } = await supabase
      .from('client_projects')
      .update(updates)
      .eq('id', projectId);

    if (error) {
      console.error("Error updating project status:", error);
      toast.error(`Error al actualizar el estado: ${error.message}`);
      return false;
    }

    // If project is being accepted (status changed to in_progress), create a notification
    if (status === 'in_progress') {
      // Get admin user id for the notification
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("No authenticated admin user found for creating notification");
        return true; // Still return true as the status update was successful
      }

      // Get project details to use in the notification
      const { data: project } = await supabase
        .from('client_projects')
        .select('name')
        .eq('id', projectId)
        .single();
      
      if (!project) {
        console.error("Could not find project details for notification");
        return true; // Still return true as the status update was successful
      }

      // Format dates for the message
      const formatDate = (dateString: string | null) => {
        if (!dateString) return "fecha a determinar";
        const date = new Date(dateString);
        // Format date as DD/MM/YYYY
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      };

      // Create notification message
      const title = `¡Tu proyecto ha sido aceptado!`;
      const content = `Nos complace informarte que tu proyecto "${project.name}" ha sido aceptado y hemos comenzado a trabajar en él. La fecha de inicio es ${formatDate(startDate)} y la fecha estimada de finalización es ${formatDate(expectedEndDate)}. Te mantendremos informado sobre el progreso a través de estas notificaciones.`;
      
      // Create the update notification
      await createProjectUpdate(projectId, user.id, title, content);
      console.log("Created acceptance notification for project", projectId);
    }

    return true;
  } catch (error: any) {
    console.error("Error in updateProjectStatus:", error);
    toast.error(`Error al actualizar el estado: ${error.message || error}`);
    return false;
  }
};

// Delete a project
export const deleteProject = async (projectId: string): Promise<boolean> => {
  try {
    console.log(`Deleting project ${projectId}`);
    
    // First delete related records
    
    // 1. Delete project milestones
    const { error: milestonesError } = await supabase
      .from('project_milestones')
      .delete()
      .eq('project_id', projectId);
      
    if (milestonesError) {
      console.error("Error deleting project milestones:", milestonesError);
    }
    
    // 2. Delete project updates
    const { error: updatesError } = await supabase
      .from('project_updates')
      .delete()
      .eq('project_id', projectId);
      
    if (updatesError) {
      console.error("Error deleting project updates:", updatesError);
    }
    
    // 3. Delete project forms
    const { error: formsError } = await supabase
      .from('project_forms')
      .delete()
      .eq('project_id', projectId);
      
    if (formsError) {
      console.error("Error deleting project forms:", formsError);
    }
    
    // Finally delete the project itself
    const { error } = await supabase
      .from('client_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error("Error deleting project:", error);
      toast.error(`Error al eliminar el proyecto: ${error.message}`);
      return false;
    }

    toast.success("Proyecto eliminado correctamente");
    return true;
  } catch (error: any) {
    console.error("Error in deleteProject:", error);
    toast.error(`Error al eliminar el proyecto: ${error.message || error}`);
    return false;
  }
};

// Update project dates with improved error handling and validation
export const updateProjectDates = async (
  projectId: string, 
  startDate: string | null, 
  endDate: string | null
): Promise<boolean> => {
  try {
    console.log(`Updating project ${projectId} dates: start=${startDate}, end=${endDate}`);
    
    if (!startDate && !endDate) {
      toast.error("No se proporcionaron fechas para actualizar");
      return false;
    }
    
    const updates: any = {};
    
    if (startDate) updates.start_date = startDate;
    if (endDate) updates.expected_end_date = endDate;
    
    const { error } = await supabase
      .from('client_projects')
      .update(updates)
      .eq('id', projectId);

    if (error) {
      console.error("Error updating project dates:", error);
      toast.error(`Error al actualizar las fechas: ${error.message}`);
      return false;
    }
    
    toast.success("Fechas del proyecto actualizadas correctamente");
    return true;
  } catch (error: any) {
    console.error("Error in updateProjectDates:", error);
    toast.error(`Error al actualizar las fechas: ${error.message || error}`);
    return false;
  }
};

// Create or update a milestone with better error handling
export const createOrUpdateMilestone = async (
  milestone: Partial<ProjectMilestone> & { project_id: string }
): Promise<{ success: boolean, data?: ProjectMilestone, error?: string }> => {
  try {
    console.log("Creating/updating milestone:", milestone);
    
    if (milestone.id) {
      // Update existing milestone
      const { data, error } = await supabase
        .from('project_milestones')
        .update({
          title: milestone.title,
          description: milestone.description,
          due_date: milestone.due_date,
          is_completed: milestone.is_completed,
          position: milestone.position,
          updated_at: new Date().toISOString()
        })
        .eq('id', milestone.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating milestone:", error);
        return { success: false, error: error.message };
      }

      toast.success("Hito actualizado correctamente");
      return { success: true, data };
    } else {
      // Create new milestone
      const { data, error } = await supabase
        .from('project_milestones')
        .insert({
          project_id: milestone.project_id,
          title: milestone.title,
          description: milestone.description,
          due_date: milestone.due_date,
          is_completed: milestone.is_completed || false,
          position: milestone.position || 0
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating milestone:", error);
        return { success: false, error: error.message };
      }

      toast.success("Hito creado correctamente");
      return { success: true, data };
    }
  } catch (error: any) {
    console.error("Error in createOrUpdateMilestone:", error);
    return { success: false, error: error.message || "Error desconocido" };
  }
};

// Delete a milestone with proper error handling
export const deleteMilestone = async (milestoneId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('project_milestones')
      .delete()
      .eq('id', milestoneId);

    if (error) {
      console.error("Error deleting milestone:", error);
      toast.error(`Error al eliminar el hito: ${error.message}`);
      return false;
    }

    toast.success("Hito eliminado correctamente");
    return true;
  } catch (error: any) {
    console.error("Error in deleteMilestone:", error);
    toast.error(`Error al eliminar el hito: ${error.message || error}`);
    return false;
  }
};

// Create a project update with proper error handling
export const createProjectUpdate = async (
  projectId: string,
  adminId: string,
  title: string,
  content: string
): Promise<boolean> => {
  try {
    console.log("Creating project update:", { projectId, title });
    
    const { data, error } = await supabase
      .from('project_updates')
      .insert({
        project_id: projectId,
        admin_id: adminId,
        title,
        content,
        is_read: false
      })
      .select();

    if (error) {
      console.error("Error creating project update:", error);
      return false;
    }

    console.log("Project update created successfully:", data);
    return true;
  } catch (error) {
    console.error("Error in createProjectUpdate:", error);
    return false;
  }
};

// Get project forms by type (e.g., questionnaire)
export const getProjectFormByType = async (projectId: string, formType: string): Promise<ProjectForm | null> => {
  try {
    const { data, error } = await supabase
      .from('project_forms')
      .select('*')
      .eq('project_id', projectId)
      .eq('form_type', formType)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching ${formType} form:`, error);
      return null;
    }

    return data as ProjectForm;
  } catch (error) {
    console.error(`Error in getProjectFormByType (${formType}):`, error);
    return null;
  }
};
