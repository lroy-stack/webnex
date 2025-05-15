
import React, { useMemo } from "react";
import { ProjectMilestone } from "@/services/projectService";
import { NotificationItem } from "./NotificationItem";
import { NotificationSkeleton } from "./NotificationSkeleton";
import { Calendar } from "lucide-react";

interface MilestonesListProps {
  milestones: ProjectMilestone[];
  loading: boolean;
}

export const MilestonesList: React.FC<MilestonesListProps> = ({
  milestones,
  loading
}) => {
  // Sort milestones by position - memoized to avoid unnecessary sorts
  const sortedMilestones = useMemo(() => 
    [...milestones].sort((a, b) => 
      (a.position || 0) - (b.position || 0)
    ), 
    [milestones]
  );

  return (
    <>
      {loading ? (
        <>
          <NotificationSkeleton />
          <NotificationSkeleton />
        </>
      ) : sortedMilestones.length > 0 ? (
        sortedMilestones.map((milestone, index) => (
          <NotificationItem
            key={milestone.id}
            title={milestone.title}
            content={milestone.description || ""}
            date={milestone.due_date || milestone.created_at}
            isRead={true} // Milestones don't have read/unread status
            isCompleted={milestone.is_completed}
            type="milestone"
            position={index + 1}
            totalSteps={sortedMilestones.length}
          />
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto opacity-20 mb-2" />
          <p>No hay hitos definidos para este proyecto</p>
        </div>
      )}
    </>
  );
};
