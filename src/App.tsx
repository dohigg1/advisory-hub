import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SentryErrorBoundary } from "@/components/SentryErrorBoundary";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Assessments from "./pages/Assessments";
import Leads from "./pages/Leads";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import AssessmentBuilder from "./pages/AssessmentBuilder";
import AIGenerateAssessment from "./pages/AIGenerateAssessment";
import NotFound from "./pages/NotFound";
import PublicLandingPage from "./pages/PublicLandingPage";
import PublicAssessment from "./pages/PublicAssessment";
import PublicResults from "./pages/PublicResults";
import Portal from "./pages/Portal";
import Referrals from "./pages/Referrals";
import TemplateMarketplace from "./pages/TemplateMarketplace";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrganisations from "./pages/admin/AdminOrganisations";
import AdminFeatureFlags from "./pages/admin/AdminFeatureFlags";
import AdminLegalContent from "./pages/admin/AdminLegalContent";
import AdminAuditLog from "./pages/admin/AdminAuditLog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SentryErrorBoundary>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/a/:slug" element={<PublicLandingPage />} />
              <Route path="/a/:slug/start" element={<PublicAssessment />} />
              <Route path="/results/:leadId" element={<PublicResults />} />
              <Route path="/portal/:orgSlug" element={<Portal />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/templates" element={<TemplateMarketplace />} />
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="organisations" element={<AdminOrganisations />} />
                <Route path="feature-flags" element={<AdminFeatureFlags />} />
                <Route path="legal" element={<AdminLegalContent />} />
                <Route path="audit-log" element={<AdminAuditLog />} />
              </Route>
              <Route path="/assessments/generate" element={<ProtectedRoute><AIGenerateAssessment /></ProtectedRoute>} />
              <Route path="/assessments/:id" element={<ProtectedRoute><AssessmentBuilder /></ProtectedRoute>} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/assessments" element={<Assessments />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/referrals" element={<Referrals />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
    </SentryErrorBoundary>
  </QueryClientProvider>
);

export default App;
