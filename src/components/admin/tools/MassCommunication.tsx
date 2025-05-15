
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Checkbox
} from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  MessageSquare, 
  Mail, 
  Users, 
  Send, 
  Loader2 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  fetchClientsForCommunication, 
  sendMassEmail 
} from "@/services/adminToolsService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const MassCommunication: React.FC = () => {
  const { user } = useAuth();
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailContent, setEmailContent] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);

  // Consulta para obtener clientes
  const { 
    data: clients, 
    isLoading: isLoadingClients 
  } = useQuery({
    queryKey: ['clients-for-communication'],
    queryFn: fetchClientsForCommunication
  });

  // Filtrar clientes según la búsqueda
  const filteredClients = React.useMemo(() => {
    if (!clients) return [];
    if (!searchQuery) return clients;

    return clients.filter(client => {
      const searchLower = searchQuery.toLowerCase();
      return (
        (client.first_name && client.first_name.toLowerCase().includes(searchLower)) ||
        (client.last_name && client.last_name.toLowerCase().includes(searchLower)) ||
        (client.business_name && client.business_name.toLowerCase().includes(searchLower)) ||
        (client.email && client.email.toLowerCase().includes(searchLower))
      );
    });
  }, [clients, searchQuery]);

  // Manejar la selección de todos los clientes
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedClientIds(filteredClients.map(client => client.user_id));
    } else {
      setSelectedClientIds([]);
    }
  };

  // Manejar la selección de un cliente individual
  const handleSelectClient = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClientIds(prev => [...prev, clientId]);
    } else {
      setSelectedClientIds(prev => prev.filter(id => id !== clientId));
    }
  };

  // Enviar correo masivo
  const handleSendEmail = async () => {
    if (!user?.id) {
      toast.error("No se encontró información de usuario");
      return;
    }

    if (selectedClientIds.length === 0) {
      toast.error("Selecciona al menos un destinatario");
      return;
    }

    if (!emailSubject.trim()) {
      toast.error("El asunto del correo es obligatorio");
      return;
    }

    if (!emailContent.trim()) {
      toast.error("El contenido del correo es obligatorio");
      return;
    }

    setSending(true);

    try {
      // Obtener correos de los clientes seleccionados
      const selectedEmails = filteredClients
        .filter(client => selectedClientIds.includes(client.user_id) && client.email)
        .map(client => client.email as string);
      
      if (selectedEmails.length === 0) {
        toast.error("No hay correos válidos para enviar");
        return;
      }
      
      // Enviar el correo masivo
      await sendMassEmail(selectedEmails, emailSubject, emailContent);
      
      // Limpiar el formulario
      setEmailSubject("");
      setEmailContent("");
      setSelectedClientIds([]);
      setSelectAll(false);
      
      toast.success(`Correo enviado a ${selectedEmails.length} destinatarios`);
    } catch (error) {
      console.error("Error sending mass email:", error);
      toast.error("Error al enviar el correo masivo");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comunicación Masiva
          </CardTitle>
          <CardDescription>
            Envía correos electrónicos o notificaciones a grupos de clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Correo Electrónico
              </TabsTrigger>
              <TabsTrigger value="notification" className="flex items-center gap-2" disabled>
                <MessageSquare className="h-4 w-4" />
                Notificaciones
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="email" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Destinatarios */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Destinatarios
                      </CardTitle>
                      <CardDescription>
                        Selecciona los clientes a los que deseas enviar el correo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <Input
                          placeholder="Buscar clientes..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className="max-h-[400px] overflow-y-auto border rounded-md">
                        {isLoadingClients ? (
                          <div className="p-4 space-y-2">
                            {[1, 2, 3, 4].map((i) => (
                              <Skeleton key={i} className="h-6 w-full" />
                            ))}
                          </div>
                        ) : !filteredClients || filteredClients.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            No hay clientes disponibles
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[40px]">
                                  <Checkbox 
                                    checked={selectAll}
                                    onCheckedChange={handleSelectAll}
                                  />
                                </TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Email</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredClients.map((client) => (
                                <TableRow key={client.user_id}>
                                  <TableCell>
                                    <Checkbox 
                                      checked={selectedClientIds.includes(client.user_id)}
                                      onCheckedChange={(checked) => 
                                        handleSelectClient(client.user_id, checked === true)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="truncate max-w-[120px]">
                                    {client.business_name || 
                                      `${client.first_name || ''} ${client.last_name || ''}`.trim() || 
                                      'Cliente sin nombre'}
                                  </TableCell>
                                  <TableCell className="truncate max-w-[120px]">{client.email || 'Sin correo'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>

                      <div className="mt-2 text-sm text-muted-foreground">
                        {filteredClients?.length > 0 ? (
                          <p>{selectedClientIds.length} de {filteredClients.length} clientes seleccionados</p>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Composición del correo */}
                <div className="lg:col-span-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Componer Mensaje
                      </CardTitle>
                      <CardDescription>
                        Escribe el contenido del correo a enviar
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-subject">Asunto</Label>
                        <Input
                          id="email-subject"
                          placeholder="Asunto del correo..."
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email-content">Contenido</Label>
                        <Textarea
                          id="email-content"
                          placeholder="Escribe el contenido del mensaje..."
                          className="h-[250px] resize-none"
                          value={emailContent}
                          onChange={(e) => setEmailContent(e.target.value)}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end border-t pt-4">
                      <Button
                        className="flex items-center gap-2"
                        onClick={handleSendEmail}
                        disabled={
                          sending || 
                          selectedClientIds.length === 0 || 
                          !emailSubject.trim() || 
                          !emailContent.trim()
                        }
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {sending ? "Enviando..." : "Enviar Correo"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
