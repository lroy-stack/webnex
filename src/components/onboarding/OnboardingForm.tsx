import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { LogOut, AlertTriangle, XCircle } from "lucide-react";

// Define form structure types
export type FormField = {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  description?: string;
};

export type FormTemplate = {
  id: string;
  form_type: string;
  title: string;
  description: string;
  structure: {
    fields: FormField[];
  };
};

export interface OnboardingFormProps {
  onComplete?: () => void;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({ onComplete }) => {
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { user, checkOnboardingStatus, signOut } = useAuth();
  
  // Exit dialog state
  const [showExitDialog, setShowExitDialog] = useState(false);
  // Sign out dialog state
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  // Load form templates from Supabase
  useEffect(() => {
    const fetchFormTemplates = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_onboarding_forms');
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          setFormTemplates(data);
        } else {
          toast.error("No se pudieron cargar los formularios de onboarding");
        }
      } catch (error) {
        console.error("Error loading onboarding forms:", error);
        toast.error("Error al cargar formularios");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFormTemplates();
  }, []);

  // Generate a form schema dynamically for the current step
  const generateFormSchema = (fields: FormField[]) => {
    const schemaFields: Record<string, any> = {};

    fields.forEach(field => {
      let fieldSchema;
      
      switch (field.type) {
        case 'text':
        case 'textarea':
          fieldSchema = field.required 
            ? z.string().min(1, { message: `${field.label} es requerido` })
            : z.string().optional();
          break;
        case 'email':
          fieldSchema = field.required 
            ? z.string().email({ message: "Email inválido" })
            : z.string().email({ message: "Email inválido" }).optional();
          break;
        case 'tel':
          fieldSchema = field.required 
            ? z.string().min(1, { message: `${field.label} es requerido` })
            : z.string().optional();
          break;
        case 'url':
          fieldSchema = field.required 
            ? z.string().url({ message: "URL inválida" })
            : z.string().url({ message: "URL inválida" }).optional().or(z.literal(''));
          break;
        case 'select':
          fieldSchema = field.required 
            ? z.string().min(1, { message: `${field.label} es requerido` })
            : z.string().optional();
          break;
        case 'checkbox-group':
          fieldSchema = z.array(z.string()).optional();
          break;
        default:
          fieldSchema = field.required 
            ? z.string().min(1, { message: `${field.label} es requerido` })
            : z.string().optional();
      }
      
      schemaFields[field.id] = fieldSchema;
    });

    return z.object(schemaFields);
  };

  // Create form for the current step
  const currentTemplate = formTemplates[currentStep];
  const currentFields = currentTemplate?.structure?.fields || [];
  const formSchema = currentTemplate ? generateFormSchema(currentFields) : z.object({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: formData[currentTemplate?.form_type] || {},
  });

  // When the current step changes, reset the form with the saved data
  useEffect(() => {
    if (currentTemplate && formData[currentTemplate.form_type]) {
      form.reset(formData[currentTemplate.form_type]);
    } else {
      form.reset({});
    }
  }, [currentStep, currentTemplate, form]);

  // Handler for "Exit" button
  const handleExit = () => {
    setShowExitDialog(true);
  };

  // Handler for confirming exit
  const handleConfirmExit = () => {
    // Set localStorage flag to indicate onboarding was skipped
    localStorage.setItem("onboardingSkipped", "true");
    setShowExitDialog(false);
    navigate("/app");
  };

  // Handler for "Sign Out" button
  const handleSignOut = () => {
    setShowSignOutDialog(true);
  };

  // Handler for confirming sign out
  const handleConfirmSignOut = async () => {
    // Remove the onboarding flag if it exists
    localStorage.removeItem("onboardingSkipped");
    await signOut();
    navigate("/");
  };

