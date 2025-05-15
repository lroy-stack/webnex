
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Pack {
  id: string;
  name: string;
  price: number;
  target: string | null;
  slug: string;
  description: string | null;
  short_description: string | null;
  is_active: boolean | null;
  created_at: string;
  color?: string;
  features?: string[];
  type?: string;
  position?: number;
}

// Datos de respaldo que se usarán en caso de error
const fallbackPacks: Pack[] = [
  {
    id: "1",
    name: "Pack Base",
    price: 890,
    target: "Todo tipo de negocios",
    slug: "pack-base",
    description: "Web de 5 páginas desarrollada en React con Vite, Base de datos conectada (Supabase) con información dinámica, Panel de administración completo para gestionar contenidos, Autenticación por email para acceso del administrador, Arquitectura escalable para futuras funcionalidades, Dominio, hosting y SEO técnico básico incluidos (1 año)",
    short_description: "Lo esencial para tu presencia online",
    features: ["Web de 5 páginas desarrollada en React con Vite", "Base de datos conectada (Supabase)", "Panel de administración completo", "Autenticación por email", "Arquitectura escalable", "Dominio y hosting (1 año)"],
    is_active: true,
    created_at: new Date().toISOString(),
    color: "bg-blue-500",
    type: "basic",
    position: 1
  },
  {
    id: "2",
    name: "Pack Restaurante",
    price: 1990,
    target: "Bares, restaurantes y cafeterías",
    slug: "pack-restaurante",
    description: "Ideal para bares, restaurantes o cafeterías que necesitan gestionar reservas y carta online.",
    short_description: "Gestión completa para tu negocio de hostelería",
    features: ["Pack Base completo", "Gestor de reservas personalizado", "Carta dinámica con filtros", "Chatbot AI básico", "Modo multilingüe", "Panel multiusuario"],
    is_active: true,
    created_at: new Date().toISOString(),
    color: "bg-orange-500",
    type: "specialized",
    position: 2
  },
  {
    id: "3",
    name: "Pack E-commerce Simple",
    price: 2490,
    target: "Tiendas online",
    slug: "pack-ecommerce-simple",
    description: "Para negocios que quieren vender sin complicarse con plataformas tipo Shopify.",
    short_description: "Tu tienda online sin complicaciones",
    features: ["Pack Base completo", "Catálogo de productos", "Pasarela de pago", "Gestión de pedidos", "SEO técnico avanzado", "Dashboard de ventas"],
    is_active: true,
    created_at: new Date().toISOString(),
    color: "bg-green-500",
    type: "specialized",
    position: 3
  },
  {
    id: "4",
    name: "Pack Web Premium con IA",
    price: 2990,
    target: "Marcas personales y profesionales",
    slug: "pack-web-premium-ia",
    description: "Pensado para marcas personales, coaches, profesionales o proyectos tech.",
    short_description: "Tu web potenciada con inteligencia artificial",
    features: ["Pack Base completo", "Chatbot AI avanzado", "Blog autogestionable", "Recomendador de contenidos", "SEO técnico avanzado", "Exportación de datos"],
    is_active: true,
    created_at: new Date().toISOString(),
    color: "bg-purple-600",
    type: "specialized",
    position: 4
  }
];

export const fetchPacks = async (): Promise<Pack[]> => {
  try {
    // Intentar obtener datos reales de Supabase
    const { data, error } = await supabase
      .from("my_packs")
      .select("*")
      .order("position");

    if (error) {
      console.error("Error fetching packs:", error);
      toast.error("Error al cargar los packs, usando datos de respaldo");
      
      return fallbackPacks;
    }

    if (!data || data.length === 0) {
      // Si no hay datos, usar los de respaldo
      console.warn("No packs found in database, using fallback data");
      return fallbackPacks;
    }

    // Asignar colores a los packs reales si no tienen uno asignado
    return data.map(pack => ({
      ...pack,
      color: pack.color ? `bg-${pack.color}` : `bg-blue-500`,
    }));
  } catch (error) {
    console.error("Error fetching packs:", error);
    toast.error("Error al cargar los packs, usando datos de respaldo");
    
    // En caso de error, devolver datos de respaldo
    return fallbackPacks;
  }
};
