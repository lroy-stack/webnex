
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Download, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSystemLogs, fetchAdminActionLogs, generateCSV } from "@/services/adminToolsService";
import type { SystemLogEntry } from "@/services/adminToolsService";
import { format } from "date-fns";
import { toast } from "sonner";

export const SystemLogs: React.FC = () => {
  const [logType, setLogType] = useState<string>("user_activity");
  const [logFilter, setLogFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Obtener logs de actividad de usuario
  const { 
    data: userLogs, 
    isLoading: isLoadingUserLogs,
    refetch: refetchUserLogs 
  } = useQuery({
    queryKey: ['system-logs', logFilter],
    queryFn: () => fetchSystemLogs(100, logFilter === "all" ? undefined : logFilter),
    enabled: logType === "user_activity"
  });

  // Obtener logs de acciones administrativas
  const { 
    data: adminLogs, 
    isLoading: isLoadingAdminLogs,
    refetch: refetchAdminLogs 
  } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => fetchAdminActionLogs(100),
    enabled: logType === "admin_action"
  });

  // Filtrar logs según la búsqueda
  const filteredLogs = React.useMemo(() => {
    const logs = logType === "user_activity" ? userLogs : adminLogs;
    if (!logs || !searchQuery) return logs;

    return logs.filter((log: any) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        (log.description && log.description.toLowerCase().includes(searchLower)) ||
        (log.event_type && log.event_type.toLowerCase().includes(searchLower)) ||
        (log.user_email && log.user_email.toLowerCase().includes(searchLower)) ||
        (log.action_type && log.action_type.toLowerCase().includes(searchLower))
      );
    });
  }, [logType, userLogs, adminLogs, searchQuery]);

  // Exportar logs
  const handleExportLogs = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      toast.error("No hay logs para exportar");
      return;
    }

    generateCSV(filteredLogs, `${logType}-logs-${new Date().toISOString().split('T')[0]}`);
    toast.success("Logs exportados correctamente");
  };

  // Refrescar logs
  const handleRefreshLogs = () => {
    if (logType === "user_activity") {
      refetchUserLogs();
    } else {
      refetchAdminLogs();
    }
    toast.success("Logs actualizados");
  };

  // Lista de tipos de logs de usuario
  const userLogTypes = [
    { value: "all", label: "Todos los tipos" },
    { value: "login", label: "Inicios de sesión" },
    { value: "logout", label: "Cierres de sesión" },
    { value: "profile_update", label: "Actualización de perfil" },
    { value: "subscription_change", label: "Cambios de suscripción" },
    { value: "password_reset", label: "Reseteos de contraseña" }
  ];

  const isLoading = logType === "user_activity" ? isLoadingUserLogs : isLoadingAdminLogs;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs del Sistema
          </CardTitle>
          <CardDescription>
            Visualiza registros de actividades y eventos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tipo de Log
                  </label>
                  <Select 
                    value={logType}
                    onValueChange={(value) => {
                      setLogType(value);
                      setLogFilter("all"); // Resetear el filtro al cambiar de tipo
                      setSearchQuery(""); // Resetear la búsqueda
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="user_activity">Actividad de usuarios</SelectItem>
                        <SelectItem value="admin_action">Acciones administrativas</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                {logType === "user_activity" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Filtrar por evento
                    </label>
                    <Select 
                      value={logFilter}
                      onValueChange={setLogFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los eventos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {userLogTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar en logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefreshLogs}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button 
                onClick={handleExportLogs}
                disabled={isLoading || !filteredLogs || filteredLogs.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          <div className="border rounded-md">
            {isLoading ? (
              <div className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ) : !filteredLogs || filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No hay logs disponibles para mostrar
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      {logType === "user_activity" ? (
                        <>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Tipo de Evento</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Acción</TableHead>
                          <TableHead>Entidad</TableHead>
                        </>
                      )}
                      <TableHead className="w-1/3">Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {log.created_at ? 
                            format(new Date(log.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                        </TableCell>
                        
                        {logType === "user_activity" ? (
                          <>
                            <TableCell className="max-w-[200px] truncate">
                              {log.user_email || log.user_id?.substring(0, 8) || 'N/A'}
                            </TableCell>
                            <TableCell>{log.event_type || 'N/A'}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{log.action_type || 'N/A'}</TableCell>
                            <TableCell>{log.entity_type || 'N/A'}</TableCell>
                          </>
                        )}
                        
                        <TableCell className="max-w-[300px]">
                          <div className="truncate">
                            {log.description || 'Sin descripción'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {filteredLogs && filteredLogs.length > 0 && (
              <div className="p-3 text-center text-sm text-muted-foreground border-t">
                Mostrando {filteredLogs.length} registros
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
