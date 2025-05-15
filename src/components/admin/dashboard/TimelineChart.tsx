
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTimelineStats } from "@/services/adminDashboardService";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export const TimelineChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState<"30" | "90" | "180" | "365">("30");
  
  const { data, isLoading } = useQuery({
    queryKey: ['timeline-stats', timeRange],
    queryFn: () => fetchTimelineStats(timeRange)
  });

  const chartConfig = {
    clients: { color: "#0088FE", label: "Clientes" },
    services: { color: "#00C49F", label: "Servicios" },
    inquiries: { color: "#FF8042", label: "Consultas" }
  };

  return (
    <Card className="col-span-1 md:col-span-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Evolución Temporal</CardTitle>
          <CardDescription>Tendencias de crecimiento</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as "30" | "90" | "180" | "365")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleccionar periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="90">Últimos 3 meses</SelectItem>
            <SelectItem value="180">Últimos 6 meses</SelectItem>
            <SelectItem value="365">Último año</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <ChartContainer config={chartConfig}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => active && payload?.length ? (
                    <ChartTooltipContent
                      payload={payload}
                      label={label}
                    />
                  ) : null}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="clients" 
                  stroke="#0088FE" 
                  activeDot={{ r: 8 }}
                  name="Clientes" 
                />
                <Line 
                  type="monotone" 
                  dataKey="services" 
                  stroke="#00C49F" 
                  name="Servicios" 
                />
                <Line 
                  type="monotone" 
                  dataKey="inquiries" 
                  stroke="#FF8042" 
                  name="Consultas" 
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Datos actualizados en tiempo real desde la base de datos
      </CardFooter>
    </Card>
  );
};
