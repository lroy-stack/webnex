import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Package, Box, Contact, Sun, Moon, LogIn, User, UserCog } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthStore } from "@/contexts/AuthContext";

export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();
  const { openAuthModal, openProfileModal } = useAuthStore();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Base navigation items
  const baseNavItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Packs", path: "/packs", icon: Package },
    { name: "Servicios", path: "/servicios", icon: Box },
    { name: "Contacto", path: "/contacto", icon: Contact },
  ];
  
  // Role-specific items
  const getRoleNavItems = () => {
    if (!user) return [];
    
    if (userRole === "admin") {
      return [
        { name: "Administración", path: "/auth-myweb", icon: UserCog, roles: ["admin"] }
      ];
    } else if (userRole === "client" || userRole === "staff") {
      return [
        { name: "Panel de Cliente", path: "/app", icon: User, roles: [userRole] }
      ];
    } else {
      return [];
    }
  };
  
  // Get role-specific navigation items
  const roleNavItems = getRoleNavItems();
  
  // Combined navigation items
  const navItems = [...baseNavItems, ...roleNavItems];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <button
          onClick={toggleMenu}
          className="bg-primary text-primary-foreground w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}

      <nav
        className={cn(
          "fixed bottom-20 right-6 z-40 lg:hidden",
          "bg-background rounded-2xl shadow-xl w-64 p-4",
          "transform transition-all duration-300 ease-in-out",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
        )}
      >
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-4 py-3 rounded-2xl transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isActive(item.path)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-foreground"
              )}
              onClick={closeMenu}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span>{item.name}</span>
            </Link>
          ))}

          {user ? (
            <>
              <button
                onClick={() => {
                  openProfileModal();
                  closeMenu();
                }}
                className="flex items-center w-full px-4 py-3 rounded-2xl transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <UserCog className="w-5 h-5 mr-3" />
                <span>Mi perfil</span>
              </button>
              <button
                onClick={() => {
                  signOut();
                  closeMenu();
                }}
                className="flex items-center w-full px-4 py-3 rounded-2xl transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <LogIn className="w-5 h-5 mr-3" />
                <span>Cerrar sesión</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                openAuthModal();
                closeMenu();
              }}
              className="flex items-center w-full px-4 py-3 rounded-2xl transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogIn className="w-5 h-5 mr-3" />
              <span>Acceder</span>
            </button>
          )}

          <button
            onClick={() => {
              toggleTheme();
              closeMenu();
            }}
            className="flex items-center w-full px-4 py-3 rounded-2xl transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {theme === "light" ? (
              <>
                <Moon className="w-5 h-5 mr-3" />
                <span>Modo oscuro</span>
              </>
            ) : (
              <>
                <Sun className="w-5 h-5 mr-3" />
                <span>Modo claro</span>
              </>
            )}
          </button>
        </div>
      </nav>
    </>
  );
};