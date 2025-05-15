
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Package, List, TrendingUp } from "lucide-react";
import { fetchDashboardStats } from "@/services/adminDashboardService";

export const StatisticsOverview: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats?.activeClients || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.clientsGrowth > 0 
                  ? `+${stats?.clientsGrowth}% desde el mes pasado` 
                  : stats?.clientsGrowth < 0 
                  ? `${stats?.clientsGrowth}% desde el mes pasado`
                  : "Sin cambios desde el mes pasado"}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Packs Vendidos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats?.totalPacks || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.packsGrowth > 0 
                  ? `+${stats?.packsGrowth}% desde el mes pasado` 
                  : stats?.packsGrowth < 0 
                  ? `${stats?.packsGrowth}% desde el mes pasado` 
                  : "Sin cambios desde el mes pasado"}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Servicios Activos</CardTitle>
          <List className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats?.activeServices || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.servicesGrowth > 0 
                  ? `+${stats?.servicesGrowth}% desde el mes pasado` 
                  : stats?.servicesGrowth < 0 
                  ? `${stats?.servicesGrowth}% desde el mes pasado` 
                  : "Sin cambios desde el mes pasado"}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {stats?.conversionGrowth > 0 
                  ? `+${stats?.conversionGrowth}% desde el mes pasado` 
                  : stats?.conversionGrowth < 0 
                  ? `${stats?.conversionGrowth}% desde el mes pasado` 
                  : "Sin cambios desde el mes pasado"}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
