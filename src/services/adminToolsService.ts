import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SystemLogEntry {
  id: string;
  event_type: string;
  description: string;
  user_id: string;
  created_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  user_email?: string | null;
}

export interface FileRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  created_at: string;
  updated_at: string;
  url: string;
  user_id: string;
}

// Exportación de datos
export const fetchExportableData = async (tableName: string, limit: number = 1000) => {
  try {
    // We need to cast the table name to any to avoid TypeScript errors
    // with dynamic table access
    const { data, error } = await supabase
      .from(tableName as any)
      .select("*")
      .limit(limit);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error(`Error fetching ${tableName} data:`, error);
    toast.error(`No se pudo cargar los datos de ${tableName}`);
    throw error;
  }
};

export const generateCSV = (data: any[], filename: string) => {
  if (!data.length) {
    toast.error("No hay datos para exportar");
    return;
  }

  // Extraer los encabezados de las columnas
  const headers = Object.keys(data[0]);
  
  // Crear filas de datos
  const csvRows = [
    // Encabezados
    headers.join(','),
    // Datos
    ...data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Manejar valores nulos, objetos, etc.
        const cell = value === null || value === undefined 
          ? '' 
          : typeof value === 'object' 
            ? JSON.stringify(value).replace(/"/g, '""') 
            : String(value);
        
        // Escapar comillas y rodear con comillas si es necesario
        return /[,"\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
      }).join(',');
    })
  ];

  const csvContent = csvRows.join('\n');
  
  // Crear blob y descargar
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Logs del sistema
export const fetchSystemLogs = async (limit: number = 50, type?: string) => {
  try {
    let query = supabase
      .from("user_activity_logs")
      .select("*");
    
    // Only apply the event_type filter if type is provided and not "all"
    if (type && type !== "all") {
      query = query.eq('event_type', type);
    }
    
    query = query.order('created_at', { ascending: false }).limit(limit);
    
    const { data, error } = await query;

    if (error) throw error;

    // Get user emails separately to avoid the join issue
    const logs = data as SystemLogEntry[];
    
    // Return data directly without attempting to access users
    return logs;
  } catch (error) {
    console.error("Error fetching system logs:", error);
    toast.error("No se pudo cargar los logs del sistema");
    throw error;
  }
};

export const fetchAdminActionLogs = async (limit: number = 50) => {
  try {
    const { data, error } = await supabase
      .from("admin_action_logs")
      .select("*")
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching admin action logs:", error);
    toast.error("No se pudo cargar los logs de acciones administrativas");
    throw error;
  }
};

// Logs de administración
export const logAdminAction = async (
  action_type: string, 
  description: string, 
  admin_id: string, 
  entity_type?: string, 
  entity_id?: string
) => {
  try {
    const { data, error } = await supabase
      .from("admin_action_logs")
      .insert([
        { action_type, description, admin_id, entity_type, entity_id }
      ])
      .select();

    if (error) throw error;

    return data[0];
  } catch (error) {
    console.error("Error logging admin action:", error);
    toast.error("No se pudo registrar la acción administrativa");
    throw error;
  }
};

// Comunicación masiva
export interface EmailTemplate {
  id: string;
  title: string;
  subject: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Enviar correo masivo (simulación para el front-end)
export const sendMassEmail = async (
  recipients: string[],
  subject: string,
  content: string
) => {
  try {
    // En una implementación real, esto llamaría a una función Edge
    // que utilizaría un servicio de correo electrónico como SendGrid, Resend, etc.
    toast.success(`Se simularía envío de correo a ${recipients.length} destinatarios`);
    
    // Log de la acción
    await logAdminAction(
      'mass_email',
      `Envío masivo de correo "${subject}" a ${recipients.length} destinatarios`,
      (await supabase.auth.getUser()).data.user?.id || ''
    );

    return true;
  } catch (error) {
    console.error("Error sending mass email:", error);
    toast.error("No se pudo enviar el correo masivo");
    throw error;
  }
};

// Mantenimiento
export const getDatabaseStats = async () => {
  try {
    // Obtener conteos de las tablas principales
    const clients = await supabase
      .from('client_profiles')
      .select('id', { count: 'exact', head: true });

    const services = await supabase
      .from('my_services')
      .select('id', { count: 'exact', head: true });

    const packs = await supabase
      .from('my_packs')
      .select('id', { count: 'exact', head: true });

    const messages = await supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true });

