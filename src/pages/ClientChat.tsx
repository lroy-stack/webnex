
import React from "react";
import { Layout } from "@/components/layout/Layout";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import ClientChat from "@/components/client/chat/ClientChat";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useSearchParams } from "react-router-dom";

const ClientChatPage = () => {
  // Get project_id from URL params if present
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project_id');
  
  return (
    <ProtectedRoute allowedRoles={["client", "admin", "staff"]}>
      <Layout>
        <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden py-8 px-4 container mx-auto">
          <BreadcrumbNav />
          
          <div className="flex-1 min-h-0 mt-4 chat-grid-container">
            <ClientChat projectId={projectId} />
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ClientChatPage;
