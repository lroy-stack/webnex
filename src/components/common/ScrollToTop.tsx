
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Component that automatically scrolls to top when the route changes
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    // Scroll to top when the route changes
    window.scrollTo({
      top: 0,
      behavior: "instant" // Use "instant" instead of "auto" for a more immediate scroll
    });
  }, [pathname]);
  
  return null; // This component doesn't render anything
};
