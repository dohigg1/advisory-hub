import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
  </QueryClientProvider>
);

export default App;
