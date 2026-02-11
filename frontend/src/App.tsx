import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ModalProvider } from '@/contexts/modal-context';
import { ModelContextProvider } from '@/contexts/model-context';
import { AuthProvider } from '@/contexts/auth-context';

// Pages
import HomePage from '@/pages/Home';
import SelectModelsPage from '@/pages/SelectModels';
import OnboardingPage from '@/pages/Onboarding';
import AdminPage from '@/pages/Admin';
import TemplatesPage from '@/pages/Templates';
import FormulariosPage from '@/pages/Formularios';
import ConsultasPage from '@/pages/Consultas';
import ScannerPage from '@/pages/Scanner';
import GeradorMensagensPage from '@/pages/GeradorMensagens';
import MysabichaoPage from '@/pages/Mysabichao';
import SettingsPage from '@/pages/Settings';
import HelpPage from '@/pages/Help';
import EquipasPage from '@/pages/Equipas';
import SignInPage from '@/pages/SignIn';
import AdminUsersPage from '@/pages/admin/Users';
import AdminConsultasPage from '@/pages/admin/Consultas';
import AdminPerformancePage from '@/pages/admin/Performance';
import AdminTemplatesPage from '@/pages/admin/AdminTemplates';
import AdminDocumentsPage from '@/pages/admin/Documents';
import AdminTicketsPage from '@/pages/admin/Tickets';
import AdminDefinicoesPage from '@/pages/admin/Definicoes';
import AdminAjudaPage from '@/pages/admin/Ajuda';
import AdminEquipasPage from '@/pages/admin/Equipas';

// Auth flows (full-page components)
import { VerifyEmail } from '@/components/auth/verify-email';
import { ApprovalStatus } from '@/components/auth/approval-status';
import { ForgotPassword } from '@/components/auth/forgot-password';
import { ResetPassword } from '@/components/auth/reset-password';

import '@/index.css';
import '@/styles/scanner.css';

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
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/select-models" element={<SelectModelsPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/formularios" element={<FormulariosPage />} />
                <Route path="/consultas" element={<ConsultasPage />} />
                <Route path="/scanner" element={<ScannerPage />} />
                <Route path="/gerador-mensagens" element={<GeradorMensagensPage />} />
                <Route path="/mysabichao" element={<MysabichaoPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/equipas" element={<EquipasPage />} />

                {/* Admin routes */}
                <Route path="/admin" element={<AdminPage />}>
                  <Route index element={<Navigate to="users" replace />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="users/:userId/models" element={<SelectModelsPage />} />
                  <Route path="consultas" element={<AdminConsultasPage />} />
                  <Route path="performance" element={<AdminPerformancePage />} />
                  <Route path="equipas" element={<AdminEquipasPage />} />
                  <Route path="templates" element={<AdminTemplatesPage />} />
                  <Route path="documents" element={<AdminDocumentsPage />} />
                  <Route path="tickets" element={<AdminTicketsPage />} />
                  <Route path="definicoes" element={<AdminDefinicoesPage />} />
                  <Route path="ajuda" element={<AdminAjudaPage />} />
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