  // Handle next step
  const handleNext = async (data: any) => {
    // Save data for current step
    setFormData({
      ...formData,
      [currentTemplate.form_type]: data,
    });

    // Determine which data to send based on the current step
    const dataToSend: Record<string, any> = {};
    
    if (currentTemplate.form_type === 'profile_info') {
      dataToSend.profileInfo = data;
    } else if (currentTemplate.form_type === 'business_info') {
      dataToSend.businessInfo = data;
    } else if (currentTemplate.form_type === 'project_needs') {
      dataToSend.projectNeeds = data;
    }
    
    dataToSend.currentStep = currentStep;
    
    // Save data to Supabase
    setIsSaving(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      if (!token) {
        toast.error("Sesión expirada. Por favor, inicia sesión nuevamente.");
        navigate('/auth');
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Error: ${response.status}` }));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      // Move to next step if available, otherwise complete onboarding
      if (currentStep < formTemplates.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        completeOnboarding();
      }
    } catch (error) {
      console.error("Error saving form data:", error);
      toast.error(`Error al guardar los datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Complete the onboarding process
  const completeOnboarding = async () => {
    setIsSaving(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      if (!token) {
        toast.error("Sesión expirada. Por favor, inicia sesión nuevamente.");
        navigate('/auth');
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          isCompleted: true,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Error: ${response.status}` }));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      toast.success("¡Onboarding completado con éxito!");
      
      // Update the onboarding status in AuthContext
      await checkOnboardingStatus();
      
      // Remove any onboarding flags from localStorage
      localStorage.removeItem("onboardingSkipped");
      
      if (onComplete) {
        onComplete();
      }
      
      // Redirect to dashboard after completing onboarding
      navigate("/app");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error(`Error al completar el onboarding: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // If still loading or no templates available, show loading state
  if (isLoading || formTemplates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Cargando formulario de onboarding...</CardTitle>
            <CardDescription>Por favor espere mientras cargamos su experiencia de configuración.</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={30} className="w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return null; // Navigate handled in useEffect
  }

  // Render the current form step
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl flex flex-col">
        <CardHeader className="relative border-b pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{currentTemplate.title}</CardTitle>
              <CardDescription>{currentTemplate.description}</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExit} 
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Saltar
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut} 
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Cerrar sesión
              </Button>
            </div>
          </div>
          <Progress 
            value={((currentStep + 1) / formTemplates.length) * 100} 
            className="w-full mt-4" 
          />
        </CardHeader>
        
        <CardContent className="pt-6 flex-1 overflow-y-auto">
          <ScrollArea className="h-[calc(100vh-250px)] pr-4">
            <Form {...form}>
              <form id="onboardingForm" onSubmit={form.handleSubmit(handleNext)} className="space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentFields.map((field) => (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={field.id}
                        render={({ field: formField }) => (
                          <FormItem className="mb-4">
                            <FormLabel>{field.label} {field.required && <span className="text-destructive">*</span>}</FormLabel>
                            {field.type === 'text' && (
                              <FormControl>
                                <Input
                                  placeholder={field.placeholder}
                                  {...formField}
                                />
                              </FormControl>
                            )}
                            
                            {field.type === 'textarea' && (
                              <FormControl>
                                <Textarea
                                  placeholder={field.placeholder}
                                  {...formField}
                                />
                              </FormControl>
                            )}
                            
                            {field.type === 'tel' && (
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder={field.placeholder}
                                  {...formField}
                                />
                              </FormControl>
                            )}
                            
                            {field.type === 'email' && (
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder={field.placeholder}
                                  {...formField}
                                />
                              </FormControl>
                            )}
                            
                            {field.type === 'url' && (
                              <FormControl>
                                <Input
                                  type="url"
                                  placeholder={field.placeholder}
                                  {...formField}
                                />
                              </FormControl>
                            )}
                            
                            {field.type === 'select' && (
                              <FormControl>
                                <Select
                                  onValueChange={formField.onChange}
                                  value={formField.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una opción" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options?.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            )}
                            
                            {field.type === 'checkbox-group' && (
                              <div className="space-y-3">
                                {field.options?.map((option) => {
                                  const value = formField.value || [];
                                  return (
                                    <div className="flex items-center space-x-2" key={option}>
                                      <Checkbox
                                        id={`${field.id}-${option}`}
                                        checked={value.includes(option)}
                                        onCheckedChange={(checked) => {
                                          const updatedValue = checked
                                            ? [...value, option]
                                            : value.filter((val: string) => val !== option);
                                          formField.onChange(updatedValue);
                                        }}
                                      />
                                      <label
                                        htmlFor={`${field.id}-${option}`}
                                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {option}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            <FormMessage />
                            {field.description && (
                              <FormDescription>
                                {field.description}
                              </FormDescription>
                            )}
                          </FormItem>
                        )}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </form>
            </Form>
          </ScrollArea>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-4 border-t">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isSaving}
            >
              Anterior
            </Button>
          </div>
          
          <Button 
            type="submit"
            form="onboardingForm"
            disabled={isSaving}
          >
            {isSaving 
              ? "Guardando..." 
              : currentStep < formTemplates.length - 1 
                ? "Siguiente" 
                : "Completar"
            }
          </Button>
        </CardFooter>
      </Card>

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Deseas saltar la configuración inicial?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>Si saltas ahora, podrás continuar más tarde pero tus cambios no guardados se perderán.</p>
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-800/50">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Completar el proceso de configuración es importante para aprovechar al máximo la plataforma.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit}>
              Salir de todas formas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sign out confirmation dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Si cierras sesión ahora, tendrás que volver a identificarte para continuar con el proceso de configuración.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSignOut}>
              Cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OnboardingForm;