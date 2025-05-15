
import React from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuthStore } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { ContactForm } from "@/components/contact/ContactForm";
import { Mail, Phone, Info } from "lucide-react";

const Contacto = () => {
  const { openAuthModal } = useAuthStore();
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto py-6 md:py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <BreadcrumbNav />
          
          <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8">Contacto</h1>
          
          <div className="bg-card border border-border rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Hablemos de tu proyecto</h2>
            
            <ContactForm />
          </div>
          
          {!user && (
            <div className="text-center bg-muted p-4 md:p-6 rounded-xl md:rounded-2xl">
              <h3 className="text-lg md:text-xl font-semibold mb-2">¿Ya tienes una cuenta?</h3>
              <p className="mb-4">Accede a tu cuenta para gestionar tu proyecto web modular</p>
              <div className="complementary-btn-container">
                <button 
                  onClick={openAuthModal}
                  className="px-5 py-2 md:px-6 md:py-3 bg-primary text-primary-foreground rounded-lg md:rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  Acceder / Registrarse
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-8 md:mt-12">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Información de contacto</h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-2">
                <Info className="text-muted-foreground h-4 w-4 md:h-5 md:w-5" />
                <p className="text-sm md:text-base"><strong>Dirección:</strong> Calle Principal 123, Madrid, España</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground h-4 w-4 md:h-5 md:w-5" />
                <p className="text-sm md:text-base"><strong>Email:</strong> info@agenciamodular.com</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="text-muted-foreground h-4 w-4 md:h-5 md:w-5" />
                <p className="text-sm md:text-base"><strong>Teléfono:</strong> +34 912 345 678</p>
              </div>
              <div className="flex items-center gap-2">
                <Info className="text-muted-foreground h-4 w-4 md:h-5 md:w-5" />
                <p className="text-sm md:text-base"><strong>Horario:</strong> Lunes a Viernes, 9:00 - 18:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contacto;