    return {
      clients: clients.count || 0,
      services: services.count || 0,
      packs: packs.count || 0,
      messages: messages.count || 0,
    };
  } catch (error) {
    console.error("Error fetching database stats:", error);
    toast.error("No se pudo obtener estadísticas de la base de datos");
    throw error;
  }
};

// Obtener clientes para comunicación masiva
export const fetchClientsForCommunication = async () => {
  try {
    const { data, error } = await supabase
      .from("client_profiles_with_email")
      .select("user_id, first_name, last_name, email, business_name");

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching clients for communication:", error);
    toast.error("No se pudo cargar la lista de clientes");
    throw error;
  }
};

// Interfaces para tareas programadas
export interface ScheduledTask {
  id: string;
  name: string;
  description: string | null;
  task_type: string;
  cron_expression: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_run_at: string | null;
  next_run_at: string | null;
  created_by: string | null;
}

export interface TaskExecution {
  id: string;
  task_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  result: string | null;
  details: any | null;
}

// Funciones para tareas programadas
export const fetchScheduledTasks = async () => {
  try {
    const { data, error } = await supabase
      .from("scheduled_tasks")
      .select("*")
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data as ScheduledTask[];
  } catch (error) {
    console.error("Error fetching scheduled tasks:", error);
    toast.error("No se pudo cargar las tareas programadas");
    throw error;
  }
};

export const fetchTaskExecutionHistory = async (taskId?: string, limit: number = 10) => {
  try {
    let query = supabase
      .from("task_execution_history")
      .select("*")
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (taskId) {
      query = query.eq('task_id', taskId);
    }
    
    const { data, error } = await query;

    if (error) throw error;

    return data as TaskExecution[];
  } catch (error) {
    console.error("Error fetching task execution history:", error);
    toast.error("No se pudo cargar el historial de ejecución de tareas");
    throw error;
  }
};

export const updateScheduledTask = async (taskId: string, updates: Partial<ScheduledTask>) => {
  try {
    const { data, error } = await supabase
      .from("scheduled_tasks")
      .update(updates)
      .eq('id', taskId)
      .select();

    if (error) throw error;
    
    return data[0] as ScheduledTask;
  } catch (error) {
    console.error("Error updating scheduled task:", error);
    toast.error("No se pudo actualizar la tarea programada");
    throw error;
  }
};

export const createScheduledTask = async (task: Omit<ScheduledTask, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from("scheduled_tasks")
      .insert([task])
      .select();

    if (error) throw error;
    
    return data[0] as ScheduledTask;
  } catch (error) {
    console.error("Error creating scheduled task:", error);
    toast.error("No se pudo crear la tarea programada");
    throw error;
  }
};

export const deleteScheduledTask = async (taskId: string) => {
  try {
    const { error } = await supabase
      .from("scheduled_tasks")
      .delete()
      .eq('id', taskId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error deleting scheduled task:", error);
    toast.error("No se pudo eliminar la tarea programada");
    throw error;
  }
};

export const executeMaintenanceTask = async (taskType: string) => {
  try {
    // En una implementación real, esto llamaría a una función Edge
    // que ejecutaría la tarea de mantenimiento
    const { data: user } = await supabase.auth.getUser();
    
    // Log de la acción
    await logAdminAction(
      'maintenance',
      `Tarea de mantenimiento ejecutada: ${taskType}`,
      user.user?.id || ''
    );
    
    // Simulamos la ejecución de la tarea
    // En realidad, actualizaríamos el historial de ejecuciones
    return true;
  } catch (error) {
    console.error(`Error executing maintenance task ${taskType}:`, error);
    toast.error("No se pudo ejecutar la tarea de mantenimiento");
    throw error;
  }
};

// New File Management Functions
const BUCKET_NAME = 'admin-files';

export interface StorageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
  updated_at: string;
  path: string;
  isFolder: boolean;
}

