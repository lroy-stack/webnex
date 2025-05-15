
import React, { useState, useEffect } from "react";
import { getUnreadUpdatesCount } from "@/services/projectService";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface ProjectUpdatesBadgeProps {
  projectId?: string;  // Made optional for backward compatibility
  className?: string;
  onCountUpdate?: (count: number) => void;
}

export const ProjectUpdatesBadge: React.FC<ProjectUpdatesBadgeProps> = ({ 
  projectId, 
  className,
  onCountUpdate 
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUnreadUpdates = async () => {
      try {
        // If no projectId is provided, we can't fetch unread updates
        if (!projectId) {
          setLoading(false);
          return;
        }
        
        const count = await getUnreadUpdatesCount(projectId);
        console.log(`Unread count for project ${projectId}: ${count}`);
        setUnreadCount(count);
        
        // Notify parent component of the count if callback exists
        if (onCountUpdate) {
          onCountUpdate(count);
        }
      } catch (error) {
        console.error("Error checking unread updates:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUnreadUpdates();

    // Set up real-time subscription to project_updates table
    if (projectId) {
      // Subscribe to new updates
      const newUpdatesChannel = supabase
        .channel(`project_updates_new_${projectId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'project_updates',
            filter: `project_id=eq.${projectId}`
          },
          () => {
            console.log("New update detected, refreshing count");
            checkUnreadUpdates();
          }
        )
        .subscribe();
        
      // Subscribe to update status changes (read/unread)
      const updateStatusChannel = supabase
        .channel(`project_updates_status_${projectId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'project_updates',
            filter: `project_id=eq.${projectId}`
          },
          (payload) => {
            // If is_read was updated from false to true
            if (payload.old && payload.new && 
                payload.old.is_read === false && 
                payload.new.is_read === true) {
              console.log("Update marked as read, refreshing count");
              checkUnreadUpdates();
            }
          }
        )
        .subscribe();

      // Check for new updates every minute
      const interval = setInterval(checkUnreadUpdates, 60000);
      
      return () => {
        clearInterval(interval);
        supabase.removeChannel(newUpdatesChannel);
        supabase.removeChannel(updateStatusChannel);
      };
    }
  }, [projectId, onCountUpdate]);

  if (loading || unreadCount === 0) {
    return null;
  }

  return (
    <Badge variant="destructive" className={className}>
      {unreadCount}
    </Badge>
  );
};
