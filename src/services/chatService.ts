import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

export type ChatConversation = {
  id: string;
  client_id: string;
  admin_id: string | null;
  created_at: string;
  updated_at: string;
  title: string | null;
  status: 'active' | 'closed' | 'archived';
  category: string | null;
  closed_at: string | null;
  archived_at: string | null;
  client_deleted_at: string | null;
  admin_deleted_at: string | null;
  clientName?: string; // Campo derivado para el nombre del cliente
  clientEmail?: string; // Campo derivado para el email del cliente
  clientPhone?: string; // Campo derivado para el teléfono del cliente
  clientBusinessName?: string; // Campo derivado específico para nombre de empresa
  clientFullName?: string; // Campo derivado para nombre completo personal
  clientProfileId?: string; // Nuevo campo para el ID del perfil del cliente
  project_id?: string | null; // Nuevo campo para vincular con proyecto
  projectName?: string | null; // Campo derivado para el nombre del proyecto
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  is_admin: boolean;
  content: string;
  created_at: string;
  read_at: string | null;
  attachments: any | null;
  senderName?: string; // Campo derivado para el nombre del remitente
};

export type ChatRating = {
  id: string;
  conversation_id: string;
  rating: number;
  comments: string | null;
  created_at: string;
};

// Función para obtener todas las conversaciones (para administradores)
export const fetchAllConversations = async (projectId?: string | null): Promise<ChatConversation[]> => {
  try {
    let query = supabase
      .from("chat_conversations")
      .select("*")
      .is("admin_deleted_at", null);
    
    // Filter by project if provided
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    
    const { data: conversations, error } = await query.order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Obtener los nombres de los clientes para mostrarlos en la lista de conversaciones
    // Mejorado para incluir más información del cliente
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Utilizamos client_profiles_with_email para obtener el correo también
        const { data: profileData } = await supabase
          .from("client_profiles_with_email")
          .select("id, business_name, first_name, last_name, email, phone, user_id")
          .eq("user_id", conversation.client_id)
          .single();

        // Construct the clientName using available information
        let clientName = "Cliente";
        let clientFullName = "";
        let clientBusinessName = "";
        let clientEmail = "";
        let clientPhone = "";
        let clientProfileId = "";
        
        if (profileData) {
          clientEmail = profileData.email || "";
          clientPhone = profileData.phone || "";
          clientProfileId = profileData.id || "";
          
          // Construct full name first (prioritizing personal name)
          if (profileData.first_name || profileData.last_name) {
            clientFullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
            // Use full name as primary display name if available
            clientName = clientFullName;
          }
          
          // Store business name separately, but only use as clientName if no personal name exists
          if (profileData.business_name) {
            clientBusinessName = profileData.business_name;
            if (!clientFullName) {
              clientName = clientBusinessName;
            }
          }
        }

        // If there's a project, get project details
        let projectName = null;
        if (conversation.project_id) {
          const { data: projectData } = await supabase
            .from("client_projects")
            .select("name")
            .eq("id", conversation.project_id)
            .single();
          
          if (projectData) {
            projectName = projectData.name;
          }
        }

        return {
          ...conversation,
          clientName,
          clientEmail,
          clientPhone,
          clientBusinessName,
          clientFullName,
          clientProfileId,
          projectName
        } as ChatConversation;
      })
    );

    return enrichedConversations;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    toast.error("Error al cargar las conversaciones");
    return [];
  }
};

// Función para obtener las conversaciones de un cliente específico
export const fetchClientConversations = async (projectId?: string | null): Promise<ChatConversation[]> => {
  try {
    let query = supabase
      .from("chat_conversations")
      .select("*")
      .is("client_deleted_at", null);
    
    // Filter by project if provided
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    
    const { data: conversations, error } = await query.order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Enrich conversations with project names
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // If there's a project, get project name
        let projectName = null;
        if (conversation.project_id) {
          const { data: projectData } = await supabase
            .from("client_projects")
            .select("name")
            .eq("id", conversation.project_id)
            .single();
          
          if (projectData) {
            projectName = projectData.name;
          }
        }

        return {
          ...conversation,
          projectName
        } as ChatConversation;
      })
    );

    return enrichedConversations;
  } catch (error) {
    console.error("Error fetching client conversations:", error);
    toast.error("Error al cargar tus conversaciones");
    return [];
  }
};

