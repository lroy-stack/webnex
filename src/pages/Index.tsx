import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ProblemsWeSolve } from "@/components/home/ProblemsWeSolve";
import { PacksComparison } from "@/components/home/PacksComparison";
import { useAuth } from "@/contexts/AuthContext";
import { WelcomeModal } from "@/components/common/WelcomeModal";
import { RandomRegisterModal } from "@/components/common/RandomRegisterModal";
import { checkAndRefreshSession } from "@/integrations/supabase/client";
import { isProtectedAdminEmail, ensureAdminRole } from "@/utils/adminHelpers";

const Index = () => {
  const { user, userRole, isLoading, hasCompletedOnboarding } = useAuth();
  const navigate = useNavigate();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // First check for JWT validity to prevent auth errors
    const validateAndRedirect = async () => {
      console.time('total-redirect-flow');
      if (isLoading) {
        console.log("Still loading auth state, waiting...");
        return;
      }
      
      if (user) {
        console.time('validate-session');
        // Verify the JWT is valid before proceeding
        const isValid = await checkAndRefreshSession();
        console.timeEnd('validate-session');
        
        if (!isValid) {
          console.log("Invalid JWT detected, not redirecting");
          return;
        }
        
        console.log("Index page - User detected:", user.email);
        
        // Check if the user is an admin based on email first
        console.time('admin-check');
        if (user.email && isProtectedAdminEmail(user.email)) {
          console.log("Admin email detected, ensuring admin role and redirecting");
          const roleStartTime = performance.now();
          await ensureAdminRole();
          const roleEndTime = performance.now();
          console.log(`Admin role check took ${roleEndTime - roleStartTime}ms`);
          
          // Use a more efficient redirect with replace instead of push
          console.time('admin-navigation');
          navigate("/auth-myweb", { replace: true });
          console.timeEnd('admin-navigation');
          console.timeEnd('admin-check');
          console.timeEnd('total-redirect-flow');
          return;
        }
        console.timeEnd('admin-check');
        
        // Now check by role
        console.log("Index page - User role:", userRole);
        
        // Check if we should show the welcome modal (for new registrations)
        const shouldShowWelcomeModal = localStorage.getItem("showWelcomeModal") === "true";
        
        // If user hasn't completed onboarding and we should show the welcome modal
        if (!hasCompletedOnboarding) {
          // Check if user explicitly skipped onboarding
          const skippedOnboarding = localStorage.getItem("onboardingSkipped") === "true";
          
          if (skippedOnboarding) {
            console.log("User skipped onboarding, redirecting to app");
            navigate("/app", { replace: true });
            return;
          }
          
          if (shouldShowWelcomeModal) {
            console.log("Showing welcome modal to new user");
            setShowWelcomeModal(true);
          } else {
            console.log("Redirecting user to onboarding");
            navigate("/onboarding", { replace: true });
          }
          return;
        }
        
        // Normal redirects based on role for onboarded users
        if (userRole === "admin") {
          console.log("Redirecting admin to admin panel");
          navigate("/auth-myweb", { replace: true });
        } else if (userRole === "client" || userRole === "staff") {
          console.log("Redirecting client/staff to client dashboard");
          navigate("/app", { replace: true });
        }
      }
      console.timeEnd('total-redirect-flow');
    };
    
    validateAndRedirect();
  }, [user, userRole, isLoading, hasCompletedOnboarding, navigate]);

  const handleCloseWelcomeModal = () => {
    localStorage.setItem("showWelcomeModal", "false");
    setShowWelcomeModal(false);
  };

  return (
    <Layout>
      <div className="w-full">
        <Hero />
        <HowItWorks />
        <ProblemsWeSolve />
        <PacksComparison />

        {/* Welcome modal for new registered users */}
        <WelcomeModal 
          open={showWelcomeModal} 
          onClose={handleCloseWelcomeModal} 
        />
        
        {/* Random registration modal */}
        <RandomRegisterModal />
      </div>
    </Layout>
  );
};

export default Index;