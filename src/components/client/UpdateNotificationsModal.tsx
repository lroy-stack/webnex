
import React, { useEffect, useState, useCallback } from "react";
import { NotificationCenter } from "@/components/client/notifications/NotificationCenter";
import { ProjectUpdate, ProjectMilestone, markProjectUpdateAsRead } from "@/services/projectService";
import { toast } from "sonner";

interface UpdateNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  updates: ProjectUpdate[];
  milestones?: ProjectMilestone[];
  onUpdateRead: () => void;
}

export function UpdateNotificationsModal({
  isOpen,
  onClose,
  projectId,
  updates,
  milestones = [],
  onUpdateRead,
}: UpdateNotificationsModalProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const [localUpdates, setLocalUpdates] = useState<ProjectUpdate[]>([]);
  const [filterRead, setFilterRead] = useState(true); // Default to filtering (showing only unread)

  // Sync local state with props when props change or modal opens
  useEffect(() => {
    if (isOpen && updates && updates.length > 0) {
      const deepCopy = JSON.parse(JSON.stringify(updates)) as ProjectUpdate[];
      setLocalUpdates(deepCopy);
      
      const filtered = deepCopy.filter(update => !update.is_read);
      setUnreadCount(filtered.length);
      console.log(`UpdateNotificationsModal: Found ${filtered.length} unread updates on open`);
    }
  }, [updates, isOpen]);

  // Get filtered updates based on current filter setting
  const getVisibleUpdates = useCallback(() => {
    if (filterRead) {
      // Only show unread updates
      return localUpdates.filter(update => !update.is_read);
    }
    // Show all updates
    return localUpdates;
  }, [localUpdates, filterRead]);

  const handleMarkAsRead = async (updateId: string) => {
    if (processingIds.has(updateId)) return;
    
    setProcessingIds(prev => new Set([...prev, updateId]));
    setIsLoading(true);
    
    try {
      const success = await markProjectUpdateAsRead(updateId);
      if (success) {
        console.log(`Update ${updateId} marked as read successfully`);
        
        // Update local state immediately but create a new array reference
        setLocalUpdates(prev => 
          prev.map(update => 
            update.id === updateId ? { ...update, is_read: true } : update
          )
        );
        
        setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success("Notificación marcada como leída");
        
        // Also notify parent to refresh data for other components
        onUpdateRead();
      } else {
        console.error(`Failed to mark update ${updateId} as read`);
        toast.error("No se pudo marcar la notificación como leída");
      }
    } catch (error) {
      console.error("Error marking update as read:", error);
      toast.error("Error al marcar como leída");
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(updateId);
        return newSet;
      });
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (isMarkingAllAsRead || unreadCount === 0) return;
    
    setIsMarkingAllAsRead(true);
    
    try {
      const unreadUpdates = localUpdates.filter(update => !update.is_read);
      let successCount = 0;
      let failedIds: string[] = [];
      
      for (const update of unreadUpdates) {
        // Avoid marking updates that are already being processed
        if (processingIds.has(update.id)) continue;
        
        const success = await markProjectUpdateAsRead(update.id);
        if (success) {
          successCount++;
          
          // Update individual items as they're marked as read
          setLocalUpdates(prev => 
            prev.map(u => 
              u.id === update.id ? { ...u, is_read: true } : u
            )
          );
        } else {
          failedIds.push(update.id);
        }
      }
      
      if (successCount > 0) {
        setUnreadCount(prev => Math.max(0, prev - successCount));
        toast.success(`${successCount} notificaciones marcadas como leídas`);
        
        // Notify parent component to refresh data
        onUpdateRead();
      }
      
      if (failedIds.length > 0) {
        console.error(`Failed to mark ${failedIds.length} updates as read:`, failedIds);
        toast.error(`No se pudieron marcar ${failedIds.length} notificaciones como leídas`);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Error al marcar notificaciones como leídas");
    } finally {
      setIsMarkingAllAsRead(false);
    }
  };

  const handleFilterToggle = () => {
    setFilterRead(!filterRead);
  };

  return (
    <NotificationCenter
      isOpen={isOpen}
      onClose={onClose}
      projectId={projectId}
      visibleUpdates={getVisibleUpdates()}
      milestones={milestones}
      unreadCount={unreadCount}
      loading={isLoading}
      filterRead={filterRead}
      onFilterToggle={handleFilterToggle}
      onUpdateRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      isMarkingAllAsRead={isMarkingAllAsRead}
      processingIds={processingIds}
    />
  );
}
