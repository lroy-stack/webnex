
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getProjectFormByType, ProjectForm } from '@/services/adminProjectService';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface AdminProjectQuestionnaireProps {
  projectId: string;
}

export const AdminProjectQuestionnaire: React.FC<AdminProjectQuestionnaireProps> = ({ projectId }) => {
  const [questionnaire, setQuestionnaire] = useState<ProjectForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQuestionnaire();
  }, [projectId]);

  const loadQuestionnaire = async () => {
    setIsLoading(true);
    try {
      console.log("Loading questionnaire for project:", projectId);
      const data = await getProjectFormByType(projectId, 'questionnaire');
      console.log("Loaded questionnaire data:", data);
      setQuestionnaire(data);
    } catch (error) {
      console.error("Error loading questionnaire:", error);
      toast.error("Error al cargar el cuestionario");
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormDataItem = (key: string, value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">No respondido</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (typeof value === 'object') {
      return (
        <pre className="bg-muted p-2 rounded text-xs overflow-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    
    return value.toString();
  };

  // Helper function to format label from key
  const formatLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cuestionario del Proyecto</CardTitle>
          <CardDescription>Cargando respuestas...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    );
  }

  if (!questionnaire || !questionnaire.form_data || Object.keys(questionnaire.form_data).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cuestionario del Proyecto</CardTitle>
          <CardDescription>
            {!questionnaire ? 
              "No se ha encontrado un cuestionario para este proyecto" : 
              "El cliente aún no ha completado el cuestionario"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay respuestas disponibles</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={loadQuestionnaire}
            >
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuestionario del Proyecto</CardTitle>
        <CardDescription>
          {questionnaire.is_completed 
            ? "El cliente ha completado el cuestionario" 
            : "El cliente ha respondido parcialmente el cuestionario"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(questionnaire.form_data).map(([key, value]) => (
            <div key={key} className="border-b pb-4 last:border-0">
              <h3 className="font-medium text-sm mb-1">{formatLabel(key)}</h3>
              <div className="text-base">{renderFormDataItem(key, value)}</div>
            </div>
          ))}
        </div>

        <Button 
          variant="outline" 
          className="mt-6"
          onClick={loadQuestionnaire}
        >
          Actualizar datos
        </Button>
      </CardContent>
    </Card>
  );
};
