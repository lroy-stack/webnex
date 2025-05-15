import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleStartOnboarding = () => {
    localStorage.removeItem("showWelcomeModal");
    navigate("/onboarding");
    onClose();
  };

  const handleSkipOnboarding = () => {
    localStorage.removeItem("showWelcomeModal");
    localStorage.setItem("onboardingSkipped", "true");
    navigate("/app");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/20 border-0 shadow-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <div className="absolute inset-x-0 h-1 top-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-t-md"></div>
        
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">¡Bienvenido a WebNex!</DialogTitle>
          <DialogDescription className="text-sm sm:text-base pt-2">
            Gracias por registrarte. Te guiaremos a través de los siguientes pasos para configurar tu cuenta y comenzar a construir tu presencia web.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2 sm:py-4 space-y-3 sm:space-y-4">
          <div className="rounded-lg bg-muted/30 p-3 sm:p-4 border">
            <h3 className="font-medium text-sm sm:text-base mb-1 sm:mb-2">¿Cómo funciona WebNex?</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              WebNex te ofrece soluciones web modulares para tu negocio. Selecciona un pack base y añade los módulos adicionales que necesites para crear una web totalmente personalizada.
            </p>
          </div>
          
          <div className="rounded-lg bg-muted/30 p-3 sm:p-4 border">
            <h3 className="font-medium text-sm sm:text-base mb-1 sm:mb-2">Nuestros servicios</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Ofrecemos diversos packs web para distintos tipos de negocio, desde páginas corporativas hasta tiendas online, todos ampliables con módulos adicionales.
            </p>
          </div>
          
          <div className="rounded-lg bg-primary/10 p-3 sm:p-4 border border-primary/20">
            <h3 className="font-medium text-sm sm:text-base mb-1 sm:mb-2">¿Qué sigue?</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Para comenzar, necesitamos recopilar algunos datos básicos sobre ti y tu negocio. Puedes configurarlo ahora o más tarde, según prefieras.
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 sm:pt-4">
          <Button 
            variant="outline"
            onClick={handleSkipOnboarding}
            className="w-full sm:w-auto"
          >
            Saltar por ahora
          </Button>
          <Button 
            onClick={handleStartOnboarding} 
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Comenzar Configuración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};