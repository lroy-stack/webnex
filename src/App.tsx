import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Packs from "./pages/Packs";
import Servicios from "./pages/Servicios";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Contacto from "./pages/Contacto";
import ClientDashboard from "./pages/ClientDashboard";
import ClientChat from "./pages/ClientChat";
import Index from "./pages/Index";
import AdminPanel from "./pages/AdminPanel";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "sonner";
import { CookieConsentProvider } from "./contexts/CookieConsentContext";
import { CookieConsentModal } from "./components/common/CookieConsentModal";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ServicesManagement from "./pages/admin/ServicesManagement";
import PacksManagement from "./pages/admin/PacksManagement";
import ClientsManagement from "./pages/admin/ClientsManagement";
import NewClientOnboarding from "./pages/admin/NewClientOnboarding"; // Import the new component
import ServiceDetail from "./pages/admin/ServiceDetail";
import ServiceForm from "./pages/admin/ServiceForm";
import PackDetail from "./pages/admin/PackDetail";
import PackForm from "./pages/admin/PackForm";
import ClientDetail from "./pages/admin/ClientDetail";
import ClientForm from "./pages/admin/ClientForm";
import ChatManagement from "./pages/admin/ChatManagement";
import Cart from "./pages/Cart";
import OrderConfirmation from "./pages/OrderConfirmation";
import ProjectDetails from "./pages/ProjectDetails";
import CartItems from "./pages/admin/CartItems";
import ProjectsManagement from "./pages/admin/ProjectsManagement";
import ProjectDetail from "./pages/admin/ProjectDetail";
import { UserProfileModal } from "./components/auth/UserProfileModal";
import OnboardingPage from "./pages/OnboardingPage";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CookieConsentProvider>
          <AuthProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/packs" element={<Packs />} />
                <Route path="/servicios" element={<Servicios />} />
                <Route path="/privacidad" element={<PrivacyPolicy />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terminos" element={<TermsOfService />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/contacto" element={<Contacto />} />
                <Route path="/app" element={<ClientDashboard />} />
                <Route path="/app/chat" element={<ClientChat />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                <Route path="/project/:projectId" element={<ProjectDetails />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                
                {/* Rutas del panel de administración */}
                <Route path="/auth-myweb" element={<AdminPanel />} />
                <Route path="/auth-myweb/services" element={<ServicesManagement />} />
                <Route path="/auth-myweb/services/new" element={<ServiceForm />} />
                <Route path="/auth-myweb/services/:id" element={<ServiceDetail />} />
                <Route path="/auth-myweb/services/:id/edit" element={<ServiceForm />} />
                <Route path="/auth-myweb/packs" element={<PacksManagement />} />
                <Route path="/auth-myweb/packs/new" element={<PackForm />} />
                <Route path="/auth-myweb/packs/:id" element={<PackDetail />} />
                <Route path="/auth-myweb/packs/:id/edit" element={<PackForm />} />
                <Route path="/auth-myweb/clients" element={<ClientsManagement />} />
                <Route path="/auth-myweb/clients/new" element={<ClientForm />} />
                <Route path="/auth-myweb/clients/new-onboarding" element={<NewClientOnboarding />} />
                <Route path="/auth-myweb/clients/:id" element={<ClientDetail />} />
                <Route path="/auth-myweb/clients/:id/edit" element={<ClientForm />} />
                <Route path="/auth-myweb/chat" element={<ChatManagement />} />
                <Route path="/auth-myweb/carts" element={<CartItems />} />
                <Route path="/auth-myweb/projects" element={<ProjectsManagement />} />
                <Route path="/auth-myweb/projects/:id" element={<ProjectDetail />} />
                
                {/* Ruta para páginas no encontradas */}
                <Route path="*" element={<NotFound />} />
              </Routes>

              <Toaster position="top-right" richColors closeButton />
              <CookieConsentModal />
              <UserProfileModal />
            </Router>
          </AuthProvider>
        </CookieConsentProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;