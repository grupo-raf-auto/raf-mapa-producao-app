import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ModalProvider } from '@/lib/contexts/modal-context';
import { ModelContextProvider } from '@/lib/context/model-context';
import { useAuth } from '@/hooks/use-auth';
import { AuthProvider } from '@/contexts/auth-context';
import { MainLayout } from '@/components/layout/main-layout';
import TravelConnectSignIn from '@/components/ui/travel-connect-signin-1';
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper';
import { UsersManagement } from '@/components/admin/users-management';
import { AdminConsultasContent } from '@/components/admin/admin-consultas-content';
import { UserPerformance } from '@/components/admin/user-performance';
import { TemplatesManagement } from '@/components/admin/templates-management';
import { AdminDocumentsContent } from '@/components/admin/admin-documents-content';
import { AdminTicketsContent } from '@/components/admin/admin-tickets-content';
import { TemplatesContent } from '@/components/templates/templates-content';
import { FormulariosContent } from '@/components/formularios/formularios-content';
import { ConsultasContent } from '@/components/consultas/consultas-content';
import { DocumentScanner } from '@/components/document-scanner';
import { PageHeader } from '@/components/ui/page-header';
import { FileCheck } from 'lucide-react';
import { MySabichaoContent } from '@/components/mysabichao/mysabichao-content';
import { Spinner } from '@/components/ui/spinner';
import SelectModelsPage from '@/pages/SelectModels';
import { AdminLayout } from '@/components/admin/admin-layout';
import { VerifyEmail } from '@/components/auth/verify-email';
import { ApprovalStatus } from '@/components/auth/approval-status';
import { ForgotPassword } from '@/components/auth/forgot-password';
import { ResetPassword } from '@/components/auth/reset-password';
import { SettingsContent } from '@/components/settings/settings-content';
import { HelpContent } from '@/components/help/help-content';

import '@/index.css';
import '@/styles/scanner.css';

function ProtectedRoute({
  children,
  requireAdmin,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, isLoading, emailVerified, approvalStatus, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner variant="bars" className="h-8 w-8" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  // Check email verification
  if (!emailVerified && location.pathname !== '/verify-email') {
    return <Navigate to="/verify-email" replace />;
  }

  // Check approval status (skip for admins). Só redirecionar quando o status já foi carregado e não é aprovado
  if (
    !isAdmin &&
    approvalStatus != null &&
    approvalStatus !== 'approved' &&
    location.pathname !== '/approval-status' &&
    location.pathname !== '/verify-email'
  ) {
    return <Navigate to="/approval-status" replace />;
  }

  // Admin-only routes
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Redirect admins from user routes to admin dashboard
  if (
    isAdmin &&
    !location.pathname.startsWith('/admin') &&
    location.pathname !== '/approval-status' &&
    location.pathname !== '/verify-email' &&
    location.pathname !== '/settings' &&
    location.pathname !== '/help'
  ) {
    return <Navigate to="/admin" replace />;
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
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      </MainLayout>
    </ProtectedRoute>
  );
}

function AdminUsersRoute() {
  return <UsersManagement />;
}

function AdminConsultasRoute() {
  return <AdminConsultasContent />;
}

function AdminPerformanceRoute() {
  return <UserPerformance />;
}

function AdminTemplatesRoute() {
  return <TemplatesManagement />;
}

function AdminDocumentsRoute() {
  return <AdminDocumentsContent />;
}

function AdminTicketsRoute() {
  return <AdminTicketsContent />;
}

function TemplatesPage() {
  return (
    <ProtectedRoute requireAdmin>
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
        <div className="flex-1 flex flex-col min-h-0">
          <PageHeader
            title="MyScanner"
            description="Deteção de fraudes e alterações em documentos."
            icon={FileCheck}
          />
          <div className="flex-1 overflow-auto flex items-center justify-center min-h-[320px]">
            <div className="p-6 max-w-4xl w-full">
              <DocumentScanner />
            </div>
          </div>
        </div>
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

function SettingsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <SettingsContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function HelpPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <HelpContent variant="user" />
      </MainLayout>
    </ProtectedRoute>
  );
}

function AdminDefinicoesRoute() {
  return <SettingsContent />;
}

function AdminAjudaRoute() {
  return <HelpContent variant="admin" />;
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
        <AuthProvider>
          <ModelContextProvider>
            <ModalProvider>
              <Routes>
              {/* Public auth routes */}
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/approval-status" element={<ApprovalStatus />} />

              {/* User routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/select-models" element={<SelectModelsPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/formularios" element={<FormulariosPage />} />
              <Route path="/consultas" element={<ConsultasPage />} />
              <Route path="/scanner" element={<ScannerPage />} />
              <Route path="/mysabichao" element={<MysabichaoPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpPage />} />

              {/* Admin routes */}
              <Route path="/admin" element={<AdminPage />}>
                <Route index element={<Navigate to="users" replace />} />
                <Route path="users" element={<AdminUsersRoute />} />
                <Route path="users/:userId/models" element={<SelectModelsPage />} />
                <Route path="consultas" element={<AdminConsultasRoute />} />
                <Route path="performance" element={<AdminPerformanceRoute />} />
                <Route path="templates" element={<AdminTemplatesRoute />} />
                <Route path="documents" element={<AdminDocumentsRoute />} />
                <Route path="tickets" element={<AdminTicketsRoute />} />
                <Route path="definicoes" element={<AdminDefinicoesRoute />} />
                <Route path="ajuda" element={<AdminAjudaRoute />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster position="top-center" richColors />
            </ModalProvider>
          </ModelContextProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
