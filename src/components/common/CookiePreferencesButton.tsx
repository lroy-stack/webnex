
import React from "react";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { useIsMobile } from "@/hooks/use-mobile";

export const CookiePreferencesButton = () => {
  const { resetConsent } = useCookieConsent();
  const isMobile = useIsMobile();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs text-muted-foreground hover:text-foreground flex flex-nowrap items-center gap-1 whitespace-nowrap max-w-full"
      onClick={resetConsent}
      aria-label="Cambiar preferencias de cookies"
    >
      <Settings2 className={`${isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'} mr-1 flex-shrink-0`} />
      <span className="flex-shrink-0 truncate">
        {isMobile ? "Cookies" : "Preferencias de cookies"}
      </span>
    </Button>
  );
};
