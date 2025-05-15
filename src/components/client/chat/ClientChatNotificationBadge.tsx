import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { countUnreadMessages } from "@/services/chatService";
import { supabase } from "@/integrations/supabase/client";

export const ClientChatNotificationBadge: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Load unread messages count
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (supabase.auth.getSession()) {
        const count = await countUnreadMessages(false);
        setUnreadCount(count);
      }
    };
    
    loadUnreadCount();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('public:chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          // Update count when new messages arrive
          const count = await countUnreadMessages(false);
          setUnreadCount(count);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: 'read_at=neq.null'
        },
        async () => {
          // Update count when messages are marked as read
          const count = await countUnreadMessages(false);
          setUnreadCount(count);
        }
      )
      .subscribe();

    // Create a custom update channel
    const updateChannel = supabase
      .channel('chat-update')
      .on('broadcast', { event: 'chat-read' }, async () => {
        // Manually update count on broadcast
        const count = await countUnreadMessages(false);
        setUnreadCount(count);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(updateChannel);
    };
  }, []);

  if (unreadCount === 0) return null;
  
  return (
    <Badge variant="destructive" className="h-6 min-w-[24px] flex items-center justify-center rounded-full">
      {unreadCount}
    </Badge>
  );
};