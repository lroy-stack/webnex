import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { 
  fetchClientConversations, 
  createConversation,
  ChatConversation,
  countUnreadMessages,
  markMessagesAsRead
} from "@/services/chatService";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ConversationList } from "@/components/chat/ConversationList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter,
  SheetTrigger
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface ClientChatProps {
  projectId?: string | null;
}

export const ClientChat: React.FC<ClientChatProps> = ({ projectId }) => {
  // Estado para conversaciones y conversación activa
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  
  // Estado para el diálogo de nueva conversación
  const [showNewConversationSheet, setShowNewConversationSheet] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState("");
  const [newConversationCategory, setNewConversationCategory] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  
  // Estado para la lista de proyectos del cliente
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  
  // Estado para la visualización móvil
  const [showConversationList, setShowConversationList] = useState(true);
  const isMobile = useIsMobile();
  
  const { user } = useAuth();
  
  // Referencia para la actualización periódica
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Cargar conversaciones iniciales
    loadConversations();
    
    // Obtener proyectos del cliente
    loadClientProjects();
    
    // Configurar actualización periódica
    timerRef.current = setInterval(() => {
      loadConversations();
    }, 30000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [user, projectId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await fetchClientConversations(projectId || null);
      setConversations(data);
      
      // Mantener la conversación activa si existe en la nueva lista
      if (activeConversation) {
        const updatedActiveConv = data.find(c => c.id === activeConversation.id);
        if (updatedActiveConv) {
          setActiveConversation(updatedActiveConv);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Error al cargar tus conversaciones");
      setLoading(false);
    }
  };
  
  const loadClientProjects = async () => {
    if (!user) return;
    
    try {
      setLoadingProjects(true);
      
      // Use direct Supabase query instead of fetch API
      const { data, error } = await supabase
        .from('client_projects')
        .select('id, name, status')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setClientProjects(data || []);
      
      console.log("Client projects loaded:", data?.length || 0);
      
      // If we have a projectId from props, preselect it
      if (projectId && data && data.length > 0) {
        setSelectedProjectId(projectId);
      }
      
      setLoadingProjects(false);
    } catch (error) {
      console.error("Error loading client projects:", error);
      toast.error("Error al cargar la lista de proyectos");
      setLoadingProjects(false);
    }
  };

  const handleConversationSelected = async (conversation: ChatConversation) => {
    setActiveConversation(conversation);
    
    if (isMobile) {
      setShowConversationList(false);
    }
    
    // Marcar mensajes como leídos cuando se selecciona una conversación
    await markMessagesAsRead(conversation.id, false);
  };
  
  const handleConversationUpdated = () => {
    // Actualizar la lista de conversaciones
    loadConversations();
  };

  const handleCreateNewConversation = async () => {
    if (!user) return;

    try {
      // Update to handle "none" value properly
      const finalProjectId = selectedProjectId === "none" ? null : (selectedProjectId || projectId || null);
      
      // Using direct Supabase query instead of fetch API
      const { data: newConversation, error } = await supabase
        .from('chat_conversations')
        .insert({
          client_id: user.id,
          admin_id: null,
          title: newConversationTitle || "Nueva consulta",
          category: newConversationCategory || null,
          project_id: finalProjectId,
          status: 'active'
        })
        .select('*')
        .single();
      
      if (error) {
        console.error("Error creating conversation:", error);
        toast.error("Error al crear la conversación");
        return;
      }

      if (newConversation) {
        // Recargar las conversaciones para incluir la nueva
        await loadConversations();
        
        // Seleccionar la nueva conversación
        setActiveConversation(newConversation as ChatConversation);
        
        // Cerrar el diálogo
        setShowNewConversationSheet(false);
        
        // Limpiar el formulario
        setNewConversationTitle("");
        setNewConversationCategory("");
        setSelectedProjectId("");
        
        // Si estamos en móvil, mostrar la conversación
        if (isMobile) {
          setShowConversationList(false);
        }

        toast.success("Conversación creada correctamente");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Error al crear la conversación");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-full overflow-hidden border rounded-lg bg-background">
      {/* Lista de conversaciones - visible solo en desktop o cuando está activa en móvil */}
      {(!isMobile || showConversationList) && (
        <div className="col-span-1 md:col-span-1 lg:col-span-1 border-r flex flex-col h-full">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-medium">Mis Consultas</h2>
            <Button onClick={() => setShowNewConversationSheet(true)} size="sm" className="ml-2">
              <Plus className="h-4 w-4 mr-1" />
              Nueva
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <ConversationList 
              conversations={conversations}
              activeConversationId={activeConversation?.id || null}
              onSelectConversation={handleConversationSelected}
              isAdmin={false}
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
            isAdmin={false}
            onBack={() => setShowConversationList(true)}
            onConversationUpdated={handleConversationUpdated}
          />
        ) : (
          <div className="flex items-center justify-center h-full p-4 text-center">
            <div>
              <h3 className="text-lg font-medium mb-2">Selecciona una consulta</h3>
              <p className="text-muted-foreground">
                O crea una nueva para comunicarte con nuestro equipo
              </p>
              
              {isMobile && (
                <Button onClick={() => setShowNewConversationSheet(true)} className="mt-4">
                  Nueva consulta
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Hoja lateral para nueva conversación en vez de diálogo */}
      <Sheet open={showNewConversationSheet} onOpenChange={setShowNewConversationSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nueva consulta</SheetTitle>
            <SheetDescription>
              Inicia una conversación con nuestro equipo
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={newConversationTitle}
                onChange={(e) => setNewConversationTitle(e.target.value)}
                placeholder="Título de la consulta"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoría (Opcional)</Label>
              <Input
                id="category"
                value={newConversationCategory}
                onChange={(e) => setNewConversationCategory(e.target.value)}
                placeholder="Ej: Soporte, Información, Problema"
              />
            </div>
            
            {/* Selección de proyecto */}
            <div className="space-y-2">
              <Label htmlFor="project">Proyecto (Opcional)</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingProjects ? "Cargando proyectos..." : "Selecciona un proyecto"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proyecto</SelectItem>
                  {clientProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                  {clientProjects.length === 0 && !loadingProjects && (
                    <div className="px-2 py-1.5 text-muted-foreground text-sm">
                      No tienes proyectos activos
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Puedes vincular esta consulta a uno de tus proyectos existentes
              </p>
            </div>
          </div>
          
          <SheetFooter>
            <Button variant="outline" onClick={() => setShowNewConversationSheet(false)}>Cancelar</Button>
            <Button onClick={handleCreateNewConversation}>Crear</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ClientChat;