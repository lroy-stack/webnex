
import React from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StatisticsOverview } from "./StatisticsOverview";
import { ClientsChart } from "./ClientsChart";
import { ServicesChart } from "./ServicesChart";
import { TimelineChart } from "./TimelineChart";

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="text-muted-foreground">
        Analítica y métricas clave de la plataforma
      </div>

      {/* Resumen estadístico */}
      <StatisticsOverview />
      
      {/* Gráficos principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ClientsChart />
        <ServicesChart />
      </div>
      
      {/* Gráfico de evolución temporal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TimelineChart />
      </div>
    </div>
  );
};
