import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { useAuth } from "@/contexts/AuthContext";
import { checkAndRefreshSession } from "@/integrations/supabase/client";

const OnboardingPage: React.FC = () => {
  const { user, hasCompletedOnboarding, checkOnboardingStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user exists and if they've completed onboarding or skipped it
    const checkStatus = async () => {
      if (!user) {
        // Verify if we have a valid session before redirecting
        const isValid = await checkAndRefreshSession();
        if (!isValid) {
          navigate("/auth");
          return;
        }
      }

      setIsLoading(true);
      
      // Check if user has already completed onboarding
      if (hasCompletedOnboarding) {
        navigate("/app");
        return;
      }

      // Check if user has explicitly skipped onboarding
      const onboardingSkipped = localStorage.getItem("onboardingSkipped") === "true";
      if (onboardingSkipped) {
        navigate("/app");
        return;
      }
      
      setIsLoading(false);
    };

    checkStatus();
  }, [user, hasCompletedOnboarding, navigate]);

  const handleOnboardingComplete = () => {
    // Refresh the onboarding status in auth context before redirecting
    checkOnboardingStatus();
    // Remove onboarding skipped flag
    localStorage.removeItem("onboardingSkipped");
    navigate("/app");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <p className="text-xl font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return null; // Navigate handled in useEffect
  }

  return (
    <div className="bg-gradient-to-b from-purple-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 min-h-screen">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="relative z-10">
        <OnboardingForm onComplete={handleOnboardingComplete} />
      </div>
    </div>
  );
};

export default OnboardingPage;