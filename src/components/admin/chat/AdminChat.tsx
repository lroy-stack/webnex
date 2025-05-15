import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { 
  fetchAllConversations, 
  ChatConversation,
  countUnreadMessages,
  markMessagesAsRead
} from "@/services/chatService";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ConversationList } from "@/components/chat/ConversationList";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton"; 
import { supabase } from "@/integrations/supabase/client";

interface AdminChatProps {
  projectId?: string | null;
}

export const AdminChat: React.FC<AdminChatProps> = ({ projectId }) => {
  // Estado para conversaciones y conversación activa
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  
  // Estado para el diálogo de nueva conversación
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [conversationTitle, setConversationTitle] = useState("");
  const [conversationCategory, setConversationCategory] = useState("");
  
  // Estados para clientes y proyectos
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para la visualización móvil
  const [showConversationList, setShowConversationList] = useState(true);
  const isMobile = useIsMobile();
  
  const { user, userRole } = useAuth();
  
  // Referencia para la actualización periódica
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Cargar conversaciones iniciales
    loadConversations();
    
    // Configurar actualización periódica
    timerRef.current = setInterval(() => {
      loadConversations();
    }, 30000);
    
    // Obtener clientes para el diálogo de nueva conversación
    fetchClients();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [user, projectId]);
  
  useEffect(() => {
    // Si hay una conversación activa, cargar sus proyectos
    if (selectedClientId) {
      fetchClientProjects(selectedClientId);
    } else {
      setProjects([]);
      setSelectedProjectId("");
    }
  }, [selectedClientId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await fetchAllConversations(projectId || null);
      setConversations(data);
      
      // Mantener la conversación activa si existe en la nueva lista
      if (activeConversation) {
        const updatedActiveConv = data.find(c => c.id === activeConversation.id);
        if (updatedActiveConv) {
          setActiveConversation(updatedActiveConv);
        }
      }
      
      setLoading(false);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Error al cargar las conversaciones");
      setLoading(false);
      setError("No se pudieron cargar las conversaciones");
    }
  };
  
  const fetchClients = async () => {
    try {
      // Check admin privileges first
      if (userRole !== 'admin') {
        setError("Se requieren privilegios de administrador");
        return;
      }
      
      setLoadingClients(true);
      setError(null); // Clear any previous errors
      
      // Use Supabase client directly
      const { data, error } = await supabase
        .from('client_profiles_with_email')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching clients:", error);
        setError(`Error al cargar los clientes: ${error.message}`);
        setClients([]);
      } else {
        setClients(data || []);
      }
      
      setLoadingClients(false);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Error al cargar los clientes");
      setClients([]);
      setLoadingClients(false);
    }
  };
  
  const fetchClientProjects = async (clientId: string) => {
    try {
      setLoadingProjects(true);
      setError(null); // Clear any previous errors
      
      // Use Supabase client directly
      const { data, error } = await supabase
        .from('client_projects')
        .select('id, name, status')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching client projects:", error);
        setError(`Error al cargar los proyectos del cliente: ${error.message}`);
        setProjects([]);
      } else {
        setProjects(data || []);
      }
      
      setLoadingProjects(false);
    } catch (error) {
      console.error("Error fetching client projects:", error);
      setError("Error al cargar los proyectos del cliente");
      setProjects([]);
      setLoadingProjects(false);
    }
  };

  const handleConversationSelected = async (conversation: ChatConversation) => {
    setActiveConversation(conversation);
    
    if (isMobile) {
      setShowConversationList(false);
    }
    
    // Marcar mensajes como leídos cuando se selecciona una conversación
    await markMessagesAsRead(conversation.id, true);
  };
  
  const handleConversationUpdated = () => {
    // Actualizar la lista de conversaciones
    loadConversations();
  };

  const handleCreateNewConversation = async () => {
    if (!user) return;

    try {
      // Validate admin privileges
      if (userRole !== 'admin') {
        toast.error("Se requieren privilegios de administrador");
        return;
      }
      
      // Using the conversations edge function instead of direct Supabase query
      const response = await fetch("https://xlemleldxfgarrcoffkq.supabase.co/functions/v1/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          adminId: user.id,
          title: conversationTitle || "Nueva conversación",
          category: conversationCategory || null,
          projectId: selectedProjectId === "none" ? null : selectedProjectId || null
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const newConversation = await response.json();

      if (newConversation) {
        // Recargar las conversaciones para incluir la nueva
        await loadConversations();
        
        // Seleccionar la nueva conversación
        setActiveConversation(newConversation);
        
        // Cerrar el diálogo
        setShowNewDialog(false);
        
        // Limpiar el formulario
        setSelectedClientId("");
        setSelectedProjectId("");
        setConversationTitle("");
        setConversationCategory("");
        
        // Si estamos en móvil, mostrar la conversación
        if (isMobile) {
          setShowConversationList(false);
        }

        toast.success("Conversación creada correctamente");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error(`Error al crear la conversación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // If there's an error accessing the system, show a prominent error message
  if (error && !loading && conversations.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <AlertDescription>
            <h3 className="font-medium mb-1">Error de acceso</h3>
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadConversations} 
              className="mt-2"
            >
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if user has admin role
  if (userRole !== 'admin') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <AlertDescription>
            <h3 className="font-medium mb-1">Acceso denegado</h3>
            <p>Se requieren privilegios de administrador para acceder al chat de administración.</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading skeleton
  if (loading && conversations.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-full overflow-hidden border rounded-lg bg-background">
        <div className="col-span-1 md:col-span-1 lg:col-span-1 border-r flex flex-col h-full">
          <div className="p-4 border-b flex justify-between items-center">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="mb-4">
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-3 h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-center h-full p-4">
            <Skeleton className="h-32 w-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-full overflow-hidden border rounded-lg bg-background">
      {/* Lista de conversaciones - visible solo en desktop o cuando está activa en móvil */}
      {(!isMobile || showConversationList) && (
        <div className="col-span-1 md:col-span-1 lg:col-span-1 border-r flex flex-col h-full">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-medium">Conversaciones</h2>
            <Button onClick={() => setShowNewDialog(true)} size="sm" className="ml-2">
              <Plus className="h-4 w-4 mr-1" />
              Nueva
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <ConversationList 
              conversations={conversations}
              activeConversationId={activeConversation?.id || null}
              onSelectConversation={handleConversationSelected}
              isAdmin={true}
              isLoading={loading}
            />
          </div>
        </div>
      )}
      
      {/* Contenedor de chat - ocupa el resto del espacio */}
      <div className={`col-span-1 ${(!isMobile || !showConversationList) ? "md:col-span-2 lg:col-span-3" : "hidden md:block"} h-full flex flex-col overflow-hidden`}>
        {activeConversation ? (
          <ChatContainer 
            conversation={activeConversation}
            isAdmin={true}
            onBack={() => setShowConversationList(true)}
            onConversationUpdated={handleConversationUpdated}
          />
        ) : (
          <div className="flex items-center justify-center h-full p-4 text-center">
            <div>
              <h3 className="text-lg font-medium mb-2">Selecciona una conversación</h3>
              <p className="text-muted-foreground">
                O crea una nueva para empezar a chatear con un cliente
              </p>
              
              {isMobile && (
                <Button onClick={() => setShowNewDialog(true)} className="mt-4">
                  Nueva conversación
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Diálogo para nueva conversación */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva conversación</DialogTitle>
            <DialogDescription>
              Crea una nueva conversación con un cliente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingClients ? "Cargando clientes..." : "Selecciona un cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.user_id}>
                      {client.business_name || `${client.first_name} ${client.last_name}`.trim() || client.email}
                    </SelectItem>
                  ))}
                  {clients.length === 0 && !loadingClients && (
                    <div className="px-2 py-1.5 text-muted-foreground text-sm">
                      No hay clientes disponibles
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedClientId && (
              <div className="space-y-2">
                <Label htmlFor="project">Proyecto (Opcional)</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingProjects ? "Cargando proyectos..." : "Selecciona un proyecto"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proyecto</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                    {projects.length === 0 && !loadingProjects && (
                      <div className="px-2 py-1.5 text-muted-foreground text-sm">
                        Este cliente no tiene proyectos activos
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={conversationTitle}
                onChange={(e) => setConversationTitle(e.target.value)}
                placeholder="Título de la conversación"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoría (Opcional)</Label>
              <Input
                id="category"
                value={conversationCategory}
                onChange={(e) => setConversationCategory(e.target.value)}
                placeholder="Ej: Soporte, Ventas, Consulta"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateNewConversation}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChat;