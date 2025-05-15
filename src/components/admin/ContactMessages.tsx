
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type ContactStatus = "new" | "in_progress" | "completed";
type ContactPriority = "low" | "medium" | "high";

export function ContactMessages() {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | ContactStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | ContactPriority>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMessages();
  }, [statusFilter, priorityFilter]);

  async function fetchMessages() {
    setLoading(true);
    let query = supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter as ContactStatus);
    }

    if (priorityFilter !== "all") {
      query = query.eq("priority", priorityFilter as ContactPriority);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  }

  async function updateMessageStatus(id: string, status: ContactStatus) {
    const { error } = await supabase
      .from("contact_messages")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating message status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del mensaje",
        variant: "destructive"
      });
    } else {
      fetchMessages();
      toast({
        title: "Estado actualizado",
        description: "El estado del mensaje ha sido actualizado",
      });
    }
  }

  // Filter messages by search term
  const filteredMessages = messages.filter(
    (message) =>
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case "new":
        return <Badge variant="default">Nuevo</Badge>;
      case "in_progress":
        return <Badge variant="secondary">En progreso</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Alta</Badge>;
      case "medium":
        return <Badge variant="secondary">Media</Badge>;
      case "low":
        return <Badge variant="outline">Baja</Badge>;
      default:
        return <Badge variant="outline">Media</Badge>;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <h2 className="text-2xl font-bold">Mensajes de Contacto</h2>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <Input
            placeholder="Buscar mensajes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-[250px]"
          />

          <Select 
            value={statusFilter} 
            onValueChange={(value: "all" | ContactStatus) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="new">Nuevos</SelectItem>
              <SelectItem value="in_progress">En progreso</SelectItem>
              <SelectItem value="completed">Completados</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={priorityFilter} 
            onValueChange={(value: "all" | ContactPriority) => setPriorityFilter(value)}
          >
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchMessages}>Actualizar</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando mensajes...</div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-10">No se encontraron mensajes</div>
      ) : (
        <div className="grid gap-6">
          {filteredMessages.map((message) => (
            <Card key={message.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{message.subject}</CardTitle>
                    <CardDescription className="flex items-center mt-1 gap-2">
                      <span>
                        De: {message.name} ({message.email})
                      </span>
                      {message.phone && <span>• Tel: {message.phone}</span>}
                      {message.company && <span>• {message.company}</span>}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getPriorityBadge(message.priority)}
                    {getStatusBadge(message.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="mb-4 whitespace-pre-wrap">{message.message}</div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-sm text-muted-foreground mt-4 gap-4">
                  <div>
                    <p>Recibido: {formatDate(message.created_at)}</p>
                    {message.project_type && (
                      <p>Tipo de proyecto: {message.project_type}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Select 
                      defaultValue={message.status} 
                      onValueChange={(value: ContactStatus) => updateMessageStatus(message.id, value as ContactStatus)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Cambiar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Nuevo</SelectItem>
                        <SelectItem value="in_progress">En progreso</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">Ver detalles</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
