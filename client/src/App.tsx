import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import NotificationsPage from "@/pages/notifications-page";
import SettingsPage from "@/pages/settings-page";
import UserProfilePage from "@/pages/user-profile-page";
import TasksPage from "@/pages/tasks-page";
import EscalationManagementPage from "@/pages/escalation-management-page";
import NotificationTemplatesPage from "@/pages/notification-templates-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/profile" component={UserProfilePage} />
      <ProtectedRoute path="/tasks" component={TasksPage} />
      <ProtectedRoute path="/escalation-management" component={EscalationManagementPage} />
      <ProtectedRoute path="/notification-templates" component={NotificationTemplatesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
