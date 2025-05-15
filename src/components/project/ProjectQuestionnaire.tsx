
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Loader2, CheckCircle } from "lucide-react";
import { 
  getProjectQuestionnaire, 
  getQuestionnaireTemplate, 
  saveQuestionnaireResponses 
} from "@/services/projectService";

interface ProjectQuestionnaireProps {
  projectId: string;
}

interface QuestionnaireField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  conditional?: {
    field: string;
    value: string;
  };
}

const ProjectQuestionnaire: React.FC<ProjectQuestionnaireProps> = ({ projectId }) => {
  const [questionnaire, setQuestionnaire] = useState<any | null>(null);
  const [questions, setQuestions] = useState<QuestionnaireField[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (projectId) {
      loadQuestionnaire();
    }
  }, [projectId]);

  const loadQuestionnaire = async () => {
    setLoading(true);
    try {
      // Obtener el formulario del cuestionario
      const form = await getProjectQuestionnaire(projectId);
      setQuestionnaire(form);
      
      // Obtener la plantilla de preguntas
      const template = await getQuestionnaireTemplate();
      setQuestions(template);
      
      // Establecer las respuestas existentes
      if (form && form.form_data) {
        setResponses(form.form_data);
      }
    } catch (error) {
      console.error("Error loading questionnaire:", error);
      toast.error("Error al cargar el cuestionario");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSave = async (markAsCompleted = false) => {
    if (!questionnaire) return;
    
    // Validar campos requeridos
    const missingRequired = questions
      .filter(q => q.required && 
        (!q.conditional || 
          (q.conditional && responses[q.conditional.field] === q.conditional.value)
        )
      )
      .filter(q => !responses[q.id] || responses[q.id].trim() === '');
    
    if (missingRequired.length > 0) {
      toast.error(`Por favor completa todos los campos obligatorios (${missingRequired.length})`);
      return;
    }
    
    setSaving(true);
    try {
      const success = await saveQuestionnaireResponses(
        questionnaire.id,
        responses,
        markAsCompleted
      );
      
      if (success) {
        toast.success(markAsCompleted 
          ? "Cuestionario completado correctamente" 
          : "Respuestas guardadas correctamente");
        
        // Recargar el cuestionario para obtener el estado actualizado
        await loadQuestionnaire();
      }
    } catch (error) {
      console.error("Error saving questionnaire:", error);
      toast.error("Error al guardar las respuestas");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="min-h-[300px] flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (!questionnaire) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No se encontró el cuestionario para este proyecto.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Cuestionario del proyecto</span>
          {questionnaire.is_completed && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-sm">
              <CheckCircle className="h-3.5 w-3.5" />
              Completado
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Esta información nos ayudará a entender mejor tus necesidades y preferencias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map(question => {
          // Comprobar si la pregunta depende de otra y debe mostrarse
          if (question.conditional && responses[question.conditional.field] !== question.conditional.value) {
            return null;
          }
          
          return (
            <div key={question.id} className="space-y-2">
              <Label htmlFor={question.id}>
                {question.label}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {question.type === 'text' && (
                <Input
                  id={question.id}
                  value={responses[question.id] || ''}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  placeholder={question.placeholder}
                  disabled={questionnaire.is_completed}
                />
              )}
              
              {question.type === 'textarea' && (
                <Textarea
                  id={question.id}
                  value={responses[question.id] || ''}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  placeholder={question.placeholder}
                  rows={4}
                  disabled={questionnaire.is_completed}
                />
              )}
              
              {question.type === 'select' && question.options && (
                <Select
                  value={responses[question.id] || ''}
                  onValueChange={(value) => handleInputChange(question.id, value)}
                  disabled={questionnaire.is_completed}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {question.options.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        })}
      </CardContent>
      
      {!questionnaire.is_completed && (
        <CardFooter className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            Guardar borrador
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Completar cuestionario
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ProjectQuestionnaire;
