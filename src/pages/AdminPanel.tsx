
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactMessages } from "@/components/admin/ContactMessages";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Package, 
  List, 
  MessageCircle,
  LayoutDashboard, 
  BarChart3,
  Settings,
  Wrench,
  Mail,
  ShoppingCart,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminChat } from "@/components/admin/chat/AdminChat";

// Import the management components directly
import ClientsManagement from "@/pages/admin/ClientsManagement";
import PacksManagement from "@/pages/admin/PacksManagement";
import ServicesManagement from "@/pages/admin/ServicesManagement";
import ProjectsManagement from "@/pages/admin/ProjectsManagement";
// Import CartItems component
import CartItems from "@/pages/admin/CartItems";

// Import the dashboard component
import { Dashboard } from "@/components/admin/dashboard/Dashboard";
// Import the configuration panel
import { ConfigPanel } from "@/components/admin/config/ConfigPanel";
// Import the tools panel
import { AdminToolsPanel } from "@/components/admin/tools/AdminToolsPanel";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeStatsTab, setActiveStatsTab] = useState("overview");
  const navigate = useNavigate();

  const navigateToModule = (path: string) => {
    navigate(path);
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <BreadcrumbNav />
          
          <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
          
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="clients">Clientes</TabsTrigger>
              <TabsTrigger value="packs">Packs</TabsTrigger>
              <TabsTrigger value="services">Servicios</TabsTrigger>
              <TabsTrigger value="projects">Proyectos</TabsTrigger>
              <TabsTrigger value="carts">Carritos</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="messages">Mensajes</TabsTrigger>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
              <TabsTrigger value="config">Configuración</TabsTrigger>
              <TabsTrigger value="tools">Herramientas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                  <div className="h-2 bg-blue-500" />
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4 text-blue-500">
                      <Users className="h-6 w-6 mr-2" />
                      <h2 className="text-xl font-semibold">Gestión de Clientes</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Administra los usuarios y clientes registrados en la plataforma.
                    </p>
                    <div className="flex justify-between">
                      <Button 
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => setActiveTab("clients")}
                      >
                        Ver Clientes
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigateToModule("/auth-myweb/clients/new")}
                      >
                        Añadir Cliente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                  <div className="h-2 bg-green-500" />
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4 text-green-500">
                      <Package className="h-6 w-6 mr-2" />
                      <h2 className="text-xl font-semibold">Gestión de Packs</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Administra los packs de servicios disponibles en la plataforma.
                    </p>
                    <div className="flex justify-between">
                      <Button 
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => setActiveTab("packs")}
                      >
                        Ver Packs
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigateToModule("/auth-myweb/packs/new")}
                      >
                        Añadir Pack
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                  <div className="h-2 bg-purple-500" />
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4 text-purple-500">
                      <List className="h-6 w-6 mr-2" />
                      <h2 className="text-xl font-semibold">Gestión de Servicios</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Administra los servicios individuales disponibles en la plataforma.
                    </p>
                    <div className="flex justify-between">
                      <Button 
                        className="bg-purple-500 hover:bg-purple-600 text-white"
                        onClick={() => setActiveTab("services")}
                      >
                        Ver Servicios
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigateToModule("/auth-myweb/services/new")}
                      >
                        Añadir Servicio
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Nueva tarjeta para Proyectos */}
                <Card className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                  <div className="h-2 bg-indigo-500" />
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4 text-indigo-500">
                      <CheckSquare className="h-6 w-6 mr-2" />
                      <h2 className="text-xl font-semibold">Gestión de Proyectos</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Administra y da seguimiento a los proyectos de tus clientes.
                    </p>
                    <div className="flex justify-between">
                      <Button 
                        className="bg-indigo-500 hover:bg-indigo-600 text-white"
                        onClick={() => setActiveTab("projects")}
                      >
                        Ver Proyectos
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigateToModule("/auth-myweb/projects")}
                      >
                        Gestionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                  <div className="h-2 bg-cyan-500" />
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4 text-cyan-500">
                      <MessageCircle className="h-6 w-6 mr-2" />
                      <h2 className="text-xl font-semibold">Chat con Clientes</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Comunícate en tiempo real con los clientes a través del chat interno.
                    </p>
                    <Button 
                      className="bg-cyan-500 hover:bg-cyan-600 text-white w-full"
                      onClick={() => navigateToModule("/auth-myweb/chat")}
                    >
                      Ir al Chat
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                  <div className="h-2 bg-amber-500" />
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4 text-amber-500">
                      <Mail className="h-6 w-6 mr-2" />
                      <h2 className="text-xl font-semibold">Mensajes de Contacto</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Gestiona los mensajes de contacto recibidos a través del formulario.
                    </p>
                    <Button 
                      className="bg-amber-500 hover:bg-amber-600 text-white w-full"
                      onClick={() => setActiveTab("messages")}
                    >
                      Ver Mensajes
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md md:col-span-2">
                  <div className="h-2 bg-slate-500" />
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4 text-slate-500">
                      <LayoutDashboard className="h-6 w-6 mr-2" />
                      <h2 className="text-xl font-semibold">Panel de Control</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Accede a estadísticas generales, configuraciones y herramientas administrativas.
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <Button 
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => setActiveTab("stats")}
                      >
                        <BarChart3 className="h-4 w-4" />
                        Estadísticas
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => setActiveTab("config")}
                      >
                        <Settings className="h-4 w-4" />
                        Configuración
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => setActiveTab("tools")}
                      >
                        <Wrench className="h-4 w-4" />
                        Herramientas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Tarjeta para Carritos */}
                <Card className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                  <div className="h-2 bg-orange-500" />
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4 text-orange-500">
                      <ShoppingCart className="h-6 w-6 mr-2" />
                      <h2 className="text-xl font-semibold">Gestión de Carritos</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Visualiza y gestiona los elementos en los carritos de los usuarios.
                    </p>
                    <Button 
                      className="bg-orange-500 hover:bg-orange-600 text-white w-full"
                      onClick={() => setActiveTab("carts")}
                    >
                      Ver Carritos
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="messages">
              <ContactMessages />
            </TabsContent>
            
            <TabsContent value="clients">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <ClientsManagement embedded={true} />
              </div>
            </TabsContent>
            
            <TabsContent value="packs">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <PacksManagement embedded={true} />
              </div>
            </TabsContent>
            
            <TabsContent value="services">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <ServicesManagement embedded={true} />
              </div>
            </TabsContent>

            {/* Nueva pestaña para Proyectos */}
            <TabsContent value="projects">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <ProjectsManagement embedded={true} />
              </div>
            </TabsContent>
            
            {/* Pestaña de Chat */}
            <TabsContent value="chat">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-[calc(100vh-300px)]">
                <AdminChat />
              </div>
            </TabsContent>

            {/* Pestaña de carts */}
            <TabsContent value="carts">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <CartItems embedded={true} />
              </div>
            </TabsContent>

            {/* Pestaña de Estadísticas */}
            <TabsContent value="stats">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <Dashboard />
              </div>
            </TabsContent>
            
            {/* Pestaña de Configuración */}
            <TabsContent value="config">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <ConfigPanel />
              </div>
            </TabsContent>
            
            {/* Pestaña de Herramientas implementada */}
            <TabsContent value="tools">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <AdminToolsPanel />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default AdminPanel;
