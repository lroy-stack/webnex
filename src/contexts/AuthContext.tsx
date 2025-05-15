import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, checkAndRefreshSession, clearSupabaseData } from "@/integrations/supabase/client";
import { create } from "zustand";
import { migrateAnonymousCartToUser } from "@/services/cartService";
import { toast } from "sonner";

// Define available roles
export type UserRole = "admin" | "staff" | "client";

interface AuthState {
  isAuthModalOpen: boolean;
  isProfileModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthModalOpen: false,
  isProfileModalOpen: false,
  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  openProfileModal: () => set({ isProfileModalOpen: true }),
  closeProfileModal: () => set({ isProfileModalOpen: false }),
}));

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userRole: UserRole | null;
  hasCompletedOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, businessName: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: any | null }>;
  updateProfile: (data: { businessName?: string }) => Promise<{ error: any | null }>;
  deleteAccount: (reason?: string) => Promise<{ error: any | null }>;
  checkOnboardingStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roleCheckRetries, setRoleCheckRetries] = useState(0);
  const [previousAuthState, setPreviousAuthState] = useState<boolean>(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [sessionCheckInterval, setSessionCheckInterval] = useState<number | null>(null);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  // Función para obtener el rol del usuario desde la base de datos
  const fetchUserRole = async (userId: string) => {
    try {
      console.log("AuthContext: Fetching user role");
      // Consultar la tabla user_roles para obtener el rol del usuario
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      
      if (error) {
        console.error("Error al obtener el rol del usuario:", error);
        
        // Si hay error y no hemos intentado muchas veces, reintentamos
        if (roleCheckRetries < 3) {
          console.log(`Reintentando obtener rol (intento ${roleCheckRetries + 1})`);
          setRoleCheckRetries(prev => prev + 1);
          setTimeout(() => fetchUserRole(userId), 1000);
          return;
        }
        
        // Después de varios reintentos, establecemos rol por defecto
        setUserRole("client");
        return;
      }
      
      // Si se encontró un rol, establecerlo
      if (data) {
        console.log("Rol encontrado:", data.role);
        setUserRole(data.role as UserRole);
      } else {
        // Si no hay rol asignado (esto no debería ocurrir debido al trigger)
        console.log("No se encontró rol, estableciendo por defecto: client");
        setUserRole("client");
      }
      
      // Resetear los reintentos
      setRoleCheckRetries(0);
    } catch (error) {
      console.error("Error al obtener el rol del usuario:", error);
      setUserRole("client"); // Rol por defecto en caso de error
    }
  };

  // Function to check onboarding status
  const checkOnboardingStatus = async () => {
    if (!user) return;
    
    try {
      console.log("Checking onboarding status for user:", user.id);
      // Check if client profile exists and if onboarding is completed
      const { data, error } = await supabase
        .from("client_profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking onboarding status:", error);
        return;
      }
      
      if (data) {
        console.log("Onboarding status:", data.onboarding_completed);
        setHasCompletedOnboarding(data.onboarding_completed);
      } else {
        console.log("No profile found, onboarding needed");
        setHasCompletedOnboarding(false); // No profile found
      }
    } catch (error) {
      console.error("Error in checkOnboardingStatus:", error);
    }
  };

  useEffect(() => {
    console.log("AuthContext: Setting up auth state listeners");
    
    // Check and refresh session periodically to prevent JWT errors
    const interval = window.setInterval(async () => {
      const isValid = await checkAndRefreshSession();
      if (!isValid && user) {
        // If session is invalid but we thought user was logged in, clear state
        console.log("Invalid session detected during interval check, clearing auth state");
        setUser(null);
        setSession(null);
        setUserRole(null);
        setHasCompletedOnboarding(false);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    setSessionCheckInterval(interval);
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id);
        
        // Determinar si el usuario acaba de iniciar sesión
        const wasAuthenticated = previousAuthState;
        const isAuthenticated = !!currentSession?.user;
        
        if (event === 'TOKEN_REFRESHED') {
          console.log("Token refreshed successfully");
        }
        
        if (event === 'SIGNED_OUT') {
          clearSupabaseData(); // Clear all Supabase data on sign out
          console.log("User signed out, cleared Supabase data");
        }
        
        // Actualizar el estado de la sesión
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setPreviousAuthState(isAuthenticated);
        
        // Si el usuario acaba de iniciar sesión (no estaba autenticado antes y ahora sí)
        if (!wasAuthenticated && isAuthenticated && event === 'SIGNED_IN') {
          console.log("Usuario recién autenticado, migrando carrito anónimo");
          
          // Usar setTimeout para evitar deadlock con el estado de autenticación
          setTimeout(async () => {
            try {
              await migrateAnonymousCartToUser();
              console.log("Carrito anónimo migrado exitosamente");
            } catch (error) {
              console.error("Error al migrar el carrito:", error);
            }
          }, 100);
        }
        
        if (currentSession?.user) {
          fetchUserRole(currentSession.user.id);
          checkOnboardingStatus(); // Check onboarding status when auth state changes
        } else {
          setUserRole(null);
          setHasCompletedOnboarding(false);
        }

        setIsLoading(false);
      }
    );

    // Check for existing session on component mount
    const initialSessionCheck = async () => {
      try {
        const isValid = await checkAndRefreshSession();
        
        if (!isValid) {
          setUser(null);
          setSession(null);
          setUserRole(null);
          setHasCompletedOnboarding(false);
          setIsLoading(false);
          return;
        }
        
        // Session is valid, get the current session
        const { data } = await supabase.auth.getSession();
        const currentSession = data?.session;
        
        console.log("Current session check:", currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setPreviousAuthState(!!currentSession?.user);
        
        if (currentSession?.user) {
          fetchUserRole(currentSession.user.id);
          checkOnboardingStatus();
        } else {
          setUserRole(null);
          setHasCompletedOnboarding(false);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error during initial session check:", error);
        setIsLoading(false);
      }
    };
    
    initialSessionCheck();

    return () => {
      subscription.unsubscribe();
      if (sessionCheckInterval) {
        window.clearInterval(sessionCheckInterval);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Clear any existing Supabase data first to avoid conflicts
      clearSupabaseData();
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      console.error("Sign in error:", error);
      return { error };
    } finally {
      // No terminamos la carga aquí, ya que el listener de auth state lo hará
    }
  };

  const signUp = async (email: string, password: string, businessName: string) => {
    setIsLoading(true);
    try {
      // Clear any existing Supabase data first to avoid conflicts
      clearSupabaseData();
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName,
          },
        },
      });
      return { error };
    } catch (error) {
      console.error("Sign up error:", error);
      return { error };
    } finally {
      // No terminamos la carga aquí, ya que el listener de auth state lo hará
    }
  };

  const signOut = async () => {
    try {
      setIsSigningOut(true);
      setIsLoading(true);
      
      // First, clear local storage to prevent JWT issues
      clearSupabaseData();
      
      // Then sign out from Supabase with global scope
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear our state
      setUser(null);
      setSession(null);
      setUserRole(null);
      setHasCompletedOnboarding(false);
      
      // Add a small delay before completing to ensure everything is cleared
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log("Sign out completed successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      
      // If we get the specific JWT error, handle it gracefully
      if (error.message?.includes("invalid claim: missing sub claim")) {
        console.log("Handling JWT error during sign out");
        // Clear all Supabase data to ensure clean state
        clearSupabaseData();
        
        // Force clear state
        setUser(null);
        setSession(null);
        setUserRole(null);
        setHasCompletedOnboarding(false);
      } else {
        // For other errors, show a toast
        toast.error("Error al cerrar sesión. Por favor, inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
      setIsSigningOut(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      console.error("Reset password error:", error);
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      console.error("Update password error:", error);
      return { error };
    }
  };

  const updateProfile = async (data: { businessName?: string }) => {
    if (!user) return { error: new Error("No authenticated user") };
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          business_name: data.businessName,
        },
      });
      return { error };
    } catch (error) {
      console.error("Update profile error:", error);
      return { error };
    }
  };

  const deleteAccount = async (reason?: string) => {
    if (!user) return { error: new Error("No authenticated user") };
    
    try {
      // First check if the session is valid
      const isValid = await checkAndRefreshSession();
      if (!isValid) {
        return { error: new Error("Invalid session. Please sign in again.") };
      }
      
      // Llama a la Edge Function para eliminar la cuenta
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        return { error: new Error("No hay sesión activa") };
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({ reason }),
      });
      
      const result = await response.json();
      
      if (result.error) {
        return { error: new Error(result.error) };
      }
      
      // Cerrar la sesión local
      await signOut();
      return { error: null };
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    isLoading,
    userRole,
    hasCompletedOnboarding,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    deleteAccount,
    checkOnboardingStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};