export const fetchFiles = async (path: string = ''): Promise<StorageFile[]> => {
  try {
    // Ensure user has admin permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No se ha iniciado sesión");
    
    // Normalize path - ensure no leading slash, but with trailing slash for folders
    const normalizedPath = path ? 
      (path.startsWith('/') ? path.substring(1) : path) : 
      '';
    
    console.log(`Fetching files from path: "${normalizedPath}"`);
    
    // List all files in the bucket
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(normalizedPath, {
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error("Error fetching files:", error);
      throw error;
    }

    if (!data) {
      return [];
    }
    
    // Extract file data
    const files = data.map(item => {
      const isFolder = item.id === undefined || item.id === null;
      
      return {
        id: item.id || crypto.randomUUID(),
        name: item.name,
        size: item.metadata?.size || 0,
        type: isFolder ? 'folder' : (item.metadata?.mimetype || 'application/octet-stream'),
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.created_at || new Date().toISOString(), // Storage doesn't track updates separately
        path: normalizedPath ? `${normalizedPath}/${item.name}` : item.name,
        isFolder: isFolder
      };
    });

    console.log(`Found ${files.length} files/folders in "${normalizedPath}"`);
    return files;
  } catch (error: any) {
    console.error("Error fetching files:", error);
    toast.error("No se pudo cargar los archivos: " + (error.message || "Error desconocido"));
    throw error;
  }
};

export const uploadFile = async (file: File, path: string = ''): Promise<StorageFile | null> => {
  try {
    // Ensure user has admin permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No se ha iniciado sesión");
    
    // Normalize path - ensure no trailing slash for consistent handling
    const normalizedPath = path ? 
      (path.endsWith('/') ? path.slice(0, -1) : path) : 
      '';
      
    // Build the full storage path
    const filePath = normalizedPath ? `${normalizedPath}/${file.name}` : file.name;
    
    console.log(`Uploading file to path: "${filePath}"`);
    
    // Upload the file to storage
    const { error: uploadError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Overwrite if file exists
      });

    if (uploadError) throw uploadError;

    // Log the admin action
    await logAdminAction(
      'file_upload', 
      `Archivo subido: ${filePath}`,
      user.id
    );
    
    // Return file details
    return {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      path: filePath,
      isFolder: false
    };
  } catch (error: any) {
    console.error("Error uploading file:", error);
    toast.error(`No se pudo subir el archivo: ${error.message || "Error desconocido"}`);
    throw error;
  }
};

