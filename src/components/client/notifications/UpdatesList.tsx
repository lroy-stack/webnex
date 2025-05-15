
import React from "react";
import { Button } from "@/components/ui/button";
import { ProjectUpdate } from "@/services/projectService";
import { NotificationItem } from "./NotificationItem";
import { NotificationSkeleton } from "./NotificationSkeleton";
import { Bell } from "lucide-react";

interface UpdatesListProps {
  updates: ProjectUpdate[];
  loading: boolean;
  filterRead: boolean;
  onFilterToggle: () => void;
  onMarkAsRead: (updateId: string) => void;
  processingIds: Set<string>;
}

export const UpdatesList: React.FC<UpdatesListProps> = ({
  updates,
  loading,
  filterRead,
  onFilterToggle,
  onMarkAsRead,
  processingIds
}) => {
  return (
    <>
      <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onFilterToggle}
          className="text-xs"
        >
          {filterRead ? "Mostrar todas" : "Solo sin leer"}
        </Button>
      </div>
      
      {loading && updates.length === 0 ? (
        <>
          <NotificationSkeleton />
          <NotificationSkeleton />
        </>
      ) : updates.length > 0 ? (
        updates.map(update => (
          <NotificationItem
            key={update.id}
            title={update.title}
            content={update.content}
            date={update.created_at}
            isRead={update.is_read}
            onMarkAsRead={() => onMarkAsRead(update.id)}
            type="update"
            isProcessing={processingIds.has(update.id)}
          />
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto opacity-20 mb-2" />
          <p>No hay actualizaciones para mostrar</p>
          {filterRead && (
            <p className="text-sm mt-1">Todas las actualizaciones han sido leídas</p>
          )}
        </div>
      )}
    </>
  );
};
