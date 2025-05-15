import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Send, Mail } from "lucide-react";
import { toast } from "sonner";
import { createClientInvitation } from "@/services/adminClientService";

const formSchema = z.object({
  businessName: z.string().min(2, "El nombre de la empresa es obligatorio"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Introduce un email válido"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const NewClientOnboarding = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  const handleBack = () => {
    navigate("/auth-myweb/clients");
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createClientInvitation(data);
      
      if (result.success) {
        toast.success("Invitación enviada con éxito", {
          description: `Se ha enviado un email de invitación a ${data.email}`,
        });
        navigate("/auth-myweb/clients");
      } else {
        toast.error("Error al enviar la invitación", {
          description: result.error || "Por favor, inténtalo de nuevo",
        });
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Error al enviar la invitación", {
        description: "Se ha producido un error al procesar tu solicitud",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <BreadcrumbNav />
          
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Invitar Nuevo Cliente</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Datos del cliente</CardTitle>
                  <CardDescription>
                    Introduce los datos del cliente para enviarle una invitación
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de la empresa*</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nombre de la empresa" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Nombre del contacto" 
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Apellidos</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Apellidos del contacto" 
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email*</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="correo@cliente.com" 
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="+34 612 345 678" 
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notas internas</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Notas para el equipo interno (el cliente no las verá)" 
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Esta información solo será visible para los administradores
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleBack}
                          disabled={isSubmitting}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        >
                          {isSubmitting ? (
                            <>Enviando...</>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Enviar invitación
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>¿Cómo funciona?</CardTitle>
                  <CardDescription>
                    Información sobre el proceso de invitación
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Este formulario permite invitar a un nuevo cliente a la plataforma, enviándole un email con un enlace de invitación.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Mail className="text-blue-500 mr-2 h-5 w-5" />
                      <h3 className="font-medium">Email de invitación</h3>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      El cliente recibirá un correo electrónico con:
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc pl-5 mt-1">
                      <li>Un enlace para registrarse en la plataforma</li>
                      <li>Su perfil ya estará pre-configurado</li>
                      <li>No necesitará completar el onboarding inicial</li>
                      <li>Podrá acceder directamente a su área de cliente</li>
                    </ul>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-lg p-4">
                    <h3 className="font-medium mb-1">Importante</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Asegúrate de que la dirección de email es correcta, ya que es la que se utilizará para el acceso a la plataforma.
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <p className="text-xs text-muted-foreground">
                      *La invitación será válida durante 7 días. Después de ese tiempo, caducará y deberás enviar una nueva.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default NewClientOnboarding;