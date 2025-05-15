
import { 
  Brain, 
  Code, 
  Layout, 
  Package, 
  Star 
} from "lucide-react";

export type CategoryType = "technical" | "ai" | "ux" | "crm" | "extra" | "all";

export const categoryConfig = {
  technical: {
    color: "border-blue-500 dark:border-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/70 dark:text-blue-300",
    buttonIndicator: "bg-blue-500",
    icon: Code,
    gradientFrom: "from-blue-50 dark:from-blue-950/40",
    gradientTo: "to-blue-100/50 dark:to-blue-900/20",
    shadow: "shadow-blue-500/20 dark:shadow-blue-400/20",
    name: "Técnicos y Funcionales"
  },
  ai: {
    color: "border-purple-500 dark:border-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/40",
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/70 dark:text-purple-300",
    buttonIndicator: "bg-purple-500",
    icon: Brain,
    gradientFrom: "from-purple-50 dark:from-purple-950/40",
    gradientTo: "to-purple-100/50 dark:to-purple-900/20",
    shadow: "shadow-purple-600/20 dark:shadow-purple-500/25",
    name: "IA y Automatización"
  },
  ux: {
    color: "border-amber-500 dark:border-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/70 dark:text-amber-300",
    buttonIndicator: "bg-amber-500",
    icon: Layout,
    gradientFrom: "from-amber-50 dark:from-amber-950/40",
    gradientTo: "to-amber-100/50 dark:to-amber-900/20",
    shadow: "shadow-amber-500/20 dark:shadow-amber-400/25",
    name: "UX/UI y SEO"
  },
  crm: {
    color: "border-green-500 dark:border-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/40",
    badgeColor: "bg-green-100 text-green-700 dark:bg-green-900/70 dark:text-green-300",
    buttonIndicator: "bg-green-500",
    icon: Package,
    gradientFrom: "from-green-50 dark:from-green-950/40",
    gradientTo: "to-green-100/50 dark:to-green-900/20",
    shadow: "shadow-green-500/20 dark:shadow-green-400/25",
    name: "Gestión Interna y CRM"
  },
  extra: {
    color: "border-rose-500 dark:border-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-900/70 dark:text-rose-300",
    buttonIndicator: "bg-rose-500",
    icon: Star,
    gradientFrom: "from-rose-50 dark:from-rose-950/40",
    gradientTo: "to-rose-100/50 dark:to-rose-900/20",
    shadow: "shadow-rose-500/20 dark:shadow-rose-400/25",
    name: "Extras"
  },
  all: {
    color: "border-gray-500 dark:border-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-900/40",
    badgeColor: "bg-gray-100 text-gray-700 dark:bg-gray-800/90 dark:text-gray-300",
    buttonIndicator: "bg-gray-500",
    icon: Package,
    gradientFrom: "from-gray-50 dark:from-gray-900/40",
    gradientTo: "to-gray-100/50 dark:to-gray-800/20",
    shadow: "shadow-gray-500/20 dark:shadow-gray-400/30",
    name: "Todos"
  }
};

// Function to determine if a module should be marked as popular/recommended
export const getModuleHighlight = (module: { id: string; price: number; category: string }): string | null => {
  // Marking specific modules as popular or recommended based on ID or other criteria
  // This is just an example - you would customize this based on your actual data
  if (module.price > 300) return "Popular";
  
  // Random selection of modules to mark as recommended (for demonstration)
  // In a real application, you would use actual criteria
  const recommendedIds = ["1", "5", "9", "13"];
  if (recommendedIds.includes(module.id)) return "Recomendado";
  
  return null;
};

// Add the missing function to get category styles based on the category name
export const getCategoryStyles = (category: string) => {
  // Default to the "all" category if the provided category is not found
  const categoryKey = (category?.toLowerCase() || "all") as CategoryType;
  
  // Return the configuration for the specified category or default to "all" if not found
  return categoryConfig[categoryKey in categoryConfig ? categoryKey : "all"];
};
