
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, PaperclipIcon } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isDisabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isDisabled = false }) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() === "" || isDisabled || isSending) {
      return;
    }
    
    setIsSending(true);
    onSendMessage(message);
    setMessage("");
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-3 bg-card">
      <div className="flex items-end gap-2 chat-input-container">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          className="min-h-[60px] resize-none"
          disabled={isDisabled}
          style={{ fontSize: '16px' }}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="shrink-0"
          disabled={isDisabled || message.trim() === ""}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};
