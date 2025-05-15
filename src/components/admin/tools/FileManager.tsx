
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FolderArchive, 
  FileUp, 
  Search,
  FilePlus2,
  Trash2,
  Download,
  FolderPlus,
  RefreshCw,
  Loader2,
  ChevronUp,
  Folder,
  File,
  AlertCircle,
  Home,
  LayoutGrid,
  List,
  ArrowUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  fetchFiles, 
  uploadFile, 
  deleteFile, 
  downloadFile,
  createFolder,
  getParentPath,
  StorageFile
} from "@/services/adminToolsService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { useTheme } from "@/contexts/ThemeContext";

// Schema for folder creation
const folderSchema = z.object({
  name: z.string()
    .min(1, "El nombre de la carpeta es requerido")
    .max(50, "El nombre de la carpeta no puede exceder 50 caracteres")
    .refine(value => /^[a-zA-Z0-9-_]+$/.test(value), {
      message: "Solo se permiten letras, números, guiones y guiones bajos",
    })
});

type FolderFormValues = z.infer<typeof folderSchema>;

export const FileManager: React.FC = () => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userRole } = useAuth();
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { theme } = useTheme();
  
  // New state for delete confirmation dialog
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<StorageFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form for creating new folders
  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: "",
    },
  });
  
  const loadFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`Loading files from path: "${currentPath}"`);
      const fileList = await fetchFiles(currentPath);
      setFiles(fileList);
    } catch (error: any) {
      console.error("Error loading files:", error);
      setError(`No se pudo cargar la lista de archivos: ${error.message || "Error desconocido"}`);
      toast.error("No se pudo cargar la lista de archivos");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  useEffect(() => {
    // Verificar permisos de administrador
    if (userRole !== 'admin') {
      setError("Se requieren permisos de administrador para acceder al gestor de archivos");
    }
  }, [userRole]);

  // Filtrar archivos según la búsqueda
  const filteredFiles = React.useMemo(() => {
    if (!searchQuery) return files;
    
    return files.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  // Función para formatear el tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Función para identificar el tipo de archivo
  const getFileIcon = (file: StorageFile): JSX.Element => {
    if (file.isFolder) {
      return <Folder className="h-5 w-5 text-blue-500" />;
    } else if (file.type.includes('image')) {
      return <span className="text-blue-500 text-xl">🖼️</span>;
    } else if (file.type.includes('pdf')) {
      return <span className="text-red-500 text-xl">📄</span>;
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return <span className="text-blue-600 text-xl">📝</span>;
    } else if (file.type.includes('presentation') || file.type.includes('powerpoint')) {
      return <span className="text-orange-500 text-xl">📊</span>;
    } else if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
      return <span className="text-green-600 text-xl">📈</span>;
    } else {
      return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Función para obtener un color de fondo para carpetas
  const getFolderColor = (name: string): string => {
    const darkModeColors = [
      'bg-blue-950/30 border-blue-800/50',
      'bg-green-950/30 border-green-800/50',
      'bg-purple-950/30 border-purple-800/50',
      'bg-amber-950/30 border-amber-800/50',
      'bg-rose-950/30 border-rose-800/50',
      'bg-cyan-950/30 border-cyan-800/50',
    ];
    
    const lightModeColors = [
      'bg-blue-50 border-blue-200',
      'bg-green-50 border-green-200',
      'bg-purple-50 border-purple-200',
      'bg-amber-50 border-amber-200',
      'bg-rose-50 border-rose-200',
      'bg-cyan-50 border-cyan-200',
    ];
    
    // Usar una simple función hash para asignar un color basado en el nombre
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % lightModeColors.length;
    
    return theme === 'dark' ? darkModeColors[colorIndex] : lightModeColors[colorIndex];
  };

  // Navegación de carpetas
  const handleNavigateToFolder = (folder: StorageFile) => {
    // Add current path to history before navigating
    setPathHistory(prev => [...prev, currentPath]);
    
    // Set new path based on folder's path
    setCurrentPath(folder.path);
    console.log(`Navigating to folder: ${folder.path}`);
  };

  // Subida de archivos
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const file = files[0];
      console.log(`Uploading file to path: "${currentPath}"`);
      await uploadFile(file, currentPath);
      toast.success(`Archivo "${file.name}" subido correctamente`, {
        style: { background: 'green', color: 'white' },
        position: 'top-right',
      });
      loadFiles();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setError(`Error al subir el archivo: ${error.message || "Error desconocido"}`);
      toast.error(`No se pudo subir el archivo: ${error.message || "Error desconocido"}`);
    } finally {
      setIsUploading(false);
      // Limpiar el input file
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Descarga de archivo
  const handleDownloadFile = async (file: StorageFile) => {
    try {
      setError(null);
      toast.info(`Descargando ${file.name}...`, {
        position: 'top-right',
      });
      await downloadFile(file.path, file.name);
    } catch (error: any) {
      console.error("Error downloading file:", error);
      setError(`Error al descargar el archivo: ${error.message || "Error desconocido"}`);
      toast.error(`No se pudo descargar el archivo: ${file.name}`);
    }
  };

  // Nueva función para mostrar el diálogo de confirmación de eliminación
  const handleShowDeleteConfirm = (file: StorageFile) => {
    setFileToDelete(file);
    setIsDeleteConfirmOpen(true);
  };

  // Función de eliminación actualizada que se ejecuta después de la confirmación
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    
    setIsDeleting(true);
    try {
      setError(null);
      await deleteFile(fileToDelete.path, fileToDelete.isFolder);
      toast.success(`${fileToDelete.isFolder ? 'Carpeta' : 'Archivo'} ${fileToDelete.name} eliminado correctamente`, {
        style: { background: 'green', color: 'white' },
        position: 'top-right',
      });
      // Cerrar el diálogo y recargar archivos
      setIsDeleteConfirmOpen(false);
      setFileToDelete(null);
      loadFiles();
    } catch (error: any) {
      console.error("Error deleting file:", error);
      setError(`Error al eliminar ${fileToDelete.isFolder ? 'la carpeta' : 'el archivo'}: ${error.message || "Error desconocido"}`);
      toast.error(`No se pudo eliminar ${fileToDelete.isFolder ? 'la carpeta' : 'el archivo'}: ${fileToDelete.name}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Refrescar listado de archivos
  const handleRefresh = () => {
    loadFiles();
    toast.info("Actualizando lista de archivos...", {
      position: 'top-right',
    });
  };

  // Crear carpeta
  const handleCreateFolder = () => {
    form.reset();
    setIsFolderDialogOpen(true);
  };

  // Manejar el envío del formulario de carpeta
  const onSubmitFolder = async (values: FolderFormValues) => {
    setError(null);
    try {
      console.log(`Creating folder "${values.name}" in path "${currentPath}"`);
      const success = await createFolder(values.name, currentPath);
      if (success) {
        toast.success(`Carpeta "${values.name}" creada correctamente`, {
          style: { background: 'green', color: 'white' },
          position: 'top-right',
        });
        loadFiles();
        setIsFolderDialogOpen(false);
      }
    } catch (error: any) {
      console.error("Error creating folder:", error);
      setError(`Error al crear la carpeta: ${error.message || "Error desconocido"}`);
      toast.error(`No se pudo crear la carpeta: ${values.name}`);
    }
  };

  // Navegar al directorio padre
  const handleNavigateUp = () => {
    const parentPath = getParentPath(currentPath);
    // Add current path to history before navigating
    setPathHistory(prev => [...prev, currentPath]);
    setCurrentPath(parentPath);
  };

  // Navegar a la raíz
  const navigateToRoot = () => {
    // Add current path to history before navigating to root
    if (currentPath) {
      setPathHistory(prev => [...prev, currentPath]);
    }
    setCurrentPath("");
  };

  // Renderizar rutas de navegación (breadcrumbs)
  const renderBreadcrumbs = () => {
    if (!currentPath) {
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center">
                <Home className="h-3 w-3 mr-1 inline" />
                <span className="font-medium text-primary">Root</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    }
    
    const parts = currentPath.split('/').filter(Boolean);
    
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={navigateToRoot} className="cursor-pointer flex items-center hover:text-primary transition-colors">
              <Home className="h-3 w-3 mr-1 inline" />
              Root
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {parts.map((part, index) => {
            const path = parts.slice(0, index + 1).join('/');
            return (
              <BreadcrumbItem key={index}>
                <BreadcrumbSeparator />
                {index === parts.length - 1 ? (
                  <BreadcrumbPage className="font-medium text-primary">{part}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink 
                    onClick={() => setCurrentPath(path)} 
                    className="cursor-pointer hover:text-primary transition-colors"
                  >
                    {part}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };

  // Grid view para archivos
  const renderGridView = () => {
    if (filteredFiles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <FilePlus2 className="h-16 w-16 mb-3 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium">No se encontraron archivos</p>
          <p className="text-sm mt-2">Sube nuevos archivos o crea una carpeta para comenzar</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
        {filteredFiles.map((file) => (
          <div 
            key={file.id}
            className={`
              flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200
              ${file.isFolder ? getFolderColor(file.name) : 'bg-card border-border'}
              hover:shadow-md hover:border-primary/30 cursor-pointer
            `}
            onClick={() => file.isFolder && handleNavigateToFolder(file)}
          >
            <div className="h-12 w-12 flex items-center justify-center mb-2">
              {getFileIcon(file)}
            </div>
            <div className="text-center">
              <p className="font-medium truncate w-24 text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {file.isFolder ? `Carpeta` : formatFileSize(file.size)}
              </p>
            </div>
            <div className="mt-3 flex justify-center gap-2 w-full opacity-0 hover:opacity-100 transition-opacity">
              {!file.isFolder && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadFile(file);
                  }}
                  title="Descargar"
                  className="h-8 w-8"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowDeleteConfirm(file);
                }}
                title="Eliminar"
                className="h-8 w-8 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // List view para archivos
  const renderListView = () => {
    if (filteredFiles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <FilePlus2 className="h-16 w-16 mb-3 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium">No se encontraron archivos</p>
          <p className="text-sm mt-2">Sube nuevos archivos o crea una carpeta para comenzar</p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Tamaño</TableHead>
              <TableHead className="hidden md:table-cell">Modificado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFiles.map((file) => (
              <TableRow key={file.id} className="group">
                <TableCell>
                  <div 
                    className={`flex items-center gap-2 ${file.isFolder ? 'cursor-pointer hover:text-primary' : ''}`}
                    onClick={() => file.isFolder && handleNavigateToFolder(file)}
                  >
                    {getFileIcon(file)}
                    <span className="truncate max-w-[250px]">{file.name}</span>
                    {file.isFolder && (
                      <span className="text-xs text-muted-foreground ml-2 bg-muted/50 px-2 py-0.5 rounded-full">
                        Carpeta
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {file.isFolder ? '-' : formatFileSize(file.size)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {new Date(file.updated_at).toLocaleDateString('es-ES')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    {!file.isFolder && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadFile(file)}
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleShowDeleteConfirm(file)}
                      title="Eliminar"
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card className="shadow-md border border-border">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/10 rounded-t-lg border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <FolderArchive className="h-5 w-5 text-primary" />
          Gestor de Archivos
        </CardTitle>
        <CardDescription>
          Administra los archivos compartidos con clientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-6">
        {error && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar archivos..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              title="Vista de cuadrícula"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-muted" : ""}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              title="Vista de lista"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-muted" : ""}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              title="Actualizar"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              title="Crear carpeta"
              onClick={handleCreateFolder}
              className="bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Button 
                variant="default" 
                className="flex items-center gap-2"
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileUp className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {isUploading ? "Subiendo..." : "Subir archivo"}
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div className="border rounded-md bg-card shadow-sm overflow-hidden">
          <div className="p-4 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2">
              <FolderArchive className="h-4 w-4 text-muted-foreground" />
              {renderBreadcrumbs()}
            </div>
            {currentPath && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs flex items-center"
                onClick={handleNavigateUp}
              >
                <ArrowUp className="h-3 w-3 mr-1" />
                Subir un nivel
              </Button>
            )}
          </div>
          
          <div className="min-h-[400px] max-h-[600px] overflow-y-auto bg-card">
            {isLoading ? (
              <div className="p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="flex flex-col items-center space-y-2">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : viewMode === "grid" ? (
              renderGridView()
            ) : (
              renderListView()
            )}
          </div>
          
          {filteredFiles.length > 0 && (
            <div className="p-3 text-center text-sm text-muted-foreground border-t bg-muted/50">
              Mostrando {filteredFiles.length} elementos
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground border-t bg-muted/50 py-3 px-5 rounded-b-lg">
        <div>
          <p className="text-xs text-muted-foreground">
            Gestor de archivos conectado con Supabase Storage (bucket: admin-files)
          </p>
        </div>
      </CardFooter>

      {/* Dialog for folder creation */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear nueva carpeta</DialogTitle>
            <DialogDescription>
              Ingresa el nombre para la nueva carpeta.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitFolder)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la carpeta</FormLabel>
                    <FormControl>
                      <Input placeholder="mi-carpeta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFolderDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                >
                  Crear carpeta
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setFileToDelete(null);
        }}
        title={`Eliminar ${fileToDelete?.isFolder ? 'carpeta' : 'archivo'}`}
        description={
          fileToDelete?.isFolder
            ? `¿Estás seguro de que deseas eliminar la carpeta "${fileToDelete?.name}" y todo su contenido? Esta acción no se puede deshacer.`
            : `¿Estás seguro de que deseas eliminar el archivo "${fileToDelete?.name}"? Esta acción no se puede deshacer.`
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isDeleting}
      />
    </Card>
  );
};

