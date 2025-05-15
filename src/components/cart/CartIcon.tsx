
import React, { useEffect, useState, useRef } from "react";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";

export const CartIcon: React.FC = () => {
  const { itemCount, fetchCart, syncAnonymousCart } = useCartStore();
  const navigate = useNavigate();
  const { openAuthModal } = useAuthStore();
  const { user } = useAuth();
  const [prevUser, setPrevUser] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isInitialMount = useRef(true);
  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initial cart fetch and setup refresh interval with throttling
  useEffect(() => {
    // Fetch cart immediately on component mount
    fetchCart();
    
    // Set up interval to periodically refresh cart data, but less frequently
    const interval = setInterval(() => {
      fetchCart();
    }, 60000); // Check every 60 seconds instead of 30
    
    return () => {
      clearInterval(interval);
      if (fetchTimeout.current) {
        clearTimeout(fetchTimeout.current);
      }
    };
  }, [fetchCart]);

  // Throttled update cart when auth status changes
  useEffect(() => {
    const currentUserId = user?.id || null;
    
    // Skip first render to prevent duplicate fetches
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setPrevUser(currentUserId);
      return;
    }
    
    // If the user ID has changed (login or logout)
    if (currentUserId !== prevUser) {
      console.log("CartIcon: Auth state changed, updating cart");
      
      // If user just logged in, sync the anonymous cart first
      if (currentUserId && !prevUser) {
        console.log("CartIcon: User just logged in, syncing anonymous cart");
        
        // Clear any pending fetch timeout
        if (fetchTimeout.current) {
          clearTimeout(fetchTimeout.current);
        }
        
        // We use setTimeout to prevent auth state deadlock with throttling
        fetchTimeout.current = setTimeout(async () => {
          await syncAnonymousCart();
          await fetchCart();
          fetchTimeout.current = null;
        }, 300);
      } else {
        // Just fetch the cart if logout or other changes, with throttling
        if (fetchTimeout.current) {
          clearTimeout(fetchTimeout.current);
        }
        
        fetchTimeout.current = setTimeout(() => {
          fetchCart();
          fetchTimeout.current = null;
        }, 300);
      }
      
      setPrevUser(currentUserId);
    }
  }, [user, fetchCart, prevUser, syncAnonymousCart]);

  // Show icon only when cart has items, with animation
  useEffect(() => {
    if (itemCount > 0) {
      setIsVisible(true);
    } else {
      // Give time for animation before hiding
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  const handleCartClick = () => {
    navigate("/cart");
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50",
        "animate-fade-in transition-all duration-300"
      )}
    >
      <Button
        variant="secondary"
        size="icon"
        className="rounded-full shadow-lg hover:shadow-xl w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
        onClick={handleCartClick}
        aria-label="Ver carrito"
        type="button"
      >
        <ShoppingCart className="h-6 w-6" />
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold p-0 bg-red-500 border-2 border-white dark:border-gray-800"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </Badge>
      </Button>
    </div>
  );
};
