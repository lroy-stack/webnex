
import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCookieConsent } from "@/contexts/CookieConsentContext";

export const CookieConsentModal = () => {
  const { showModal, setShowModal } = useCookieConsent();
  const [isClosing, setIsClosing] = useState(false);

  const handleConsent = (decision: "accepted" | "rejected") => {
    // Guardar la decisión en localStorage
    localStorage.setItem("cookieConsent", decision);
    
    // Animación de cierre
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setShowModal(false);
    }, 300);
  };

  if (!showModal) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 p-4 md:p-6",
        "transition-all duration-300 ease-in-out",
        isClosing ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
      )}
    >
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <div className="flex flex-col space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Política de Cookies
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleConsent("rejected")}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </Button>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Utilizamos cookies para mejorar tu experiencia en nuestro sitio web. 
              Al hacer clic en "Aceptar", consientes el uso de cookies para análisis, 
              contenido personalizado y publicidad.
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => handleConsent("rejected")}
                className="sm:order-1"
              >
                Rechazar
              </Button>
              <Button
                onClick={() => handleConsent("accepted")}
                className="sm:order-2"
              >
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
