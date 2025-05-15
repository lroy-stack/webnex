
import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ProjectProgress as ProjectProgressType } from "@/services/clientDashboardService";
import { CheckCircle2, Circle, Calendar, Flag, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface ProjectProgressProps {
  projectProgress: ProjectProgressType | null;
  isLoading: boolean;
}

export const ProjectProgressCard: React.FC<ProjectProgressProps> = ({
  projectProgress,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card className="overflow-hidden border">
        <div className="absolute inset-x-0 h-1 top-0 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
        <CardHeader>
          <CardTitle>Progreso del Proyecto</CardTitle>
          <CardDescription>Cargando información...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-muted-foreground">Cargando...</span>
              <span className="font-medium">-</span>
            </div>
            <div className="h-2 bg-muted animate-pulse rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-md p-4 animate-pulse bg-muted/30 h-16"></div>
            <div className="border rounded-md p-4 animate-pulse bg-muted/30 h-16"></div>
          </div>
          
          <div className="space-y-2">
            <div className="h-4 bg-muted/60 animate-pulse rounded-full w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-muted/60 animate-pulse"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted/60 animate-pulse rounded-full w-3/4"></div>
                    <div className="h-3 bg-muted/40 animate-pulse rounded-full w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!projectProgress) {
    return (
      <Card className="overflow-hidden border">
        <div className="absolute inset-x-0 h-1 top-0 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
        <CardHeader>
          <CardTitle>Progreso del Proyecto</CardTitle>
          <CardDescription>No hay información de progreso disponible</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay proyectos activos en este momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  // Determinar color de progreso basado en el porcentaje
  const getProgressColor = (percentage: number) => {
    if (percentage < 25) return "bg-amber-500";
    if (percentage < 50) return "bg-blue-500";
    if (percentage < 75) return "bg-indigo-500";
    return "bg-green-500";
  };

  return (
    <Card className="overflow-hidden border transition-all duration-300 hover:shadow-md">
      <div className="absolute inset-x-0 h-1 top-0 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Progreso del Proyecto</CardTitle>
          <CardDescription>
            {projectProgress.name || "Estado actual de tu proyecto web"}
          </CardDescription>
        </div>
        {projectProgress.project_id && (
          <Link to={`/project/${projectProgress.project_id}`}>
            <Button variant="outline" size="sm" className="gap-1">
              <ExternalLink className="h-4 w-4" />
              Ver Detalles
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-muted-foreground font-medium">Progreso total</span>
            <span className="font-semibold">{projectProgress.progress_percentage}%</span>
          </div>
          <Progress 
            value={projectProgress.progress_percentage} 
            className="h-2.5 transition-all duration-500" 
            indicatorClassName={getProgressColor(projectProgress.progress_percentage)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div className="rounded-lg bg-muted/10 border p-3 flex items-start gap-3 transition-all hover:bg-muted/20">
            <div className="mt-0.5">
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha de inicio</p>
              <p className="font-medium">{formatDate(projectProgress.start_date)}</p>
            </div>
          </div>
          
          <div className="rounded-lg bg-muted/10 border p-3 flex items-start gap-3 transition-all hover:bg-muted/20">
            <div className="mt-0.5">
              <Flag className="h-4 w-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Finalización estimada</p>
              <p className="font-medium">{formatDate(projectProgress.estimated_end_date)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            <span className="h-1 w-4 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"></span>
            Hitos del proyecto
          </h4>
          <div className="space-y-4">
            {projectProgress.milestones.length > 0 ? (
              projectProgress.milestones.map((milestone) => (
                <div 
                  key={milestone.id} 
                  className={`flex items-start p-3 rounded-lg border ${
                    milestone.is_completed ? 'bg-muted/5' : 'bg-muted/10'
                  } transition-all duration-200 hover:bg-muted/20`}
                >
                  {milestone.is_completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${milestone.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                      {milestone.title}
                    </p>
                    {milestone.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {milestone.description}
                      </p>
                    )}
                    {milestone.due_date && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Fecha objetivo: {formatDate(milestone.due_date)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-6 rounded-lg bg-muted/10 border">
                <p className="text-sm text-muted-foreground">No hay hitos definidos para este proyecto</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
