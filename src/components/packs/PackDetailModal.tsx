import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ShoppingCart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Pack } from "@/services/packService";
import { addPackToCart } from "@/services/cartService";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthStore } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface PackDetailModalProps {
  pack: Pack | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PackDetailModal = ({ pack, open, onOpenChange }: PackDetailModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openAuthModal } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [includesServices, setIncludesServices] = useState<any[]>([]);

  useEffect(() => {
    if (pack?.id) {
      fetchPackServices(pack.id);
    }
  }, [pack]);

  const fetchPackServices = async (packId: string) => {
    try {
      const { data: packServices } = await supabase
        .from('pack_services')
        .select(`
          service_id,
          my_services (
            id, name, description, category, price
          )
        `)
        .eq('pack_id', packId);

      if (packServices) {
        setIncludesServices(packServices.map(item => item.my_services));
      }
    } catch (error) {
      console.error("Error fetching pack services:", error);
    }
  };

  const handleAddToCart = async () => {
    if (!pack) return;

    setLoading(true);
    try {
      // Ahora cualquier usuario puede añadir al carrito, esté autenticado o no
      const success = await addPackToCart(pack.id);
      if (success) {
        // Eliminamos el toast de aquí para evitar duplicación
        // El toast se mostrará desde el useCartStore
        navigate("/cart");
      }
    } catch (error) {
      console.error("Error adding pack to cart:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!pack) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <div 
              className={cn(
                "w-3 h-3 rounded-full",
                pack.color || "bg-primary"
              )}
            />
            {pack.name}
          </DialogTitle>
          <div className="flex gap-2 items-center mt-1">
            <Badge variant="outline" className="text-xl font-semibold">
              {pack.price}€
            </Badge>
            <Badge variant="secondary">
              {pack.target || "Todo tipo de negocios"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            {pack.short_description}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {pack.description && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Descripción</h3>
              <p className="text-muted-foreground">{pack.description}</p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Características incluidas</h3>
            <ul className="space-y-2">
              {pack.features && pack.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {includesServices && includesServices.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Servicios incluidos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {includesServices.map((service) => (
                  <div 
                    key={service.id} 
                    className="border border-border rounded-lg p-3 bg-card/50"
                  >
                    <div className="font-medium">{service.name}</div>
                    <Badge variant="outline" className="mt-1">
                      {service.category}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {service.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button 
            onClick={handleAddToCart} 
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            Añadir al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PackDetailModal;
