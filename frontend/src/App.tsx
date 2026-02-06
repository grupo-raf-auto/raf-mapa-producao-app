import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ModalProvider } from '@/lib/contexts/modal-context';
import { ModelContextProvider } from '@/lib/context/model-context';
import { useSession } from '@/lib/auth-client';
import { MainLayout } from '@/components/layout/main-layout';
import TravelConnectSignIn from '@/components/ui/travel-connect-signin-1';
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
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
              <Route path="/admin" element={<AdminPage />} />
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
              <Route
                path="/admin/users/:userId/models"
                element={<AdminPage />}
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
