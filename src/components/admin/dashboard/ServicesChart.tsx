
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPopularServices } from "@/services/adminDashboardService";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const ServicesChart: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['popular-services'],
    queryFn: fetchPopularServices
  });

  if (isLoading) {
    return (
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Servicios Más Populares</CardTitle>
          <CardDescription>Por cantidad de usuarios</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  // Formato de datos para el gráfico
  const chartData = data || [];
  
  // Configurar colores para cada categoría
  const categoryColors: { [key: string]: string } = {
    "diseño": "#0088FE",
    "desarrollo": "#00C49F", 
    "marketing": "#FFBB28",
    "contenido": "#FF8042",
    "otros": "#A259FF"
  };
  
  // Configurar el objeto config para el ChartContainer
  const chartConfig = Object.entries(categoryColors).reduce((acc, [category, color]) => {
    acc[category] = { color };
    return acc;
  }, {} as Record<string, { color: string }>);

  // Helper function to determine fill color based on category
  const getBarFill = (entry: any) => {
    const category = entry?.category?.toLowerCase() || "otros";
    return categoryColors[category] || "#A259FF";
  };

  // Pre-compute the fill colors for each data point
  const dataWithColors = chartData.map(item => ({
    ...item,
    fillColor: getBarFill(item)
  }));

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Servicios Más Populares</CardTitle>
        <CardDescription>Por cantidad de usuarios</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ChartContainer config={chartConfig}>
            <BarChart data={dataWithColors}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                content={({ active, payload, label }) => active && payload?.length ? (
                  <ChartTooltipContent
                    payload={payload}
                    label={label}
                    formatter={(value, name) => [`${value} usuarios`, name === "count" ? "Usuarios" : name]}
                  />
                ) : null}
              />
              <Bar 
                dataKey="count" 
                name="Usuarios"
                radius={[4, 4, 0, 0]}
                fillOpacity={0.8}
                stroke=""
                fill="fillColor"
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
