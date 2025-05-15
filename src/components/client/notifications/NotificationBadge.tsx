
import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUnreadUpdatesCount } from "@/services/projectService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotificationBadgeProps {
  projectId: string;
  onClick: () => void;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  projectId,
  onClick,
  className
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  useEffect(() => {
    const checkUnreadUpdates = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }
      
      try {
        const count = await getUnreadUpdatesCount(projectId);
        setUnreadCount(count);
        setHasNewNotification(count > 0);
        console.log(`NotificationBadge: Found ${count} unread notifications for project ${projectId}`);
      } catch (error) {
        console.error("Error checking unread updates:", error);
        toast.error("No se pudieron cargar las notificaciones");
      } finally {
        setLoading(false);
      }
    };

    checkUnreadUpdates();

    // Set up real-time subscription to project_updates table
    // Listen specifically for new inserts which represent new notifications
    const insertChannel = supabase
      .channel(`notifications_inserts_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Focus on new notifications
          schema: 'public',
          table: 'project_updates',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log("New project update detected:", payload);
          checkUnreadUpdates();
          setHasNewNotification(true);
          // Show a toast notification to alert the user
          toast.info("Has recibido una nueva actualización del proyecto", {
            action: {
              label: "Ver",
              onClick: onClick
            }
          });
        }
      )
      .subscribe();

    // Listen for updates to existing notifications (e.g., marking as read)
    const updateChannel = supabase
      .channel(`notifications_updates_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Listen for updates to existing notifications
          schema: 'public',
          table: 'project_updates',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          console.log("Project update modified, refreshing notification count");
          checkUnreadUpdates();
        }
      )
      .subscribe();

    // Check every minute
    const interval = setInterval(checkUnreadUpdates, 60000);
    
    return () => {
      clearInterval(interval);
      supabase.removeChannel(insertChannel);
      supabase.removeChannel(updateChannel);
    };
  }, [projectId, onClick]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`relative p-2 ${hasNewNotification ? 'animate-pulse' : ''} ${className || ''}`}
      onClick={onClick}
    >
      <Bell className={`h-5 w-5 ${hasNewNotification ? 'text-primary' : ''}`} />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount}
        </Badge>
      )}
    </Button>
  );
};
