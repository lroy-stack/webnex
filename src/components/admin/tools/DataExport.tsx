
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Loader2 } from "lucide-react";
import { fetchExportableData, generateCSV } from "@/services/adminToolsService";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const DataExport: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>("client_profiles_with_email");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Lista de tablas exportables
  const exportableTables = [
    { id: "client_profiles_with_email", name: "Perfiles de Clientes" },
    { id: "my_services", name: "Servicios" },
    { id: "my_packs", name: "Packs" },
    { id: "contact_messages", name: "Mensajes de Contacto" },
    { id: "user_modules", name: "Módulos de Usuario" },
    { id: "user_activity_logs", name: "Logs de Actividad" },
    { id: "admin_action_logs", name: "Logs de Acciones" }
  ];

  // Consulta para obtener una vista previa de los datos
  const { data: previewData, isLoading, refetch } = useQuery({
    queryKey: ['export-preview', selectedTable],
    queryFn: () => fetchExportableData(selectedTable, 10),
    enabled: !!selectedTable
  });

  // Función para manejar la exportación
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await fetchExportableData(selectedTable, 1000);
      generateCSV(data, `${selectedTable}-export-${new Date().toISOString().split('T')[0]}`);
      toast.success("Exportación completada con éxito");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Error al exportar datos");
    } finally {
      setIsExporting(false);
    }
  };

  // Determinar las columnas a mostrar en la vista previa
  const getPreviewColumns = () => {
    if (!previewData || previewData.length === 0) return [];
    
    // Seleccionar solo algunas columnas importantes para la vista previa
    const allColumns = Object.keys(previewData[0]);
    const priorityColumns = ['id', 'name', 'business_name', 'email', 'title', 'description', 'created_at'];
    
    // Filtrar por columnas prioritarias primero, luego agregar otras columnas hasta un máximo de 6
    let previewColumns = priorityColumns.filter(col => allColumns.includes(col));
    
    if (previewColumns.length < 6) {
      const remainingColumns = allColumns
        .filter(col => !previewColumns.includes(col))
        .filter(col => !col.includes('password') && !col.includes('token')); // Excluir columnas sensibles
      
      previewColumns = [...previewColumns, ...remainingColumns.slice(0, 6 - previewColumns.length)];
    } else {
      previewColumns = previewColumns.slice(0, 6);
    }
    
    return previewColumns;
  };

  const previewColumns = getPreviewColumns();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exportación de Datos
          </CardTitle>
          <CardDescription>
            Genera informes y exporta datos en formatos CSV para su análisis o respaldo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-grow">
              <label htmlFor="table-select" className="block text-sm font-medium mb-2">
                Seleccionar Tabla
              </label>
              <Select 
                value={selectedTable}
                onValueChange={(value) => setSelectedTable(value)}
              >
                <SelectTrigger id="table-select" className="w-full">
                  <SelectValue placeholder="Seleccione una tabla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {exportableTables.map(table => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleExport} 
                disabled={isLoading || isExporting || !selectedTable}
                className="w-full md:w-auto"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="border rounded-md">
            <div className="p-4 bg-muted/50 border-b">
              <h3 className="font-medium">Vista Previa</h3>
            </div>
            
            {isLoading ? (
              <div className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ) : !previewData || previewData.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No hay datos disponibles para mostrar
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewColumns.map(column => (
                        <TableHead key={column} className="whitespace-nowrap">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 5).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {previewColumns.map((column, colIndex) => (
                          <TableCell key={`${rowIndex}-${colIndex}`} className="truncate max-w-[200px]">
                            {typeof row[column] === 'object' 
                              ? JSON.stringify(row[column]).slice(0, 50) + (JSON.stringify(row[column]).length > 50 ? '...' : '')
                              : String(row[column] || '').slice(0, 50) + (String(row[column] || '').length > 50 ? '...' : '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {previewData && previewData.length > 5 && (
              <div className="p-3 text-center text-sm text-muted-foreground border-t">
                Mostrando 5 de {previewData.length} registros
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
