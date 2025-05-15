import React, { useState, useEffect, useRef } from "react";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";
import { 
  fetchMessages, 
  sendMessage, 
  markMessagesAsRead, 
  ChatMessage,
  ChatConversation,
  fetchConversationRating
} from "@/services/chatService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, ExternalLink, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConversationActions } from "./ConversationActions";
import { ChatRatingDialog } from "./ChatRatingDialog";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatContainerProps {
  conversation: ChatConversation;
  isAdmin: boolean;
  onBack?: () => void;
  onConversationUpdated?: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ 
  conversation, 
  isAdmin, 
  onBack,
  onConversationUpdated 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [hasRating, setHasRating] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Crear un ref para el ID de la conversación activa para evitar cierres inadecuados
  const activeConversationId = useRef<string | null>(null);
  
  // Referencia para rastrear los IDs de los mensajes procesados
  const processedMessageIds = useRef<Set<string>>(new Set());
  
  // Referencia para el canal de suscripción
  const channelRef = useRef<any>(null);

  // Limpiar los mensajes y ref cuando cambia la conversación
  useEffect(() => {
    if (!conversation) return;
    
    // Limpiar estados anteriores
    setMessages([]);
    processedMessageIds.current.clear();
    activeConversationId.current = conversation.id;
    
    // Eliminar suscripción anterior si existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    const loadMessages = async () => {
      setIsLoading(true);
      
      if (conversation) {
        const messagesData = await fetchMessages(conversation.id);
        
        // Inicializar el conjunto de mensajes procesados
        processedMessageIds.current = new Set(messagesData.map(msg => msg.id));
        setMessages(messagesData);
        
        // Mark messages as read immediately when a conversation is viewed
        await markMessagesAsRead(conversation.id, isAdmin);

        // Verificar si la conversación tiene valoración
        const rating = await fetchConversationRating(conversation.id);
        setHasRating(!!rating);
      }
      setIsLoading(false);
    };

    loadMessages();
    
    // Configure real-time subscription for new messages
    if (conversation) {
      const channel = supabase
        .channel(`chat_messages:${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversation.id}`
          },
          async (payload) => {
            const newMessage = payload.new as ChatMessage;
            
            // Only process messages for the active conversation
            if (activeConversationId.current !== conversation.id) return;
            
            // Check if we've already processed this message
            if (!processedMessageIds.current.has(newMessage.id)) {
              // Add the ID to processed messages
              processedMessageIds.current.add(newMessage.id);
              
              // Update state safely
              setMessages(prevMessages => {
                // Double check to avoid duplicates
                if (prevMessages.some(msg => msg.id === newMessage.id)) {
                  return prevMessages;
                }
                return [...prevMessages, newMessage];
              });
              
              // If the message is from the other user, mark it as read immediately
              // This ensures messages are marked as read when you're actively viewing the conversation
              if (
                (isAdmin && !newMessage.is_admin) || 
                (!isAdmin && newMessage.is_admin)
              ) {
                await markMessagesAsRead(conversation.id, isAdmin);
              }
            }
          }
        )
        .subscribe();
      
      // Store channel reference
      channelRef.current = channel;
    }

    // Cleanup when unmounted or conversation changes
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversation, isAdmin]);

  const handleSendMessage = async (content: string) => {
    if (!user || !conversation) return;

    try {
      const messageId = crypto.randomUUID(); // Generar un ID único para el mensaje
      
      // Crear la estructura del mensaje localmente para mostrar inmediatamente
      const optimisticMessage: ChatMessage = {
        id: messageId,
        conversation_id: conversation.id,
        content,
        is_admin: isAdmin,
        sender_id: user.id,
        created_at: new Date().toISOString(),
        read_at: null,
        attachments: null
      };
      
      // Añadir el ID a la referencia de mensajes procesados antes de enviarlo
      processedMessageIds.current.add(messageId);
      
      // Actualizar la UI inmediatamente con el mensaje optimista
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      
      // Enviar el mensaje a la base de datos con el ID pre-generado
      await sendMessage(
        conversation.id,
        content,
        isAdmin,
        user.id,
        messageId  // Pasar el ID pre-generado
      );
      
      // No es necesario agregar el mensaje al estado aquí ya que llegará por la suscripción
      // y ya está en nuestra lista de procesados
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
  };

  const handleActionComplete = () => {
    if (onConversationUpdated) {
      onConversationUpdated();
    }
  };

  // Helper function to get client name with first_name and last_name as priority
  const getClientName = () => {
    // For client with full name display priority
    if (conversation.clientFullName) {
      return conversation.clientFullName;
    }
    
    // Fall back to business name if no full name
    if (conversation.clientBusinessName) {
      return conversation.clientBusinessName;
    }
    
    // Last resort
    return conversation.clientName || "Cliente";
  };

  // New helper function to render client information and links
  const renderClientInfo = () => {
    if (!isAdmin || !conversation.client_id) {
      return (
        <div>
          <h3 className="font-medium flex items-center gap-2">
            {isAdmin 
              ? getClientName()
              : conversation.title || "Soporte"}
            {getStatusBadge()}
          </h3>
          
          <p className="text-xs text-muted-foreground">
            {conversation.category 
              ? `Categoría: ${conversation.category}` 
              : "Sin categoría"
            }
          </p>
        </div>
      );
    }

    // Enhanced client information for admins
    return (
      <div>
        <h3 className="font-medium flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{getClientName()}</span>
          {getStatusBadge()}
        </h3>
        
        <div className="flex justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {conversation.category 
              ? `Categoría: ${conversation.category}` 
              : "Sin categoría"
            }
          </p>
          {conversation.clientEmail && (
            <p className="text-xs text-muted-foreground">
              {conversation.clientEmail}
            </p>
          )}
        </div>
      </div>
    );
  };

  // New helper function to render client action buttons
  const renderClientActions = () => {
    // Si no es admin o no hay ID de cliente, no mostrar acciones
    if (!isAdmin || !conversation.client_id) {
      return null;
    }
    
    // Usar clientProfileId si está disponible, si no, intentar con client_id
    const profileId = conversation.clientProfileId || conversation.client_id;
    
    return (
      <div className="flex items-center mr-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/auth-myweb/clients/${profileId}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver ficha de cliente</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/auth-myweb/clients/${profileId}/edit`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar cliente</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  const getStatusBadge = () => {
    switch (conversation.status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Activa</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Cerrada</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Archivada</Badge>;
      default:
        return null;
    }
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Selecciona una conversación o inicia una nueva
        </p>
      </div>
    );
  }

  return (
    <div className="chat-container h-full flex flex-col">
      {/* Cabecera de la conversación - Fija en la parte superior */}
      <div className="border-b p-3 bg-card flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-2">
          {isMobile && onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          {renderClientInfo()}
        </div>
        
        <div className="flex items-center gap-2">
          {renderClientActions()}
          
          {conversation.status === 'closed' && !hasRating && !isAdmin && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowRatingDialog(true)}
            >
              Valorar
            </Button>
          )}
          
          <ConversationActions 
            conversation={conversation}
            isAdmin={isAdmin}
            onActionComplete={handleActionComplete}
          />
        </div>
      </div>
      
      {/* Lista de mensajes - Contenedor con scroll */}
      <div className="chat-messages-container flex-1 min-h-0 overflow-y-auto">
        <ChatMessageList 
          messages={messages} 
          currentUserId={user?.id || ""} 
          isAdmin={isAdmin} 
          isLoading={isLoading} 
          clientName={getClientName()}
          conversationId={conversation.id}
        />
      </div>
      
      {/* Input para enviar mensajes - Fijo en la parte inferior */}
      <div className="chat-input-container flex-shrink-0 border-t">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isDisabled={conversation.status !== 'active'} 
        />
      </div>
      
      {/* Diálogo para valoración */}
      <ChatRatingDialog 
        conversationId={conversation.id}
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        onSubmitted={() => {
          setHasRating(true);
          if (onConversationUpdated) {
            onConversationUpdated();
          }
        }}
      />
    </div>
  );
};