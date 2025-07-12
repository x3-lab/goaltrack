
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppStateProvider } from "./contexts/AppStateContext";
import { createQueryClient } from "./services/api";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Login from "./pages/Login";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Volunteers from "./pages/Volunteers";
import Goals from "./pages/Goals";
import AdminSettings from "./pages/AdminSettings";
import ProgressHistoryPage from "./pages/ProgressHistory";
import PersonalAnalyticsPage from "./pages/PersonalAnalytics";
import VolunteerProfilePage from "./pages/VolunteerProfile";
import SystemAnalyticsPage from "./pages/SystemAnalytics";
import { useAuth } from "./contexts/AuthContext";

const queryClient = createQueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Navigation />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/volunteer-dashboard"
        element={
          <ProtectedRoute requiredRole="volunteer">
            <VolunteerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteer-dashboard/progress-history"
        element={
          <ProtectedRoute requiredRole="volunteer">
            <ProgressHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteer-dashboard/analytics"
        element={
          <ProtectedRoute requiredRole="volunteer">
            <PersonalAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard/volunteers"
        element={
          <ProtectedRoute requiredRole="admin">
            <Volunteers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard/volunteers/:id"
        element={
          <ProtectedRoute requiredRole="admin">
            <VolunteerProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard/goals"
        element={
          <ProtectedRoute requiredRole="admin">
            <Goals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard/analytics"
        element={
          <ProtectedRoute requiredRole="admin">
            <SystemAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard/settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminSettings />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppStateProvider>
            <AppLayout>
              <AppRoutes />
            </AppLayout>
          </AppStateProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;