import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { User, Receipt, Lock, CreditCard } from "lucide-react";
import { PersonalInfoTab } from "@/components/profile/PersonalInfoTab";
import { TaxInfoTab } from "@/components/profile/TaxInfoTab";
import { PrivacyTab } from "@/components/profile/PrivacyTab";
import { SubscriptionTab } from "@/components/profile/SubscriptionTab";
import { 
  fetchClientProfile, 
  fetchClientTaxInfo,
  fetchClientPrivacySettings,
  fetchClientSubscription,
  ClientProfile,
  ClientTaxInfo,
  ClientPrivacySettings,
  ClientSubscription,
} from "@/services/clientDashboardService";

export const UserProfileModal: React.FC = () => {
  const { user } = useAuth();
  const { isProfileModalOpen, closeProfileModal } = useAuthStore();
  
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [taxInfo, setTaxInfo] = useState<ClientTaxInfo | null>(null);
  const [privacySettings, setPrivacySettings] = useState<ClientPrivacySettings | null>(null);
  const [subscription, setSubscription] = useState<ClientSubscription | null>(null);
  
  const [isLoading, setIsLoading] = useState({
    profile: true,
    taxInfo: true,
    privacySettings: true,
    subscription: true,
  });
  
  const loadProfileData = async () => {
    if (!user) return;
    
    setIsLoading(prev => ({ ...prev, profile: true }));
    const profileData = await fetchClientProfile();
    setProfile(profileData);
    setIsLoading(prev => ({ ...prev, profile: false }));
  };
  
  const loadTaxInfo = async () => {
    if (!user) return;
    
    setIsLoading(prev => ({ ...prev, taxInfo: true }));
    const taxData = await fetchClientTaxInfo();
    setTaxInfo(taxData);
    setIsLoading(prev => ({ ...prev, taxInfo: false }));
  };
  
  const loadPrivacySettings = async () => {
    if (!user) return;
    
    setIsLoading(prev => ({ ...prev, privacySettings: true }));
    const settingsData = await fetchClientPrivacySettings();
    setPrivacySettings(settingsData);
    setIsLoading(prev => ({ ...prev, privacySettings: false }));
  };
  
  const loadSubscription = async () => {
    if (!user) return;
    
    setIsLoading(prev => ({ ...prev, subscription: true }));
    const subscriptionData = await fetchClientSubscription();
    setSubscription(subscriptionData);
    setIsLoading(prev => ({ ...prev, subscription: false }));
  };
  
  useEffect(() => {
    if (isProfileModalOpen && user) {
      loadProfileData();
      loadTaxInfo();
      loadPrivacySettings();
      loadSubscription();
    }
  }, [isProfileModalOpen, user]);
  
  return (
    <Sheet open={isProfileModalOpen} onOpenChange={closeProfileModal}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-2xl font-bold">Mi perfil</SheetTitle>
          <SheetDescription>
            Gestiona tu información personal y preferencias
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-6">
            <TabsTrigger value="personal" className="flex flex-col items-center py-2 px-1">
              <User className="h-4 w-4 mb-1" />
              <span className="text-xs hidden sm:inline">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="fiscal" className="flex flex-col items-center py-2 px-1">
              <Receipt className="h-4 w-4 mb-1" />
              <span className="text-xs hidden sm:inline">Fiscal</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex flex-col items-center py-2 px-1">
              <Lock className="h-4 w-4 mb-1" />
              <span className="text-xs hidden sm:inline">Privacidad</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex flex-col items-center py-2 px-1">
              <CreditCard className="h-4 w-4 mb-1" />
              <span className="text-xs hidden sm:inline">Suscripción</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal">
            <PersonalInfoTab 
              profile={profile}
              isLoading={isLoading.profile}
              onProfileUpdated={loadProfileData}
            />
          </TabsContent>
          
          <TabsContent value="fiscal">
            <TaxInfoTab 
              taxInfo={taxInfo}
              isLoading={isLoading.taxInfo}
              onTaxInfoUpdated={loadTaxInfo}
            />
          </TabsContent>
          
          <TabsContent value="privacy">
            <PrivacyTab 
              privacySettings={privacySettings}
              isLoading={isLoading.privacySettings}
              onPrivacyUpdated={loadPrivacySettings}
            />
          </TabsContent>
          
          <TabsContent value="subscription">
            <SubscriptionTab 
              subscription={subscription}
              isLoading={isLoading.subscription}
              onSubscriptionUpdated={loadSubscription}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};