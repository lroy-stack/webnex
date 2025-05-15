import React from "react";
import { Layout } from "@/components/layout/Layout";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { CartItemsTable } from "@/components/admin/shared/CartItemsTable";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface CartItemsProps {
  embedded?: boolean;
}

const CartItems: React.FC<CartItemsProps> = ({ embedded = false }) => {
  // Content that's rendered regardless of embedded state
  const content = (
    <>
      {!embedded && <BreadcrumbNav />}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          {!embedded && <h1 className="text-3xl font-bold">Gestión de Carritos</h1>}
          {embedded && <h2 className="text-2xl font-bold">Carritos</h2>}
          <p className="text-muted-foreground">
            Visualiza los elementos en los carritos de los usuarios
          </p>
        </div>
      </div>
      
      <div className={embedded ? "" : "bg-card border border-border rounded-xl p-6 shadow-sm"}>
        <CartItemsTable />
      </div>
    </>
  );

  // If embedded, just return the content
  if (embedded) {
    return content;
  }

  // Otherwise wrap in Layout and ProtectedRoute
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Layout>
        <div className="container mx-auto py-8 px-4">
          {content}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default CartItems;
