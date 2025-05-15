import React, { useEffect, useRef } from "react";
import { ChatMessage as ChatMessageComponent } from "./ChatMessage";
import { ChatMessage } from "@/services/chatService";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  isAdmin: boolean;
  isLoading?: boolean;
  clientName?: string;
  conversationId: string;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({ 
  messages, 
  currentUserId, 
  isAdmin,
  isLoading = false,
  clientName,
  conversationId
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll al final cuando se envían o reciben nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={`skeleton-${i}`} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <div className="flex gap-3 max-w-[80%]">
              <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
              <div>
                <Skeleton className="h-20 w-64 mb-1 rounded-xl" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="chat-messages-list p-4 w-full">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-6 rounded-lg bg-muted/10 border border-muted/20 shadow-sm max-w-md">
            <p className="text-muted-foreground mb-2">
              No hay mensajes. Inicia la conversación escribiendo un mensaje.
            </p>
            <div className="text-sm text-muted-foreground/70 italic">
              Nuestro equipo te atenderá lo antes posible.
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {messages.map((message) => {
          const isOwnMessage = (isAdmin && message.is_admin) || (!isAdmin && !message.is_admin);
          
          // Usamos message.senderName que ya tiene el nombre completo del remitente
          // Solo usamos clientName como respaldo si no hay senderName en el mensaje
          const senderNameToUse = (!isAdmin && !isOwnMessage && !message.is_admin) 
            ? (message.senderName || clientName) 
            : undefined;
            
          return (
            <ChatMessageComponent
              key={`msg-${message.id}`}
              message={message}
              isOwnMessage={isOwnMessage}
              senderName={senderNameToUse}
            />
          );
        })}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};