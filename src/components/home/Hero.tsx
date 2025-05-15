import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthStore } from "@/contexts/AuthContext";

export const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { user } = useAuth();
  const { openAuthModal } = useAuthStore();
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (heroRef.current) {
        // Parallax effect
        heroRef.current.style.backgroundPositionY = `${scrollPosition * 0.5}px`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={heroRef}
      className={cn(
        "relative min-h-[80vh] sm:min-h-[90vh] flex items-center justify-center px-3 sm:px-4 lg:px-6",
        "bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-950 dark:to-slate-900",
        "bg-no-repeat bg-cover bg-center transition-all duration-300"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-orange-500/10" />
      
      <div className="container px-0 mx-auto max-w-5xl relative z-10 text-center">
        <div className="space-y-2 sm:space-y-4">
          <div className="flex justify-center mb-0">
            {theme === "light" ? (
              <img 
                src="https://ik.imagekit.io/insomnialz/webnex-logo.png?updatedAt=1746819797684" 
                alt="WebNex Logo" 
                className="h-32 sm:h-36 md:h-40 lg:h-48 w-auto" 
              />
            ) : (
              <img 
                src="https://ik.imagekit.io/insomnialz/webnex-dark.png?updatedAt=1746824086991" 
                alt="WebNex Logo" 
                className="h-32 sm:h-36 md:h-40 lg:h-48 w-auto" 
              />
            )}
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight px-4 sm:px-0">
            <span className="block mb-1 pt-0">Tu web. Tus reglas.</span>
            <span className="block bg-gradient-to-r from-[#0d5bff] to-[#ff6b35] text-transparent bg-clip-text pb-1">
              Tu negocio modular.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto px-4">
            Construye tu presencia digital con bloques modulares personalizables para tu negocio
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 px-4 sm:px-0">
            <Link
              to="/packs"
              className="rounded-xl sm:rounded-2xl bg-primary text-primary-foreground px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-medium transition-colors hover:bg-primary/90 w-full sm:w-auto"
            >
              Ver Packs
            </Link>
            <Link
              to="/servicios"
              className="rounded-xl sm:rounded-2xl bg-accent text-accent-foreground px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-medium transition-colors hover:bg-accent/90 w-full sm:w-auto"
            >
              Personaliza tu web
            </Link>
          </div>
          
          {!user && (
            <button
              onClick={openAuthModal}
              className="mt-4 text-base sm:text-lg text-primary hover:text-primary/80 font-medium hover:underline inline-flex items-center gap-2 transition-all px-4 py-2 animate-pulse"
            >
              <span className="hidden sm:inline">¿Todavía no eres cliente?</span> 
              <span>Regístrate ahora</span>
              <span className="text-xl">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};