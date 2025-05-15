import React from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";
import { CartIcon } from "@/components/cart/CartIcon";
import { AuthModal } from "@/components/auth/AuthModal";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Schema.org structured data for SEO */}
      <script type="application/ld+json">{`
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "url": "https://webnex.es/",
          "name": "WebNex",
          "description": "Soluciones web modulares personalizables para negocios",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://webnex.es/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }
      `}</script>
      
      <Sidebar />
      <MobileNav />
      <main className={cn("lg:ml-64 min-h-screen flex-grow overflow-x-hidden", "transition-all duration-300 ease-in-out")}>
        {children}
      </main>
      
      {/* Floating Cart Icon */}
      <CartIcon />
      
      {/* Authentication Modal */}
      <AuthModal />
    </div>
  );
};