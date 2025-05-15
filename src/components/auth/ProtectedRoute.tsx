
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, userRole, isLoading } = useAuth();
  
  // Debug logs
  console.log("ProtectedRoute check:", { user, userRole, allowedRoles, isLoading });

  // Effect para registrar cambios en el userRole
  useEffect(() => {
    console.log("ProtectedRoute userRole updated:", userRole);
  }, [userRole]);

  // If still loading, show spinner
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  // If not authenticated, redirect to the home page
  if (!user) {
    console.log("No user found, redirecting to home");
    return <Navigate to="/" replace />;
  }

  // Check if user has one of the allowed roles
  const hasAllowedRole = userRole && allowedRoles.includes(userRole);
  console.log("Role check:", { userRole, allowedRoles, hasAllowedRole });

  // If authenticated but doesn't have an allowed role, show access denied
  if (!hasAllowedRole) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-3xl font-bold mb-4">Acceso denegado</h1>
        <p className="text-lg mb-6">No tienes los permisos necesarios para acceder a esta página.</p>
        <p className="text-sm mb-4">Tu rol actual: {userRole || "No asignado"}</p>
        <p className="text-sm mb-4">Roles permitidos: {allowedRoles.join(", ")}</p>
        <a href="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
          Volver al inicio
        </a>
      </div>
    );
  }

  // If user has an allowed role, render the children
  return <>{children}</>;
};