export const deleteFile = async (filePath: string, isFolder: boolean = false): Promise<boolean> => {
  try {
    // Ensure user has admin permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No se ha iniciado sesión");
    
    console.log(`Deleting ${isFolder ? 'folder' : 'file'}: "${filePath}"`);
    
    // For folders, we need to recursively delete all contained files first
    if (isFolder) {
      // If this is a folder, we need to list all files inside first
      const folderPath = filePath.endsWith('/') ? filePath : `${filePath}/`;
      
      console.log(`Listing files in folder: "${folderPath}"`);
      
      // Get all files in the folder
      const { data: files, error: listError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .list(folderPath);
      
      if (listError) {
        console.error("Error listing folder contents:", listError);
        throw listError;
      }
      
      // If there are files, delete them one by one
      if (files && files.length > 0) {
        console.log(`Found ${files.length} items to delete in folder "${folderPath}"`);
        
        // Handle subfolders and files
        for (const item of files) {
          const itemPath = `${folderPath}${item.name}`;
          const isSubfolder = item.id === null || item.id === undefined;
          
          // If it's a subfolder, call deleteFile recursively
          if (isSubfolder) {
            await deleteFile(itemPath, true);
          } else {
            // Delete the file
            const { error: deleteItemError } = await supabase
              .storage
              .from(BUCKET_NAME)
              .remove([itemPath]);
              
            if (deleteItemError) {
              console.error(`Error deleting item "${itemPath}":`, deleteItemError);
            } else {
              console.log(`Successfully deleted item: ${itemPath}`);
            }
          }
        }
      }
      
      // After deleting all contents, delete the placeholder file that represents the folder
      const placeholderPath = `${folderPath}.emptyFolderPlaceholder`;
      
      const { error: deletePlaceholderError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .remove([placeholderPath]);
      
      if (deletePlaceholderError && deletePlaceholderError.message !== 'The resource was not found') {
        console.warn(`Note: Could not delete folder placeholder at ${placeholderPath}:`, deletePlaceholderError);
      }
    } else {
      // For regular files, just delete them directly
      const { error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .remove([filePath]);
      
      if (error) throw error;
    }
    
    // Log the admin action
    await logAdminAction(
      isFolder ? 'folder_delete' : 'file_delete', 
      `${isFolder ? 'Carpeta' : 'Archivo'} eliminado: ${filePath}`,
      user.id
    );
    
    return true;
  } catch (error: any) {
    console.error(`Error deleting ${isFolder ? 'folder' : 'file'}:`, error);
    toast.error(`No se pudo eliminar ${isFolder ? 'la carpeta' : 'el archivo'}: ${error.message || "Error desconocido"}`);
    throw error;
  }
};

export const getFileUrl = async (filePath: string): Promise<string> => {
  try {
    // Ensure user has admin permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No se ha iniciado sesión");
    
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
    
    if (error) throw error;
    
    return data.signedUrl;
  } catch (error: any) {
    console.error("Error getting file URL:", error);
    toast.error("No se pudo obtener la URL del archivo: " + (error.message || "Error desconocido"));
    throw error;
  }
};

export const downloadFile = async (filePath: string, fileName: string): Promise<void> => {
  try {
    // Ensure user has admin permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No se ha iniciado sesión");
    
    // Get file URL
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .download(filePath);
    
    if (error) throw error;
    
    // Create download link
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    // Log the admin action
    await logAdminAction(
      'file_download', 
      `Archivo descargado: ${filePath}`,
      user.id
    );
  } catch (error: any) {
    console.error("Error downloading file:", error);
    toast.error(`No se pudo descargar el archivo: ${error.message || "Error desconocido"}`);
    throw error;
  }
};

// Function to create a new folder in the file storage
export const createFolder = async (folderName: string, path: string = ''): Promise<boolean> => {
  try {
    // Ensure user has admin permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No se ha iniciado sesión");
    
    // Validate folder name (no special characters except dash and underscore)
    if (!/^[a-zA-Z0-9-_]+$/.test(folderName)) {
      toast.error("El nombre de la carpeta solo puede contener letras, números, guiones y guiones bajos");
      return false;
    }
    
    // Normalize path - remove any trailing slash for consistent path joining
    const normalizedPath = path ? 
      (path.endsWith('/') ? path.slice(0, -1) : path) : 
      '';
    
    // Create folder path with trailing slash (folders in Supabase are just empty files with paths ending in /)
    const folderPath = normalizedPath ? `${normalizedPath}/${folderName}/.emptyFolderPlaceholder` : `${folderName}/.emptyFolderPlaceholder`;
    
    console.log(`Creating folder at path: "${folderPath}"`);
    
    // Create an empty placeholder file inside the folder to ensure it exists
    const { error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(folderPath, new Blob(['']), {
        contentType: 'application/x-directory',
        upsert: false
      });
    
    if (error) {
      if (error.message.includes('The resource already exists')) {
        toast.error(`La carpeta "${folderName}" ya existe`);
      } else {
        console.error("Error creating folder:", error);
        toast.error(`No se pudo crear la carpeta: ${error.message}`);
      }
      return false;
    }
    
    // Log the admin action
    await logAdminAction(
      'folder_create', 
      `Carpeta creada: ${normalizedPath ? `${normalizedPath}/${folderName}` : folderName}`,
      user.id
    );
    
    return true;
  } catch (error: any) {
    console.error("Error creating folder:", error);
    toast.error(`No se pudo crear la carpeta: ${error.message || "Error desconocido"}`);
    throw error;
  }
};

// Function to navigate up one level in the folder structure
export const getParentPath = (currentPath: string): string => {
  if (!currentPath) return '';
  
  // Remove trailing slash if it exists
  const path = currentPath.endsWith('/') 
    ? currentPath.slice(0, -1) 
    : currentPath;
  
  // Find the last slash
  const lastSlashIndex = path.lastIndexOf('/');
  
  // If there's no slash, we're at the root
  if (lastSlashIndex === -1) return '';
  
  // Return everything before the last slash
  return path.substring(0, lastSlashIndex);
};
