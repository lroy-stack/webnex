
import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProjectUpdate, ProjectMilestone } from "@/services/projectService";
import { TabControlled } from "./TabControlled";
import { UpdatesList } from "./UpdatesList";
import { MilestonesList } from "./MilestonesList";
import { CheckCheck } from "lucide-react";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  visibleUpdates: ProjectUpdate[];
  milestones: ProjectMilestone[];
  unreadCount: number;
  loading: boolean;
  filterRead: boolean;
  onFilterToggle: () => void;
  onUpdateRead: (updateId: string) => void;
  onMarkAllAsRead?: () => void;
  isMarkingAllAsRead: boolean;
  processingIds: Set<string>;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  projectId,
  visibleUpdates,
  milestones = [],
  unreadCount,
  loading,
  filterRead,
  onFilterToggle,
  onUpdateRead,
  onMarkAllAsRead,
  isMarkingAllAsRead,
  processingIds
}) => {
  const [activeTab, setActiveTab] = useState<string>("updates");
  
  // Set active tab based on unread count when component mounts or updates
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(unreadCount > 0 ? "updates" : "milestones");
    }
  }, [isOpen, unreadCount]);

  const updatesContent = (
    <UpdatesList
      updates={visibleUpdates}
      loading={loading}
      filterRead={filterRead}
      onFilterToggle={onFilterToggle}
      onMarkAsRead={onUpdateRead}
      processingIds={processingIds}
    />
  );

  const milestonesContent = (
    <MilestonesList
      milestones={milestones}
      loading={loading}
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col overflow-hidden">
        <div className="absolute inset-x-0 h-1 top-0 bg-gradient-to-r from-blue-400 to-purple-400"></div>
        
        <DialogHeader className="pb-2">
          <DialogTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span>Actualizaciones del proyecto</span>
              {unreadCount > 0 && (
                <span className="bg-destructive text-destructive-foreground rounded-full h-5 px-2 flex items-center justify-center text-xs">
                  {unreadCount} sin leer
                </span>
              )}
            </div>
            
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                disabled={isMarkingAllAsRead || unreadCount === 0}
                className="flex items-center text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                {isMarkingAllAsRead ? "Marcando..." : "Marcar todo como leído"}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-hidden">
          <TabControlled
            activeTab={activeTab}
            onTabChange={setActiveTab}
            unreadCount={unreadCount}
            updateContent={updatesContent}
            milestoneContent={milestonesContent}
          />
        </div>
        
        <DialogFooter className="pt-4 flex justify-end">
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
