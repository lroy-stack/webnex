import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { checkAndRefreshSession } from "@/integrations/supabase/client";
import { isProtectedAdminEmail, ensureAdminRole, removeProtectedAdminClientData } from "@/utils/adminHelpers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [invitationStatus, setInvitationStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired' | null>(
    token && email ? 'loading' : null
  );
  const { user, isLoading, hasCompletedOnboarding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Function to handle invitation verification
  const verifyInvitation = async () => {
    if (!token || !email) return;
    
    try {
      setInvitationStatus('loading');
      
      // Check if token is valid and not expired
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('token', token)
        .eq('email', email)
        .eq('status', 'pending')
        .single();
      
      if (error || !data) {
        console.error("Error verifying invitation:", error);
        setInvitationStatus('invalid');
        return;
      }
      
      // Check if invitation has expired
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        setInvitationStatus('expired');
        return;
      }
      
      // Valid invitation
      setInvitationStatus('valid');
      
      // Store token in localStorage for later use during signup
      localStorage.setItem('invitation_token', token);
      localStorage.setItem('invitation_email', email);
      
    } catch (error) {
      console.error("Error verifying invitation:", error);
      setInvitationStatus('invalid');
    }
  };

  // Verify invitation on mount if token and email are present
  useEffect(() => {
    if (token && email) {
      verifyInvitation();
    }
  }, [token, email]);

  // Redirect based on authentication and onboarding status
  useEffect(() => {
    const handleAuthentication = async () => {
      console.time('auth-page-redirection');
      if (!user || isLoading) {
        console.timeEnd('auth-page-redirection');
        return;
      }

      // First verify we have a valid session
      console.time('auth-session-check');
      const isValid = await checkAndRefreshSession();
      console.timeEnd('auth-session-check');
      
      if (!isValid) {
        console.timeEnd('auth-page-redirection');
        return;
      }

      // Check if user email is a protected admin
      console.time('auth-admin-check');
      if (user.email && isProtectedAdminEmail(user.email)) {
        // Ensure admin has admin role
        await ensureAdminRole();
        
        // Remove any client data for this admin
        await removeProtectedAdminClientData(user.email);
        
        // Redirect to admin panel
        console.log("Admin detected, redirecting to admin panel");
        navigate("/auth-myweb", { replace: true });
        console.timeEnd('auth-admin-check');
        console.timeEnd('auth-page-redirection');
        return;
      }
      console.timeEnd('auth-admin-check');

      // For regular users, handle onboarding correctly
      if (!hasCompletedOnboarding) {
        // Check if user has explicitly skipped onboarding
        const onboardingSkipped = localStorage.getItem("onboardingSkipped") === "true";
        
        // If not skipped, redirect to onboarding or welcome modal
        if (!onboardingSkipped) {
          const showWelcome = localStorage.getItem("showWelcomeModal") === "true";
          navigate(showWelcome ? "/" : "/onboarding", { replace: true });
          console.timeEnd('auth-page-redirection');
          return;
        }
      }

      // Otherwise, redirect to the page they came from or dashboard
      navigate(from, { replace: true });
      console.timeEnd('auth-page-redirection');
    };

    handleAuthentication();
  }, [user, isLoading, hasCompletedOnboarding, navigate, from]);

  // If there's a token but no user, show invitation UI
  if (invitationStatus && !user) {
    return (
      <Layout>
        <div className="container mx-auto max-w-lg py-16 px-6">
          {invitationStatus === 'loading' && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex justify-center items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verificando invitación
                </CardTitle>
                <CardDescription>
                  Por favor, espere mientras verificamos su invitación
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-6">
                <div className="flex justify-center items-center">
                  <div className="animate-pulse bg-muted h-8 w-64 rounded-full"></div>
                </div>
              </CardContent>
            </Card>
          )}

          {invitationStatus === 'expired' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Invitación expirada</AlertTitle>
              <AlertDescription>
                Esta invitación ha caducado. Por favor, contacte con el administrador para obtener una nueva invitación.
              </AlertDescription>
            </Alert>
          )}

          {invitationStatus === 'invalid' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Invitación inválida</AlertTitle>
              <AlertDescription>
                Esta invitación no es válida o ya ha sido utilizada. Por favor, contacte con el administrador si cree que esto es un error.
              </AlertDescription>
            </Alert>
          )}

          {invitationStatus === 'valid' && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Invitación aceptada</CardTitle>
                <CardDescription>
                  Crea tu cuenta para {email} y únete a WebNex
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuthForm isInvitationFlow={true} />
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    );
  }

  // If user is authenticated, redirect is handled in useEffect
  if (user) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-md py-16 px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Accede a tu cuenta</h1>
          <p className="text-muted-foreground">
            Gestiona tu proyecto web modular
          </p>
        </div>

        <AuthForm />
      </div>
    </Layout>
  );
};

export default Auth;