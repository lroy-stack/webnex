import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthStore } from "@/contexts/AuthContext";
import { LucideArrowRight, Users, Zap, Star } from "lucide-react";

export const RandomRegisterModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { openAuthModal } = useAuthStore();

  // Minimal delay to prevent modal from showing immediately on page load
  useEffect(() => {
    // Don't show for logged in users or if user dismissed the modal recently
    const hasRecentlyDismissed = localStorage.getItem("dismissedPromoTime");
    const DISMISS_DURATION_MS = 30 * 60 * 1000; // 30 minutes
    
    if (user || hasRecentlyDismissed) {
      if (hasRecentlyDismissed) {
        const dismissedTime = parseInt(hasRecentlyDismissed, 10);
        // If 30 minutes have passed since dismissal, show again
        if (Date.now() - dismissedTime > DISMISS_DURATION_MS) {
          localStorage.removeItem("dismissedPromoTime");
        } else {
          return;
        }
      } else {
        return;
      }
    }
    
    // Random delay between 15-40 seconds before showing modal
    const delay = Math.floor(Math.random() * (40000 - 15000) + 15000);
    
    // 60% chance to show the modal
    if (Math.random() < 0.6) {
      const timer = setTimeout(() => setOpen(true), delay);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleOpenAuthModal = () => {
    setOpen(false);
    openAuthModal();
  };

  const handleDismiss = () => {
    setOpen(false);
    // Save dismiss time to prevent showing again soon
    localStorage.setItem("dismissedPromoTime", Date.now().toString());
  };

  // Randomize which promo content to show (3 versions)
  const promoVersion = Math.floor(Math.random() * 3);

  let promoContent;
  
  switch (promoVersion) {
    case 0:
      promoContent = (
        <div className="text-center space-y-4">
          <div className="h-12 w-12 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded-full flex items-center justify-center mx-auto">
            <Users className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl">Únete a nuestra comunidad</DialogTitle>
          <DialogDescription className="text-base">
            Miles de negocios ya están construyendo su presencia digital con WebNex.
            <span className="block mt-2 font-medium">¡No te quedes atrás! Regístrate hoy.</span>
          </DialogDescription>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">98%</span>
              <span className="text-xs text-muted-foreground">Satisfacción</span>
            </div>
            <div className="h-8 border-r border-gray-300"></div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">+10k</span>
              <span className="text-xs text-muted-foreground">Clientes</span>
            </div>
            <div className="h-8 border-r border-gray-300"></div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">24/7</span>
              <span className="text-xs text-muted-foreground">Soporte</span>
            </div>
          </div>
        </div>
      );
      break;
    case 1:
      promoContent = (
        <div className="text-center space-y-4">
          <div className="h-12 w-12 bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300 rounded-full flex items-center justify-center mx-auto">
            <Zap className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl">¡Oferta por tiempo limitado!</DialogTitle>
          <DialogDescription className="text-base">
            Regístrate hoy y obtén un <span className="font-bold text-purple-600 dark:text-purple-300">15% de descuento</span> en tu primer pack.
            <span className="block mt-2">Esta oferta estará disponible solo para los próximos usuarios.</span>
          </DialogDescription>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg text-sm">
            <p className="font-medium text-purple-800 dark:text-purple-300">
              Solo necesitarás 10 minutos para configurar tu web profesional.
            </p>
          </div>
        </div>
      );
      break;
    case 2:
    default:
      promoContent = (
        <div className="text-center space-y-4">
          <div className="h-12 w-12 bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300 rounded-full flex items-center justify-center mx-auto">
            <Star className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl">Desbloquea todas las ventajas</DialogTitle>
          <DialogDescription className="text-base">
            Como usuario registrado, obtendrás acceso a:
          </DialogDescription>
          <ul className="text-left space-y-2">
            <li className="flex items-start">
              <div className="h-5 w-5 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mr-2 mt-0.5">✓</div>
              <span>Panel de cliente personalizado</span>
            </li>
            <li className="flex items-start">
              <div className="h-5 w-5 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mr-2 mt-0.5">✓</div>
              <span>Seguimiento de tus proyectos en tiempo real</span>
            </li>
            <li className="flex items-start">
              <div className="h-5 w-5 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mr-2 mt-0.5">✓</div>
              <span>Soporte prioritario via chat 24/7</span>
            </li>
            <li className="flex items-start">
              <div className="h-5 w-5 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mr-2 mt-0.5">✓</div>
              <span>Ofertas exclusivas para miembros</span>
            </li>
          </ul>
        </div>
      );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950/20 animate-fade-in">
        <div className="absolute inset-x-0 h-1 top-0 bg-gradient-to-r from-blue-400 to-purple-400"></div>
        {promoContent}
        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            variant="outline"
            onClick={handleDismiss}
          >
            Ahora no
          </Button>
          <Button 
            onClick={handleOpenAuthModal}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            Registrarme
            <LucideArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};