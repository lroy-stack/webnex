import React from "react";
import { CheckCircle, XCircle, Bell, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthStore } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export const ProblemsWeSolve: React.FC = () => {
  const { user } = useAuth();
  const { openAuthModal } = useAuthStore();
  
  const problemsSolutions = [{
    problem: "Webs estándar que no destacan",
    solution: "Soluciones modulares únicas que hacen que tu negocio destaque ante la competencia."
  }, {
    problem: "Precios exorbitantes sin flexibilidad",
    solution: "Paga solo por lo que necesitas con nuestro sistema de módulos personalizables."
  }, {
    problem: "Procesos lentos y complejos",
    solution: "Implementación rápida y sencilla gracias a nuestros módulos pre-configurados."
  }, {
    problem: "Webs difíciles de mantener",
    solution: "Actualizaciones sencillas y soporte continuo para mantener tu web siempre al día."
  }];
  
  return (
    <section className="py-10 md:py-20 bg-muted">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">Problemas que resolvemos</h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Nuestro enfoque modular soluciona los problemas más comunes al crear una web para tu negocio
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:gap-8 sm:grid-cols-2">
          {problemsSolutions.map((item, index) => (
            <div 
              key={index} 
              className="p-5 md:p-6 rounded-xl md:rounded-2xl bg-card border border-border transition-all hover:shadow-md"
            >
              <div className="flex items-start mb-3">
                <XCircle className="h-6 w-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <h3 className="text-lg md:text-lg font-bold">{item.problem}</h3>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-base text-muted-foreground">{item.solution}</p>
              </div>
            </div>
          ))}
        </div>
        
        {!user && (
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800/40 shadow-md">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex flex-col mb-4 md:mb-0 md:mr-8">
                <div className="flex items-center mb-2">
                  <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h3 className="font-bold text-lg">Mantente informado</h3>
                </div>
                <p className="text-muted-foreground mb-3">
                  Por solo 9,90€/mes recibe informes personalizados, newsletter con tendencias y mucho más
                </p>
                <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  <span>Boletín semanal con nuevas tendencias</span>
                </div>
                <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm my-1">
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  <span>Acceso prioritario a nuevos módulos</span>
                </div>
                <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  <span>Descuentos exclusivos en packs premium</span>
                </div>
              </div>
              
              <Button
                onClick={openAuthModal}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 transition-all hover:scale-105 flex items-center"
              >
                Suscríbete ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};