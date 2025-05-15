
import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusType = "active" | "inactive" | "pending" | "completed" | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: StatusType) => {
    switch (status.toLowerCase()) {
      case "active":
        return { label: "Activo", variant: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" };
      case "inactive":
        return { label: "Inactivo", variant: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" };
      case "pending":
        return { label: "Pendiente", variant: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" };
      case "processing":
        return { label: "Procesando", variant: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" };
      case "completed":
        return { label: "Completado", variant: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" };
      case "cancelled":
        return { label: "Cancelado", variant: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
      default:
        return { label: status, variant: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" };
    }
  };

  const { label, variant } = getStatusConfig(status);

  return (
    <Badge className={cn("font-medium", variant, className)} variant="outline">
      {label}
    </Badge>
  );
}
