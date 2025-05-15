import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { clearSupabaseData } from "@/integrations/supabase/client";
import { isProtectedAdminEmail } from "@/utils/adminHelpers";

type AuthMode = "login" | "signup" | "reset-password";

export const AuthModal: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const { isAuthModalOpen, closeAuthModal } = useAuthStore();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setBusinessName("");
    setTermsAccepted(false);
    setPrivacyAccepted(false);
    setResetSent(false);
  };

  const toggleMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email) {
        toast({
          title: "Email requerido",
          description: "Por favor, introduce tu dirección de email",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await resetPassword(email);
      
      if (error) throw error;
      
      setResetSent(true);
      toast({
        title: "Email enviado",
        description: "Si tu email está registrado, recibirás un enlace para restablecer tu contraseña",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al intentar enviar el email de recuperación",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar aceptación de términos y políticas para registro
    if (mode === "signup" && (!termsAccepted || !privacyAccepted)) {
      toast({
        title: "Error de registro",
        description: "Debes aceptar los Términos de Servicio y la Política de Privacidad para continuar.",
        variant: "destructive",
      });
      return;
    }

    // Check if email is protected admin email
    if (mode === "signup" && isProtectedAdminEmail(email)) {
      toast({
        title: "Email no disponible",
        description: "Este email no está disponible para registro. Por favor, utiliza otro email.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Clear any existing Supabase data first to avoid JWT conflicts
      clearSupabaseData();
      
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({
          title: "Inicio de sesión exitoso",
          description: "Has iniciado sesión correctamente",
        });
        closeAuthModal();
      } else if (mode === "signup") {
        if (!businessName) {
          toast({
            title: "Error de registro",
            description: "Por favor, ingresa el nombre de tu negocio",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password, businessName);
        if (error) throw error;
        
        // Set welcome modal flag for new registrations
        localStorage.setItem("showWelcomeModal", "true");
        
        toast({
          title: "Registro exitoso",
          description: "Tu cuenta ha sido creada correctamente. Te guiaremos por el proceso de configuración.",
        });
        closeAuthModal();
        navigate('/'); // Redirect to home to show the welcome modal
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      // Verificamos si el error es porque el email ya existe pero está marcado como eliminado
      if (error.message?.includes("User already registered") || error.message?.includes("already registered")) {
        // Verificamos si el email está disponible para registro (eliminado lógicamente)
        try {
          const checkResponse = await fetch(`https://xlemleldxfgarrcoffkq.supabase.co/rest/v1/rpc/email_available_for_signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZW1sZWxkeGZnYXJyY29mZmtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDQ4MTIsImV4cCI6MjA2MjI4MDgxMn0.91Xoso5UE_TvdRQh2iBCCR0yiZYsU0o6iiq5WlWHjdk',
            },
            body: JSON.stringify({ p_email: email }),
          });
          
          const result = await checkResponse.json();
          
          if (result === true) {
            // Email disponible para registro (fue eliminado antes)
            toast({
              title: "Email disponible",
              description: "Tu email está disponible para registro. Por favor intenta registrarte nuevamente.",
              variant: "default",
            });
          } else {
            // Email ya en uso por una cuenta activa
            toast({
              title: "Email ya registrado",
              description: "Este email ya está en uso. Por favor inicia sesión o utiliza otro email.",
              variant: "destructive",
            });
          }
        } catch (checkError) {
          console.error("Error verificando email:", checkError);
          toast({
            title: "Error de autenticación",
            description: error.message || "Ha ocurrido un error durante la autenticación",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error de autenticación",
          description: error.message || "Ha ocurrido un error durante la autenticación",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={closeAuthModal}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/20 border-0 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
            {mode === "login" ? "Iniciar sesión" : 
             mode === "signup" ? "Crear cuenta" : 
             "Recuperar contraseña"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="w-full mx-auto py-4">
          {mode === "reset-password" ? (
            <div>
              {!resetSent ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-white/70 dark:bg-gray-800/50 border-purple-200 dark:border-purple-800/50 focus:border-purple-400 focus:ring-purple-400"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    Hemos enviado un email con instrucciones para restablecer tu contraseña. 
                    Por favor revisa tu bandeja de entrada.
                  </p>
                  <Button 
                    onClick={() => toggleMode("login")} 
                    className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Volver al inicio de sesión
                  </Button>
                </div>
              )}
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => toggleMode("login")}
                  className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:underline flex items-center justify-center mx-auto"
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Volver al inicio de sesión
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/70 dark:bg-gray-800/50 border-purple-200 dark:border-purple-800/50 focus:border-purple-400 focus:ring-purple-400"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/70 dark:bg-gray-800/50 border-purple-200 dark:border-purple-800/50 focus:border-purple-400 focus:ring-purple-400"
                  disabled={isLoading}
                />
              </div>
              
              {mode === "signup" && (
                <>
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Nombre de tu negocio
                    </label>
                    <Input
                      id="businessName"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                      className="w-full bg-white/70 dark:bg-gray-800/50 border-purple-200 dark:border-purple-800/50 focus:border-purple-400 focus:ring-purple-400"
                      disabled={isLoading}
                    />
                  </div>
                  
                  {/* Checkboxes para términos y condiciones */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="modal-terms" 
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                        className="text-purple-600 border-purple-400"
                      />
                      <label htmlFor="modal-terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300">
                        Acepto los <Link to="/terms-of-service" className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" onClick={(e) => e.stopPropagation()}>Términos de Servicio</Link>
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="modal-privacy" 
                        checked={privacyAccepted}
                        onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                        className="text-purple-600 border-purple-400"
                      />
                      <label htmlFor="modal-privacy" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300">
                        Acepto la <Link to="/privacy-policy" className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" onClick={(e) => e.stopPropagation()}>Política de Privacidad</Link>
                      </label>
                    </div>
                  </div>
                </>
              )}
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={isLoading || (mode === "signup" && (!termsAccepted || !privacyAccepted))}
              >
                {isLoading
                  ? "Procesando..."
                  : mode === "login"
                  ? "Iniciar sesión"
                  : "Crear cuenta"}
              </Button>
              
              {mode === "login" && (
                <div className="text-center">
                  <button
                    onClick={() => toggleMode("reset-password")}
                    className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:underline"
                    disabled={isLoading}
                    type="button"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
            </form>
          )}
          
          {mode !== "reset-password" && (
            <div className="mt-6 text-center">
              <button
                onClick={() => toggleMode(mode === "login" ? "signup" : "login")}
                className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:underline"
                disabled={isLoading}
                type="button"
              >
                {mode === "login"
                  ? "¿No tienes cuenta? Regístrate"
                  : "¿Ya tienes cuenta? Inicia sesión"}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};