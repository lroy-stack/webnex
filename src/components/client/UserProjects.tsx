import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, ExternalLink, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getUserProjects, ClientProject } from "@/services/projectService";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserProjectsProps {
  isLoading?: boolean;
}

export const UserProjects: React.FC<UserProjectsProps> = ({ isLoading = false }) => {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(isLoading);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        console.log("Loading user projects...");
        const userProjects = await getUserProjects();
        console.log("User projects loaded:", userProjects.length);
        setProjects(userProjects);
        
        // Check for unread updates for each project
        const counts: Record<string, number> = {};
        for (const project of userProjects) {
          const { data } = await supabase
            .from('project_updates')
            .select('*', { count: 'exact' })
            .eq('project_id', project.id)
            .eq('is_read', false);
          
          counts[project.id] = data?.length || 0;
        }
        setUnreadCounts(counts);
      } catch (error) {
        console.error("Error loading projects", error);
        toast.error("Error al cargar los proyectos");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const formatDate = (date: string | null) => {
    if (!date) return "Por determinar";
    return format(new Date(date), "d 'de' MMMM, yyyy", { locale: es });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs">
            <Clock className="h-3 w-3" />
            Pendiente
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
            <Clock className="h-3 w-3" />
            En progreso
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
            <CheckCircle className="h-3 w-3" />
            Completado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 text-xs">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <Card className="overflow-hidden border">
        <div className="absolute inset-x-0 h-1 top-0 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <CardHeader>
          <CardTitle>Mis Proyectos</CardTitle>
          <CardDescription>Cargando proyectos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="border rounded-md p-4 animate-pulse bg-muted/30 h-24"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border">
      <div className="absolute inset-x-0 h-1 top-0 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
      <CardHeader>
        <CardTitle>Mis Proyectos</CardTitle>
        <CardDescription>Listado de tus proyectos activos</CardDescription>
      </CardHeader>
      <CardContent>
        {projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-lg overflow-hidden bg-card">
                <div className="p-4 border-b flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{project.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(project.status)}
                      <span className="text-xs text-muted-foreground">
                        Creado: {formatDate(project.created_at)}
                      </span>
                      {unreadCounts[project.id] > 0 && (
                        <Badge variant="default" className="text-xs">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {unreadCounts[project.id]} nuevas
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Link to={`/project/${project.id}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver
                      {unreadCounts[project.id] > 0 && (
                        <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                          {unreadCounts[project.id]}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                </div>
                <div className="p-4 bg-muted/5">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Progreso</span>
                    <span className="font-medium">{project.progress_percentage || 0}%</span>
                  </div>
                  <div className="w-full bg-muted/20 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${project.progress_percentage || 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Inicio: {formatDate(project.start_date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Fin estimado: {formatDate(project.expected_end_date)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No tienes proyectos activos</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
