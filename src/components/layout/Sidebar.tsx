import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Home, Package, Box, Contact, LogIn, User, UserCog, LayoutDashboard, Users, List, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthStore } from "@/contexts/AuthContext";
import { ChatNotificationBadge } from "@/components/admin/chat/ChatNotificationBadge";
import { ClientChatNotificationBadge } from "@/components/client/chat/ClientChatNotificationBadge";
import { MessageCircle } from "lucide-react";

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();
  const { openAuthModal, openProfileModal } = useAuthStore();

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

  // Modificar el adminNavigation para incluir Chat
  const adminNavigation = [
    {
      title: "Dashboard",
      href: "/auth-myweb",
      icon: LayoutDashboard,
    },
    {
      title: "Clientes",
      href: "/auth-myweb/clients",
      icon: Users,
    },
    {
      title: "Packs",
      href: "/auth-myweb/packs",
      icon: Package,
    },
    {
      title: "Servicios",
      href: "/auth-myweb/services",
      icon: List,
    },
    {
      title: "Chat",
      href: "/auth-myweb/chat",
      icon: MessageCircle,
      badge: <ChatNotificationBadge />, // Removed className prop
    },
    {
      title: "Mensajes",
      href: "#",
      icon: Mail,
      disabled: true,
    },
  ];

  // Modificar el clientNavigation para incluir Chat
  const clientNavigation = [
    {
      title: "Dashboard",
      href: "/app",
      icon: LayoutDashboard,
    },
    {
      title: "Chat",
      href: "/app/chat",
      icon: MessageCircle,
      badge: <ClientChatNotificationBadge />, // Removed className prop
    },
  ];

  return (
    <aside
      className={cn(
        "h-screen w-64 fixed left-0 top-0 flex-col justify-between hidden lg:flex",
        "bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border",
        "transition-all duration-300 ease-in-out p-4",
        className
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-center py-0">
          <Link to="/" className="flex items-center">
            {theme === "light" ? (
              <img 
                src="https://ik.imagekit.io/insomnialz/webnex-logo.png?updatedAt=1746819797684" 
                alt="WebNex Logo" 
                className="h-14 w-auto max-w-[80%]" 
              />
            ) : (
              <img 
                src="https://ik.imagekit.io/insomnialz/webnex-dark.png?updatedAt=1746824086991" 
                alt="WebNex Logo" 
                className="h-14 w-auto max-w-[80%]" 
              />
            )}
          </Link>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-4 py-3 rounded-2xl transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive(item.path)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="space-y-2 p-4">
        {user ? (
          <>
            <button
              onClick={openProfileModal}
              className={cn(
                "flex items-center w-full px-4 py-3 rounded-2xl",
                "bg-sidebar-accent text-sidebar-accent-foreground transition-colors mb-2"
              )}
            >
              <UserCog className="w-5 h-5 mr-2" />
              <span>Mi perfil</span>
            </button>
            <button
              onClick={() => signOut()}
              className={cn(
                "flex items-center w-full px-4 py-3 rounded-2xl",
                "bg-sidebar-accent text-sidebar-accent-foreground transition-colors"
              )}
            >
              <LogIn className="w-5 h-5 mr-2" />
              <span>Cerrar sesión</span>
            </button>
          </>
        ) : (
          <button
            onClick={openAuthModal}
            className={cn(
              "flex items-center w-full px-4 py-3 rounded-2xl",
              "bg-sidebar-accent text-sidebar-accent-foreground transition-colors"
            )}
          >
            <LogIn className="w-5 h-5 mr-2" />
            <span>Acceder</span>
          </button>
        )}

        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center w-full px-4 py-3 rounded-2xl",
            "bg-sidebar-accent text-sidebar-accent-foreground transition-colors"
          )}
        >
          {theme === "light" ? (
            <>
              <Moon className="w-5 h-5 mr-2" />
              <span>Modo oscuro</span>
            </>
          ) : (
            <>
              <Sun className="w-5 h-5 mr-2" />
              <span>Modo claro</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};