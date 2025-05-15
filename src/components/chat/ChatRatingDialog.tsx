
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitRating } from "@/services/chatService";
import { Star, StarHalf } from "lucide-react";

interface ChatRatingDialogProps {
  conversationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}

export const ChatRatingDialog: React.FC<ChatRatingDialogProps> = ({ 
  conversationId, 
  open, 
  onOpenChange,
  onSubmitted
}) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    
    setIsSubmitting(true);
    
    const result = await submitRating(
      conversationId,
      rating,
      comments.trim() || null
    );
    
    setIsSubmitting(false);
    
    if (result) {
      onOpenChange(false);
      if (onSubmitted) {
        onSubmitted();
      }
    }
  };

  const renderStars = () => {
    return (
      <div className="flex items-center justify-center space-x-2 my-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            {star <= (rating || 0) ? (
              <Star className="h-8 w-8 fill-primary text-primary" />
            ) : (
              <Star className="h-8 w-8 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Valorar la atención recibida</DialogTitle>
          <DialogDescription>
            Tu opinión nos ayuda a mejorar nuestro servicio de soporte.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="text-center">
            <p className="mb-2">¿Cómo valorarías la atención recibida?</p>
            {renderStars()}
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Comentarios adicionales (opcional)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!rating || isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Enviar valoración"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
