
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageSquare, CalendarIcon } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getProjectUpdates, markProjectUpdateAsRead, getUnreadUpdatesCount, ProjectUpdate } from '@/services/projectService';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

interface ProjectUpdatesCardProps {
  projectId: string;
  onUpdateRead: () => void;
  unreadCount: number;
}

export const ProjectUpdatesCard = ({ projectId, onUpdateRead, unreadCount }: ProjectUpdatesCardProps) => {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    loadUpdates();
    
    // Subscribe to real-time updates for this project
    const updatesChannel = supabase
      .channel('project_updates_' + projectId)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'project_updates',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Real-time project update received:', payload);
          loadUpdates(); // Reload updates when changes occur
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(updatesChannel);
    };
  }, [projectId]);

  const loadUpdates = async () => {
    setIsLoading(true);
    try {
      console.log("Loading project updates for ID:", projectId);
      const updatesData = await getProjectUpdates(projectId);
      console.log(`Loaded ${updatesData.length} updates:`, updatesData);
      setUpdates(updatesData);
    } catch (error) {
      console.error("Error loading updates:", error);
      toast.error("Error al cargar las actualizaciones del proyecto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (updateId: string) => {
    try {
      console.log(`Marking update as read: ${updateId}`);
      const success = await markProjectUpdateAsRead(updateId);
      if (success) {
        // Update local state to mark this update as read
        setUpdates(currentUpdates => 
          currentUpdates.map(update => 
            update.id === updateId ? { ...update, is_read: true } : update
          )
        );
        
        // Trigger parent component to refresh unread count
        onUpdateRead();
        toast.success("Notificación marcada como leída");
      } else {
        toast.error("Error al marcar la actualización como leída");
      }
    } catch (error) {
      console.error("Error marking update as read:", error);
      toast.error("Error al marcar la actualización como leída");
    }
  };

  const showMore = () => {
    setVisibleCount(prev => prev + 3);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'd MMM yyyy', { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actualizaciones del Proyecto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span>Actualizaciones</span>
          </div>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {updates.length > 0 ? (
          <div className="space-y-4">
            {updates.slice(0, visibleCount).map(update => (
              <div 
                key={update.id}
                className={`p-3 border rounded-lg ${!update.is_read ? 'bg-primary/5 border-primary/20 dark:bg-primary/10' : 'bg-card'}`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium">
                      {update.title}
                      {!update.is_read && (
                        <Badge variant="secondary" className="ml-2 text-xs">Nueva</Badge>
                      )}
                    </h3>
                  </div>
                  
                  <p className="text-sm">{update.content}</p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>{formatDate(update.created_at)}</span>
                    </div>
                    
                    {!update.is_read && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-xs"
                        onClick={() => handleMarkAsRead(update.id)}
                      >
                        Marcar como leída
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {updates.length > visibleCount && (
              <Button 
                variant="outline" 
                className="w-full mt-2" 
                onClick={showMore}
              >
                Ver más actualizaciones
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No hay actualizaciones disponibles</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
