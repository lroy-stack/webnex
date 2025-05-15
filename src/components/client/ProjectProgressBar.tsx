
import React from "react";
import { Progress } from "@/components/ui/progress";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";
import { CardTitle, CardDescription, CardHeader, CardContent, Card } from "@/components/ui/card";
import { Clock, Calendar, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProjectProgressBarProps {
  projectName: string;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  status: string;
}

export function ProjectProgressBar({
  projectName,
  startDate,
  endDate,
  progress,
  status,
}: ProjectProgressBarProps) {
  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Por determinar";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Calculate time remaining if dates are available
  const getTimeRemaining = () => {
    if (!startDate || !endDate) return null;
    
    const now = new Date();
    const endDateParsed = new Date(endDate);
    
    // If end date is in the past
    if (endDateParsed < now) {
      if (status === 'completed') {
        return "Proyecto completado";
      }
      return "Fecha límite superada";
    }
    
    return formatDistance(endDateParsed, now, { 
      addSuffix: true,
      locale: es 
    });
  };

  const renderStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending': return "Pendiente";
      case 'in_progress': return "En progreso";
      case 'completed': return "Completado";
      case 'cancelled': return "Cancelado";
      default: return status;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400";
      case 'in_progress':
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400";
      case 'completed':
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400";
      case 'cancelled':
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const timeRemaining = getTimeRemaining();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{projectName}</CardTitle>
            <CardDescription className="mt-1">
              Progreso actual: {progress}%
            </CardDescription>
          </div>
          <Badge variant="outline" className={`${getStatusColor()} flex items-center gap-1`}>
            {renderStatusIcon()}
            <span>{getStatusText()}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="h-2 mt-2 mb-6" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Fecha de inicio</div>
              <div className="text-sm text-muted-foreground">
                {formatDate(startDate)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Fecha estimada de entrega</div>
              <div className="text-sm text-muted-foreground">
                {formatDate(endDate)}
              </div>
            </div>
          </div>
        </div>
        
        {timeRemaining && (
          <div className="mt-4 p-3 bg-muted/50 rounded-md">
            <p className="text-sm">
              {status === 'completed' ? "Proyecto completado" : 
               `Tiempo ${status === 'in_progress' ? 'restante' : 'estimado'}: ${timeRemaining}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
