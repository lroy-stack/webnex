import React, { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataExport } from "./DataExport";
import { FileManager } from "./FileManager";
import { MassCommunication } from "./MassCommunication";
import { SystemLogs } from "./SystemLogs";
import { MaintenanceTools } from "./MaintenanceTools";
import { UserManagement } from "./UserManagement";
import { 
  FileText, 
  FolderArchive, 
  MessageSquare, 
  FileText as FileDocument, 
  Wrench,
  UserX
} from "lucide-react";

export const AdminToolsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("export");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Herramientas Administrativas</h1>
      </div>
      
      <Tabs defaultValue="export" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 grid grid-cols-2 md:grid-cols-6 gap-2">
          <TabsTrigger value="export" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Exportación</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FolderArchive className="h-4 w-4" />
            <span className="hidden sm:inline">Archivos</span>
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Comunicación</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileDocument className="h-4 w-4" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Mantenimiento</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="export" className="space-y-4 mt-0">
          <DataExport />
        </TabsContent>
        
        <TabsContent value="files" className="space-y-4 mt-0">
          <FileManager />
        </TabsContent>
        
        <TabsContent value="communication" className="space-y-4 mt-0">
          <MassCommunication />
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4 mt-0">
          <SystemLogs />
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-4 mt-0">
          <MaintenanceTools />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4 mt-0">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};