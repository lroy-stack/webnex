import React from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface NotificationItemProps {
  title: string;
  content: string;
  date: string;
  isRead: boolean;
  isCompleted?: boolean;
  onMarkAsRead?: () => void;
  type: "update" | "milestone";
  position?: number;
  totalSteps?: number;
  isProcessing?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  title,
  content,
  date,
  isRead,
  isCompleted,
  onMarkAsRead,
  type,
  position,
  totalSteps,
  isProcessing
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMM yyyy", { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="relative">
      {type === "milestone" && position && totalSteps && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted-foreground/20 ml-6">
          {position > 1 && <div className="absolute top-0 w-full h-1 bg-primary rounded-full -mt-0.5"></div>}
          {position < totalSteps && <div className="absolute bottom-0 w-full h-1 bg-primary rounded-full -mb-0.5"></div>}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-background border-2 border-primary rounded-full"></div>
        </div>
      )}
      
      <div className={`p-3 border rounded-lg ${!isRead && type === "update" ? 'bg-primary/5 border-primary/20 dark:bg-primary/10' : 'bg-card'}`}>
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <h3 className="font-medium">
              {title}
            </h3>
            {type === "update" && !isRead && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={onMarkAsRead}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Cargando...</span>
                  </>
                ) : (
                  "Marcar como leída"
                )}
              </Button>
            )}
          </div>
          
          <p className="text-sm">{content}</p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>{formatDate(date)}</span>
            {type === "milestone" && isCompleted && (
              <span className="text-green-500">Completado</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
