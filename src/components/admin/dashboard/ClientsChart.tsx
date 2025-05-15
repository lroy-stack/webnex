
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
import { fetchClientDistribution } from "@/services/adminDashboardService";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF'];

export const ClientsChart: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['client-distribution'],
    queryFn: fetchClientDistribution
  });

  if (isLoading) {
    return (
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Distribución de Clientes</CardTitle>
          <CardDescription>Por tipo de suscripción</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  // Prepare data for the chart
  const chartData = data?.map(item => ({
    name: item.status || "Sin suscripción",
    value: item.count
  })) || [];

  const chartConfig = chartData.reduce((acc, item, index) => {
    const color = COLORS[index % COLORS.length];
    acc[item.name] = { color };
    return acc;
  }, {} as Record<string, { color: string }>);

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Distribución de Clientes</CardTitle>
        <CardDescription>Por tipo de suscripción</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ChartContainer config={chartConfig}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({name, value, percent}) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
              <ChartTooltip
                content={({ active, payload }) => active && payload?.length ? (
                  <ChartTooltipContent
                    payload={payload}
                    formatter={(value, name) => [`${value} clientes`, name]}
                  />
                ) : null}
              />
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
