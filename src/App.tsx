
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Configurator from "./pages/Configurator";
import ConfiguratorV2 from "./pages/ConfiguratorV2";
import Materials from "./pages/Materials";
import Admin from "./pages/Admin";
import EstimateManagement from "./pages/EstimateManagement";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Members from "./pages/Members";
import AcceptInvite from "./pages/AcceptInvite";
import MaterialsImport from "./pages/MaterialsImport";
import Suppliers from "./pages/Suppliers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
        <BrowserRouter>
          <TooltipProvider>
            <div className="min-h-screen">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/projects" element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:id" element={
                  <ProtectedRoute>
                    <ProjectDetail />
                  </ProtectedRoute>
                } />
                <Route path="/estimates/:estimateId/manage" element={
                  <ProtectedRoute>
                    <EstimateManagement />
                  </ProtectedRoute>
                } />
                <Route path="/configurator" element={
                  <ProtectedRoute>
                    <Configurator />
                  </ProtectedRoute>
                } />
                <Route path="/configurator-v2" element={
                  <ProtectedRoute>
                    <ConfiguratorV2 />
                  </ProtectedRoute>
                } />
                <Route path="/materials" element={
                  <ProtectedRoute>
                    <Materials />
                  </ProtectedRoute>
                } />
                <Route path="/materials/import" element={
                  <ProtectedRoute>
                    <MaterialsImport />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/settings/members" element={
                  <ProtectedRoute>
                    <Members />
                  </ProtectedRoute>
                } />
                <Route path="/settings/suppliers" element={
                  <ProtectedRoute>
                    <Suppliers />
                  </ProtectedRoute>
                } />
                <Route path="/invite/:token" element={<AcceptInvite />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Toaster />
          </TooltipProvider>
        </BrowserRouter>
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
