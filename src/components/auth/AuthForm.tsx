import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { clearSupabaseData } from "@/integrations/supabase/client";
import { isProtectedAdminEmail } from "@/utils/adminHelpers";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  isInvitationFlow?: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({ isInvitationFlow = false }) => {
  const [mode, setMode] = useState<AuthMode>(isInvitationFlow ? "signup" : "login");
  const [email, setEmail] = useState(isInvitationFlow ? localStorage.getItem("invitation_email") || "" : "");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingInvitation, setIsProcessingInvitation] = useState(false);
  
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const toggleMode = () => {
    if (!isInvitationFlow) {
      setMode(mode === "login" ? "signup" : "login");
      setEmail("");
      setPassword("");
      setBusinessName("");
      setTermsAccepted(false);
      setPrivacyAccepted(false);
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

    // If in signup mode, check if email is a protected admin email
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
      // Clear any existing Supabase data first to avoid potential conflicts
      clearSupabaseData();
      
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({
          title: "Inicio de sesión exitoso",
          description: "Has iniciado sesión correctamente",
        });
        
        // Redirect will be handled by the useEffect in AuthContext
      } else {
        // For regular signup
        if (!businessName && !isInvitationFlow) {
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
        
        // Handle invitation acceptance after successful signup
        if (isInvitationFlow) {
          setIsProcessingInvitation(true);
          try {
            const invitationToken = localStorage.getItem("invitation_token");
            
            // Process the invitation acceptance with Supabase
            const { data: acceptData, error: acceptError } = await supabase.rpc('accept_invitation', {
              p_token: invitationToken,
              p_email: email
            });
            
            if (acceptError) {
              console.error("Error accepting invitation:", acceptError);
              // No need to show error here since signup was successful
            } else {
              console.log("Invitation accepted successfully:", acceptData);
            }
            
            // Clean up invitation data from localStorage
            localStorage.removeItem("invitation_token");
            localStorage.removeItem("invitation_email");
          } catch (inviteError) {
            console.error("Error processing invitation:", inviteError);
          } finally {
            setIsProcessingInvitation(false);
          }
        } else {
          // Set welcome modal flag for new registrations
          localStorage.setItem("showWelcomeModal", "true");
        }
        
        toast({
          title: "Registro exitoso",
          description: "Tu cuenta ha sido creada correctamente. Te guiaremos por el proceso de configuración.",
        });
        
        // Redirect to home page to show the welcome modal
        navigate("/");
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

  // Disable toggle mode in invitation flow
  const renderToggleMode = () => {
    if (isInvitationFlow) return null;
    
    return (
      <div className="mt-6 text-center">
        <button
          onClick={toggleMode}
          className="text-sm text-primary hover:underline"
          disabled={isLoading}
        >
          {mode === "login"
            ? "¿No tienes cuenta? Regístrate"
            : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>
    );
  };

  if (isProcessingInvitation) {
    return (
      <div className="w-full max-w-md mx-auto rounded-2xl border border-border bg-card p-8 text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">Procesando tu invitación</h2>
        <p className="text-muted-foreground">
          Estamos configurando tu cuenta. Por favor espera un momento...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-border bg-card p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isInvitationFlow} // Disable email input in invitation flow
            className={`w-full rounded-xl border ${isInvitationFlow ? 'bg-muted cursor-not-allowed' : 'bg-background'} border-input px-3 py-2 ${isInvitationFlow ? 'opacity-70' : ''}`}
          />
          {isInvitationFlow && (
            <p className="text-xs text-muted-foreground mt-1">
              Esta invitación está asociada a este email
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-input bg-background px-3 py-2"
            disabled={isLoading}
          />
        </div>
        
        {mode === "signup" && (
          <>
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium mb-1">
                Nombre de tu negocio
              </label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full rounded-xl border border-input bg-background px-3 py-2"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={() => setTermsAccepted(!termsAccepted)}
                />
                <label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Acepto los <Link to="/terms-of-service" className="text-primary hover:underline" target="_blank">Términos de Servicio</Link>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacy"
                  checked={privacyAccepted}
                  onCheckedChange={() => setPrivacyAccepted(!privacyAccepted)}
                />
                <label htmlFor="privacy" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Acepto la <Link to="/privacy-policy" className="text-primary hover:underline" target="_blank">Política de Privacidad</Link>
                </label>
              </div>
            </div>
          </>
        )}
        
        <button
          type="submit"
          className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-center font-medium"
          disabled={isLoading || (mode === "signup" && (!termsAccepted || !privacyAccepted))}
        >
          {isLoading
            ? "Procesando..."
            : mode === "login"
            ? "Iniciar sesión"
            : "Crear cuenta"}
        </button>
      </form>
      
      {mode === "login" && (
        <div className="mt-4 text-center">
          <Link
            to="/auth?reset=true"
            className="text-sm text-primary hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      )}
      
      {renderToggleMode()}
    </div>
  );
};
