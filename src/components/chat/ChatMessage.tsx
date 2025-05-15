import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChatMessage as ChatMessageType } from "@/services/chatService";
import { format } from "date-fns";
import { Check } from "lucide-react";
import { es } from "date-fns/locale";

interface ChatMessageProps {
  message: ChatMessageType;
  isOwnMessage: boolean;
  senderName?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage, senderName }) => {
  const messageDate = new Date(message.created_at);
  const formattedTime = format(messageDate, "HH:mm", { locale: es });
  
  // Determina si la fecha debe mostrarse (más de un día de diferencia)
  const shouldShowDate = () => {
    const now = new Date();
    const isToday = messageDate.getDate() === now.getDate() && 
                   messageDate.getMonth() === now.getMonth() && 
                   messageDate.getFullYear() === now.getFullYear();
    
    return !isToday;
  };

  const formattedDate = shouldShowDate() 
    ? format(messageDate, "d 'de' MMMM", { locale: es })
    : "";
    
  // Use message.senderName if available, or fallback to the prop
  // Priorizamos message.senderName que ya tiene el nombre completo del cliente
  const displayName = message.senderName || senderName || (isOwnMessage ? "Yo" : message.is_admin ? "Admin" : "Cliente");
  
  // Get initials for avatar fallback
  const getInitials = () => {
    if (isOwnMessage) return "YO";
    if (message.is_admin) return "AD";
    
    // Use message.senderName if available
    const nameToUse = message.senderName || senderName || "CL";
    
    if (nameToUse !== "Cliente" && nameToUse !== "CL") {
      const nameParts = nameToUse.split(" ");
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return nameToUse.substring(0, 2).toUpperCase();
    }
    
    return "CL";
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-[80%]`}>
        <Avatar className="h-8 w-8">
          <AvatarFallback className={isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"}>
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <div className={`
            rounded-lg p-3 
            ${isOwnMessage 
              ? 'bg-primary text-primary-foreground rounded-tr-none' 
              : 'bg-muted text-muted-foreground rounded-tl-none'}
          `}>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          
          {isOwnMessage && message.read_at && (
            <div className="flex items-center text-xs text-muted-foreground ml-1 mt-0.5">
              <Check className="h-3 w-3 mr-0.5" /> <Check className="h-3 w-3" />
            </div>
          )}
          
          <div className="flex items-center mt-1 text-xs text-muted-foreground">
            {!isOwnMessage && !message.is_admin && (
              <span className="font-medium mr-2">{displayName}</span>
            )}
            {shouldShowDate() && <span className="mr-1">{formattedDate},</span>}
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};