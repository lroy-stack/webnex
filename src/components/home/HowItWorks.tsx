import React from "react";
import { Package2, PlusCircle, Rocket } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthStore } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export const HowItWorks: React.FC = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { openAuthModal } = useAuthStore();
  
  const steps = [{
    icon: Package2,
    title: "Elige tu pack",
    description: "Selecciona el pack que mejor se adapte a las necesidades de tu negocio entre nuestras opciones prediseñadas."
  }, {
    icon: PlusCircle,
    title: "Añade servicios",
    description: "Personaliza tu solución añadiendo módulos adicionales para potenciar la funcionalidad de tu web."
  }, {
    icon: Rocket,
    title: "Lanza tu web",
    description: "Implementamos tu solución web modular y te acompañamos para que puedas lanzar tu presencia digital con éxito."
  }];
  
  return (
    <section className="py-10 md:py-20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">Cómo funciona</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Construir tu web nunca ha sido tan sencillo gracias a nuestro sistema modular
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center text-center p-5 md:p-6 rounded-xl md:rounded-2xl bg-card border border-border transition-all hover:shadow-md"
            >
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 md:mb-6">
                <step.icon className="h-7 w-7 md:h-8 md:w-8 text-primary" />
              </div>
              <h3 className="text-xl md:text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-base text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        
        {!user && (
          <div className="mt-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">¿Listo para comenzar tu viaje digital?</p>
            <Button 
              onClick={openAuthModal}
              className="px-8 py-3 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg transition-all hover:scale-105"
            >
              {isMobile ? "Iniciar sesión / Registro" : "Iniciar sesión o Registrarse"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};