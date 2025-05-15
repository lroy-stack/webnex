
import React from "react";
import { ChatConversation } from "@/services/chatService";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MessageCirclePlus, User, Briefcase } from "lucide-react";

interface ConversationListProps {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversation: ChatConversation) => void;
  onNewConversation?: () => void;
  isAdmin?: boolean;
  isLoading?: boolean;
  filter?: 'all' | 'active' | 'closed' | 'archived';
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  isAdmin = false,
  isLoading = false,
  filter = 'all'
}) => {
  // Filtrar conversaciones según el filtro seleccionado
  const filteredConversations = conversations.filter(conversation => {
    if (filter === 'all') return true;
    return conversation.status === filter;
  });

  // Formatear hora de actualización en formato relativo
  const formatUpdatedAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 24) {
      return format(date, "HH:mm", { locale: es });
    } else if (diffInHours < 48) {
      return "Ayer";
    } else {
      return format(date, "dd MMM", { locale: es });
    }
  };

  // Renderizar el estado de la conversación
  const renderStatus = (status: string) => {
    switch (status) {
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

  // Renderizar skeleton durante la carga
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[160px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Si no hay conversaciones, mostrar mensaje
  if (filteredConversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-muted-foreground text-center mb-4">
          {filter === 'all' 
            ? "No hay conversaciones disponibles" 
            : `No hay conversaciones ${filter === 'active' ? 'activas' : filter === 'closed' ? 'cerradas' : 'archivadas'}`
          }
        </p>
        
        {isAdmin && onNewConversation && (
          <Button 
            onClick={onNewConversation}
            variant="outline"
            className="flex gap-2 items-center"
          >
            <MessageCirclePlus className="h-4 w-4" />
            Nueva conversación
          </Button>
        )}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-0">
        {filteredConversations.map((conversation) => {
          // Check if the conversation is active
          const isActive = activeConversationId === conversation.id;
          
          // Determine who is displayed in the conversation list
          const displayName = isAdmin 
            ? (conversation.clientName || "Cliente sin nombre") 
            : (conversation.title || "Soporte");
          
          // Get additional client information for the tooltip
          const clientDetails = [];
          if (isAdmin) {
            if (conversation.clientEmail) clientDetails.push(conversation.clientEmail);
            if (conversation.clientPhone) clientDetails.push(conversation.clientPhone);
          }
          
          return (
            <div
              key={conversation.id}
              className={cn(
                "flex items-center p-3 cursor-pointer hover:bg-accent/50 border-b",
                isActive && "bg-accent"
              )}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isAdmin && <User className="h-4 w-4 text-muted-foreground" />}
                    <h4 className="font-medium truncate">{displayName}</h4>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatUpdatedAt(conversation.updated_at)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-1">
                  <div className="flex flex-col">
                    {/* Display project name if available */}
                    {conversation.projectName && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        <span className="truncate">{conversation.projectName}</span>
                      </div>
                    )}
                    
                    {/* Mostrar categoría si está disponible */}
                    <span className="text-xs text-muted-foreground truncate">
                      {conversation.category || "Sin categoría"}
                    </span>
                    
                    {/* Mostrar detalles adicionales del cliente (solo para administradores) */}
                    {isAdmin && clientDetails.length > 0 && (
                      <span className="text-xs text-muted-foreground truncate">
                        {clientDetails.join(' • ')}
                      </span>
                    )}
                  </div>
                  
                  {/* Mostrar estado */}
                  <div className="flex-shrink-0">
                    {renderStatus(conversation.status)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Botón para nueva conversación (solo para administradores) */}
        {isAdmin && onNewConversation && (
          <div className="p-3 border-t">
            <Button 
              onClick={onNewConversation}
              className="w-full flex gap-2 items-center"
              variant="outline"
            >
              <MessageCirclePlus className="h-4 w-4" />
              Nueva conversación
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