// Función para obtener los mensajes de una conversación - actualizada para incluir más información del remitente
export const fetchMessages = async (conversationId: string): Promise<ChatMessage[]> => {
  try {
    // Obtener mensajes de la conversación
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    // Obtener información de la conversación para saber quién es el cliente
    const { data: conversation } = await supabase
      .from("chat_conversations")
      .select("client_id")
      .eq("id", conversationId)
      .single();

    // Si tenemos la conversación, obtenemos información del cliente
    // Mejorado para obtener más campos
    let clientProfile = null;
    if (conversation) {
      const { data: profile } = await supabase
        .from("client_profiles_with_email")
        .select("business_name, first_name, last_name, email, phone")
        .eq("user_id", conversation.client_id)
        .single();
      
      clientProfile = profile;
    }

    // Enriquecer los mensajes con nombres de remitentes
    const enrichedMessages = messages.map(message => {
      let senderName = message.is_admin ? "Admin" : "Cliente";
      
      // Si es un mensaje del cliente y tenemos su perfil, usamos su nombre
      if (!message.is_admin && clientProfile) {
        // Prioritize personal name (first_name + last_name)
        if (clientProfile.first_name || clientProfile.last_name) {
          const firstName = clientProfile.first_name || '';
          const lastName = clientProfile.last_name || '';
          senderName = `${firstName} ${lastName}`.trim();
        }
        // Only use business_name if no personal name is available
        else if (clientProfile.business_name) {
          senderName = clientProfile.business_name;
        }
      }
      
      return {
        ...message,
        senderName
      };
    });

    return enrichedMessages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    toast.error("Error al cargar los mensajes");
    return [];
  }
};

// Función para enviar un mensaje
export const sendMessage = async (
  conversationId: string, 
  content: string, 
  isAdmin: boolean,
  senderId: string,
  messageId?: string // Nuevo parámetro opcional para ID preexistente
): Promise<ChatMessage | null> => {
  try {
    // Usar el ID proporcionado o generar uno nuevo
    const finalMessageId = messageId || crypto.randomUUID();
    
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        id: finalMessageId,
        conversation_id: conversationId,
        content,
        is_admin: isAdmin,
        sender_id: senderId
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Actualizar el timestamp de la conversación
    await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    toast.error("Error al enviar el mensaje");
    return null;
  }
};

// Función para crear una nueva conversación
export const createConversation = async (
  clientId: string, 
  adminId: string | null = null,
  title: string | null = null,
  category: string | null = null,
  projectId: string | null = null // New parameter for project linking
): Promise<ChatConversation | null> => {
  try {
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        client_id: clientId,
        admin_id: adminId,
        title,
        category,
        status: 'active', // Default status is active
        project_id: projectId // Link to project if provided
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as ChatConversation;
  } catch (error) {
    console.error("Error creating conversation:", error);
    toast.error("Error al crear la conversación");
    return null;
  }
};

