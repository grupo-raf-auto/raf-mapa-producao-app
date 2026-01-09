'use client';

import { Shield, LogOut, Bug, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useUserRole } from '@/lib/hooks/use-user-role';
import { useModal } from '@/lib/contexts/modal-context';

export function AdminButton() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { userRole, loading } = useUserRole();
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [submittingBug, setSubmittingBug] = useState(false);
  
  const { isModalOpen } = useModal();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleSubmitBug = async () => {
    if (!bugDescription.trim()) {
      toast.error('Por favor, descreva o bug');
      return;
    }

    setSubmittingBug(true);
    try {
      // Aqui você pode implementar o envio do bug report
      // Por enquanto, apenas mostra uma mensagem de sucesso
      const userEmail =
        user?.emailAddresses?.[0]?.emailAddress || 'Usuário desconhecido';
      const bugData = {
        description: bugDescription,
        userEmail,
        userRole: userRole || 'user',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Log do bug (você pode enviar para um endpoint depois)
      console.log('Bug Report:', bugData);

      toast.success('Bug reportado com sucesso! Obrigado pelo feedback.');
      setBugDescription('');
      setBugReportOpen(false);
    } catch (error) {
      console.error('Erro ao reportar bug:', error);
      toast.error('Erro ao reportar bug. Tente novamente.');
    } finally {
      setSubmittingBug(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Evitar flash de conteúdo não estilizado
  useEffect(() => {
    setMounted(true);
  }, []);


  // Não mostrar nada se ainda estiver carregando ou não houver usuário
  if (loading || !user) {
    return null;
  }

  // Lista de emails admin (mesma do servidor)
  const adminEmails = ['tiagosousa.tams@hotmail.com'];
  const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  const isAdminEmail = userEmail && adminEmails.includes(userEmail);

  // Mostrar botão se role for admin OU se o email estiver na lista de admins
  const showAdminButton = userRole === 'admin' || isAdminEmail;

  console.log('AdminButton visibility check:', {
    userRole,
    userEmail,
    isAdminEmail,
    showAdminButton,
  });

  // Esconder botões quando um modal estiver aberto
  if (isModalOpen) {
    return null;
  }

  return (
    <div className="fixed top-8 right-12 md:right-16 lg:right-20 z-[100] flex items-center gap-2">
      {showAdminButton && (
        <Button
          onClick={() => router.push('/admin')}
          variant="default"
          size="sm"
          className="gap-2 shadow-lg cursor-pointer"
        >
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">Administração</span>
        </Button>
      )}

      <Button
        onClick={toggleTheme}
        variant="outline"
        size="sm"
        className="gap-2 shadow-lg cursor-pointer"
        title={mounted && theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
      >
        {mounted && theme === 'dark' ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </Button>

      <Dialog open={bugReportOpen} onOpenChange={setBugReportOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shadow-lg cursor-pointer"
            title="Reportar Bug"
          >
            <Bug className="w-4 h-4" />
            <span className="hidden sm:inline">Reportar Bug</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reportar Bug</DialogTitle>
            <DialogDescription>
              Descreva o problema que encontrou. Sua ajuda é importante para
              melhorar o sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bug-description">Descrição do Bug</Label>
              <Textarea
                id="bug-description"
                placeholder="Descreva o que aconteceu, quando ocorreu e quais passos levaram ao problema..."
                value={bugDescription}
                onChange={(e) => setBugDescription(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBugReportOpen(false);
                  setBugDescription('');
                }}
                disabled={submittingBug}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitBug}
                disabled={submittingBug || !bugDescription.trim()}
              >
                {submittingBug ? 'Enviando...' : 'Enviar Reporte'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        onClick={handleSignOut}
        variant="outline"
        size="sm"
        className="gap-2 shadow-lg cursor-pointer"
        title="Sair"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Sair</span>
      </Button>
    </div>
  );
}
