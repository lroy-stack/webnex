
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Mail, Package, Film } from "lucide-react";
import { UserStats } from "@/services/clientDashboardService";
import { useIsMobile } from "@/hooks/use-mobile";
import { getCategoryStyles } from "@/utils/categoryStyles";

interface UserStatsCardsProps {
  stats: UserStats | null;
  isLoading: boolean;
}

export const UserStatsCards: React.FC<UserStatsCardsProps> = ({
  stats,
  isLoading
}) => {
  const isMobile = useIsMobile();
  
  const statsItems = [
    {
      title: "Visitas",
      icon: Activity,
      value: stats?.visits || 0,
      label: "Último mes",
      category: "ux"
    },
    {
      title: "Formularios",
      icon: Mail,
      value: stats?.forms_submitted || 0,
      label: "Enviados",
      category: "technical"
    },
    {
      title: "Servicios",
      icon: Package,
      value: stats?.active_services || 0,
      label: "Activos",
      category: "crm"
    },
    {
      title: "Demos",
      icon: Film,
      value: stats?.demos_generated || 0,
      label: "Generadas",
      category: "ai"
    }
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {statsItems.map((item) => {
        const categoryStyle = getCategoryStyles(item.category);
        
        return (
          <Card 
            key={item.title}
            className="overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 group"
          >
            <div className={`absolute inset-x-0 h-1 top-0 ${categoryStyle.buttonIndicator}`}></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-5">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <div className={`rounded-full p-1.5 ${categoryStyle.bgColor}`}>
                <item.icon className={`h-4 w-4 ${categoryStyle.color.replace('border-', 'text-')}`} />
              </div>
            </CardHeader>
            <CardContent className="p-3 md:p-5 pt-0">
              <div className="text-xl md:text-3xl font-bold">
                {isLoading ? (
                  <div className="h-8 bg-muted/40 animate-pulse rounded-md w-12"></div>
                ) : (
                  item.value
                )}
              </div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
