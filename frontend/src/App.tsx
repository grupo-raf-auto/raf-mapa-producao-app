import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ModalProvider } from '@/lib/contexts/modal-context';
import { ModelContextProvider } from '@/lib/context/model-context';
import { useSession } from '@/lib/auth-client';
import { MainLayout } from '@/components/layout/main-layout';
import TravelConnectSignIn from '@/components/ui/travel-connect-signin-1';
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper';
import { AdminDashboard, useAdminRefresh } from '@/components/admin/admin-dashboard';
import { UsersManagement } from '@/components/admin/users-management';
import { AdminConsultasContent } from '@/components/admin/admin-consultas-content';
import { UserPerformance } from '@/components/admin/user-performance';
import { TemplatesManagement } from '@/components/admin/templates-management';
import { DocumentsManager } from '@/components/mysabichao/documents-manager';
import { Ticket } from 'lucide-react';
import { TemplatesContent } from '@/components/templates/templates-content';
import { FormulariosContent } from '@/components/formularios/formularios-content';
import { ConsultasContent } from '@/components/consultas/consultas-content';
import { DocumentScanner } from '@/components/document-scanner';
import { MySabichaoContent } from '@/components/mysabichao/mysabichao-content';
import { SupportChatFab } from '@/components/support/support-chat-fab';
import { Spinner } from '@/components/ui/spinner';
import SelectModelsPage from '@/pages/SelectModels';

import '@/index.css';
import '@/styles/scanner.css';

function ProtectedRoute({
  children,
  requireAdmin,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!session?.user) {
    return <Navigate to="/sign-in" replace />;
  }
  if (requireAdmin && (session.user as { role?: string }).role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function HomePage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <DashboardWrapper />
      </MainLayout>
    </ProtectedRoute>
  );
}

function AdminPage() {
  return (
    <ProtectedRoute requireAdmin>
      <MainLayout>
        <AdminDashboard />
      </MainLayout>
    </ProtectedRoute>
  );
}

function TicketsPlaceholder() {
  return (
    <div className="bg-card rounded-2xl p-8 shadow-sm border text-center">
      <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Tickets</h3>
      <p className="text-muted-foreground">
        Sistema de tickets em desenvolvimento.
      </p>
    </div>
  );
}

function AdminUsersRoute() {
  const { refreshKey } = useAdminRefresh();
  return <UsersManagement key={`users-${refreshKey}`} />;
}

function AdminConsultasRoute() {
  const { refreshKey } = useAdminRefresh();
  return <AdminConsultasContent key={`consultas-${refreshKey}`} />;
}

function AdminPerformanceRoute() {
  const { refreshKey } = useAdminRefresh();
  return <UserPerformance key={`performance-${refreshKey}`} />;
}

function AdminTemplatesRoute() {
  const { refreshKey } = useAdminRefresh();
  return <TemplatesManagement key={`templates-${refreshKey}`} />;
}

function AdminDocumentsRoute() {
  const { refreshKey } = useAdminRefresh();
  return <DocumentsManager key={`docs-${refreshKey}`} />;
}

function AdminTicketsRoute() {
  const { refreshKey } = useAdminRefresh();
  return <TicketsPlaceholder key={`tickets-${refreshKey}`} />;
}

function TemplatesPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <TemplatesContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function FormulariosPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <FormulariosContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function ConsultasPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <ConsultasContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function ScannerPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <DocumentScanner />
      </MainLayout>
    </ProtectedRoute>
  );
}

function MysabichaoPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <MySabichaoContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function SignInPage() {
  return <TravelConnectSignIn />;
}

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <BrowserRouter>
        <ModelContextProvider>
          <ModalProvider>
            <Routes>
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/admin" element={<AdminPage />}>
                <Route index element={<Navigate to="users" replace />} />
                <Route path="users" element={<AdminUsersRoute />} />
                <Route path="users/:userId/models" element={<SelectModelsPage />} />
                <Route path="consultas" element={<AdminConsultasRoute />} />
                <Route path="performance" element={<AdminPerformanceRoute />} />
                <Route path="templates" element={<AdminTemplatesRoute />} />
                <Route path="documents" element={<AdminDocumentsRoute />} />
                <Route path="tickets" element={<AdminTicketsRoute />} />
              </Route>
              <Route path="/select-models" element={<SelectModelsPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/formularios" element={<FormulariosPage />} />
              <Route path="/consultas" element={<ConsultasPage />} />
              <Route path="/scanner" element={<ScannerPage />} />
              <Route path="/mysabichao" element={<MysabichaoPage />} />
              <Route
                path="/forgot-password"
                element={<div>Forgot password (TODO: wrap component)</div>}
              />
              <Route
                path="/reset-password"
                element={<div>Reset password (TODO: wrap component)</div>}
              />
              <Route
                path="/verify-email"
                element={<div>Verify email (TODO: wrap component)</div>}
              />
              <Route
                path="/approval-status"
                element={<div>Approval status (TODO: wrap component)</div>}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <SupportChatFab />
            <Toaster position="top-center" richColors />
          </ModalProvider>
        </ModelContextProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