// Enhance function to count unread messages
export const countUnreadMessages = async (isAdmin: boolean): Promise<number> => {
  try {
    // First, get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    // Start building our query for unread messages
    let query = supabase
      .from("chat_messages")
      .select("id", { count: 'exact' })
      .is("read_at", null)
      .eq("is_admin", !isAdmin); // Messages from the other type of user

    // Add filter based on user type
    if (isAdmin) {
      // For admins, get all client messages where the conversation is not admin-deleted
      const { data: visibleConversations } = await supabase
        .from("chat_conversations")
        .select("id")
        .is("admin_deleted_at", null);
      
      const conversationIds = visibleConversations?.map(conv => conv.id) || [];
      if (conversationIds.length > 0) {
        query = query.in("conversation_id", conversationIds);
      } else {
        return 0; // No visible conversations
      }
    } else {
      // For clients, only get messages from their own conversations that are not client-deleted
      const { data: clientConversations } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("client_id", user.id)
        .is("client_deleted_at", null);
      
      const clientConversationIds = clientConversations?.map(conv => conv.id) || [];
      if (clientConversationIds.length > 0) {
        query = query.in("conversation_id", clientConversationIds);
      } else {
        return 0; // No conversations for this client
      }
    }

    const { count, error } = await query;

    if (error) {
      console.error("Error counting unread messages:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error counting unread messages:", error);
    return 0;
  }
};

// Mark messages as read with improved efficiency
export const markMessagesAsRead = async (
  conversationId: string,
  isAdmin: boolean
): Promise<void> => {
  try {
    // Get current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Mark all messages from the other party as read
    const { error } = await supabase
      .from("chat_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("is_admin", !isAdmin) // Messages from the other party
      .is("read_at", null);

    if (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
    
    // Broadcast an event to all clients to refresh unread counts
    const channel = supabase.channel('chat-update');
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'chat-read',
      payload: { conversationId }
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
};

// Función para cerrar una conversación
export const closeConversation = async (conversationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("chat_conversations")
      .update({ 
        status: 'closed',
        closed_at: new Date().toISOString()
      })
      .eq("id", conversationId);

    if (error) {
      throw error;
    }
    
    toast.success("Conversación finalizada correctamente");
    return true;
  } catch (error) {
    console.error("Error closing conversation:", error);
    toast.error("Error al finalizar la conversación");
    return false;
  }
};

// Función para archivar una conversación
export const archiveConversation = async (conversationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("chat_conversations")
      .update({ 
        status: 'archived',
        archived_at: new Date().toISOString()
      })
      .eq("id", conversationId);

    if (error) {
      throw error;
    }
    
    toast.success("Conversación archivada correctamente");
    return true;
  } catch (error) {
    console.error("Error archiving conversation:", error);
    toast.error("Error al archivar la conversación");
    return false;
  }
};

// Función para reabrir una conversación cerrada o archivada
export const reopenConversation = async (conversationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("chat_conversations")
      .update({ 
        status: 'active',
        closed_at: null,
        archived_at: null 
      })
      .eq("id", conversationId);

    if (error) {
      throw error;
    }
    
    toast.success("Conversación reabierta correctamente");
    return true;
  } catch (error) {
    console.error("Error reopening conversation:", error);
    toast.error("Error al reabrir la conversación");
    return false;
  }
};

// Nueva función para marcar una conversación como eliminada (soft delete)
export const softDeleteConversation = async (
  conversationId: string, 
  isAdmin: boolean
): Promise<boolean> => {
  try {
    const updateField = isAdmin ? 'admin_deleted_at' : 'client_deleted_at';
    
    const { error } = await supabase
      .from("chat_conversations")
      .update({ 
        [updateField]: new Date().toISOString()
      })
      .eq("id", conversationId);

    if (error) {
      throw error;
    }
    
    toast.success("Conversación eliminada correctamente");
    return true;
  } catch (error) {
    console.error("Error al eliminar la conversación:", error);
    toast.error("Error al eliminar la conversación");
    return false;
  }
};

// Función (legacy) para eliminar una conversación - ahora usa soft delete
export const deleteConversation = async (
  conversationId: string,
  isAdmin: boolean
): Promise<boolean> => {
  return softDeleteConversation(conversationId, isAdmin);
};

// Función para enviar una valoración
export const submitRating = async (
  conversationId: string,
  rating: number,
  comments: string | null = null
): Promise<ChatRating | null> => {
  try {
    const { data, error } = await supabase
      .from("chat_ratings")
      .insert({
        conversation_id: conversationId,
        rating,
        comments
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    toast.success("Gracias por tu valoración");
    return data;
  } catch (error) {
    console.error("Error submitting rating:", error);
    toast.error("Error al enviar la valoración");
    return null;
  }
};

// Función para obtener la valoración de una conversación
export const fetchConversationRating = async (conversationId: string): Promise<ChatRating | null> => {
  try {
    const { data, error } = await supabase
      .from("chat_ratings")
      .select("*")
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching rating:", error);
    return null;
  }
};

// Función para obtener estadísticas de valoraciones (para administradores)
export const fetchRatingsStats = async (): Promise<any> => {
  try {
    // Obtener promedio de valoraciones
    const { data: avgRating, error: avgError } = await supabase
      .from("chat_ratings")
      .select('rating')
      .then(result => {
        if (result.data && result.data.length > 0) {
          const sum = result.data.reduce((acc, curr) => acc + curr.rating, 0);
          return { data: sum / result.data.length, error: null };
        }
        return { data: 0, error: null };
      });

    if (avgError) {
      throw avgError;
    }

    // Obtener conteo por puntuación - usando un enfoque alternativo sin .group()
    const { data, error: countError } = await supabase
      .from("chat_ratings")
      .select('rating');
    
    if (countError) {
      throw countError;
    }
    
    // Procesar los resultados manualmente para contar por rating
    const ratingsCount = data ? Array.from({length: 5}, (_, i) => i + 1).map(rating => {
      const count = data.filter(item => item.rating === rating).length;
      return { rating, count };
    }) : [];

    return {
      average: avgRating || 0,
      countByRating: ratingsCount
    };
  } catch (error) {
    console.error("Error fetching ratings stats:", error);
    toast.error("Error al obtener estadísticas de valoraciones");
    return { average: 0, countByRating: [] };
  }
};