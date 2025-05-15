
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bell, Calendar } from "lucide-react";

interface TabControlledProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  unreadCount: number;
  updateContent: React.ReactNode;
  milestoneContent: React.ReactNode;
}

export const TabControlled: React.FC<TabControlledProps> = ({
  activeTab,
  onTabChange,
  unreadCount,
  updateContent,
  milestoneContent
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="updates" className="flex gap-2 items-center justify-center">
            <Bell className="h-4 w-4" />
            Actualizaciones
            {unreadCount > 0 && (
              <span className="bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex gap-2 items-center justify-center">
            <Calendar className="h-4 w-4" />
            Cronograma
          </TabsTrigger>
        </TabsList>
      </div>
      
      <div className="flex-grow overflow-auto">
        <TabsContent value="updates" className="mt-0 space-y-4 h-[50vh] overflow-y-auto p-4">
          {updateContent}
        </TabsContent>
        
        <TabsContent value="milestones" className="mt-0 space-y-4 h-[50vh] overflow-y-auto p-4">
          {milestoneContent}
        </TabsContent>
      </div>
    </Tabs>
  );
};
