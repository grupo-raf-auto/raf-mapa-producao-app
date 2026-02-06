'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  User,
  Mail,
  Lock,
  LogOut,
  Trash2,
  Camera,
  X,
  Save,
  Loader2,
  Settings,
} from 'lucide-react';
import { authClient, useSession } from '@/lib/auth-client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
}

export function SettingsContent() {
  const router = useRouter();
  const sessionData = useSession();
  const user = sessionData.data?.user as UserProfile | undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      if (user.firstName) {
        setFirstName(user.firstName);
      } else if (user.name) {
        const parts = user.name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
      if (user.lastName) {
        setLastName(user.lastName);
      }
    }
  }, [user]);

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (firstName || lastName) {
      return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    }
    if (user?.name) {
      const parts = user.name.split(' ');
      return parts
        .slice(0, 2)
        .map((p) => p.charAt(0))
        .join('')
        .toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  // Handle profile picture upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter menos de 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecione uma imagem válida');
      return;
    }

    setIsLoading(true);
    try {
      // Convert to base64 for simplicity
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const result = await authClient.updateUser({ image: base64 });
          if (result.error) {
            throw new Error(result.error.message || 'Erro ao atualizar foto');
          }
          await sessionData.refetch();
          toast.success('Foto de perfil atualizada');
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Erro ao atualizar foto',
          );
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Erro ao atualizar foto de perfil');
      setIsLoading(false);
    }
  };

  // Handle remove profile picture
  const handleRemoveImage = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.updateUser({ image: '' });
      if (result.error) {
        throw new Error(result.error.message || 'Erro ao remover foto');
      }
      await sessionData.refetch();
      toast.success('Foto de perfil removida');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao remover foto',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle profile update
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const name = `${firstName} ${lastName}`.trim();
      const result = await authClient.updateUser({ name: name || undefined });
      if (result.error) {
        throw new Error(result.error.message || 'Erro ao atualizar perfil');
      }
      await sessionData.refetch();
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao atualizar perfil',
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('As palavras-passe não coincidem');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('A palavra-passe deve ter pelo menos 8 caracteres');
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        throw new Error(
          result.error.message ||
            'Erro ao alterar palavra-passe. Verifique a palavra-passe atual.',
        );
      }
      toast.success('Palavra-passe alterada com sucesso');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao alterar palavra-passe. Verifique a palavra-passe atual.',
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle logout from all devices
  const handleLogoutAllDevices = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.revokeOtherSessions();
      if (result.error) {
        throw new Error(result.error.message || 'Erro ao encerrar sessões');
      }
      toast.success('Sessões encerradas em todos os outros dispositivos');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao encerrar sessões',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'ELIMINAR') {
      toast.error('Por favor escreva ELIMINAR para confirmar');
      return;
    }

    setIsDeletingAccount(true);
    try {
      // Try to delete user account - if method doesn't exist, just sign out
      try {
        const result = await authClient.deleteUser();
        if (result.error) {
          throw new Error(result.error.message);
        }
        toast.success('Conta eliminada com sucesso');
      } catch {
        // If deleteUser doesn't exist, sign out and inform user
        await authClient.signOut();
        toast.success(
          'Sessão terminada. Contacte o suporte para eliminar a conta.',
        );
      }
      router.push('/sign-in');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao eliminar conta',
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Definições"
        description="Gerir as definições da sua conta e perfil"
        icon={Settings}
      />

      <div className="max-w-3xl mx-auto">
        {/* My Profile Section */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-red-700" />
            O Meu Perfil
          </h2>

          {/* Profile Picture */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.image || undefined} />
                <AvatarFallback className="bg-red-100 text-red-700 text-xl font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Alterar Imagem
                </Button>
                {user?.image && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG ou GIF. Máximo 2MB.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <Separator className="my-6" />

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">Primeiro Nome</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="João"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Último Nome</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Silva"
              />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Alterações
          </Button>
        </Card>

        {/* Account Security Section */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-700" />
            Segurança da Conta
          </h2>

          {/* Email */}
          <div className="flex items-center justify-between py-4 border-b">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Alterar email
            </Button>
          </div>

          {/* Password */}
          <div className="py-4">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Palavra-passe</p>
                <p className="text-sm text-muted-foreground">
                  Altere a sua palavra-passe para manter a conta segura
                </p>
              </div>
            </div>
            <div className="space-y-4 pl-8">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Palavra-passe Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Palavra-passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Palavra-passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !currentPassword || !newPassword}
              >
                {isChangingPassword ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Alterar Palavra-passe
              </Button>
            </div>
          </div>
        </Card>

        {/* Account Actions Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6 text-red-700">Zona de Perigo</h2>

          {/* Logout all devices */}
          <div className="flex items-center justify-between py-4 border-b">
            <div>
              <p className="font-medium">Terminar sessão em todos os dispositivos</p>
              <p className="text-sm text-muted-foreground">
                Encerra todas as sessões ativas exceto a atual
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Terminar Sessões
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Terminar todas as sessões?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá encerrar todas as sessões ativas em outros
                    dispositivos. Terá de iniciar sessão novamente nesses
                    dispositivos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogoutAllDevices}>
                    Terminar Sessões
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Delete account */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-red-600">Eliminar conta</p>
              <p className="text-sm text-muted-foreground">
                Elimina permanentemente a sua conta e todos os dados associados
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-4">
                      <p>
                        Esta ação não pode ser revertida. Irá eliminar
                        permanentemente a sua conta e remover todos os dados dos
                        nossos servidores.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="deleteConfirm">
                          Escreva{' '}
                          <span className="font-semibold">ELIMINAR</span> para
                          confirmar:
                        </Label>
                        <Input
                          id="deleteConfirm"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="ELIMINAR"
                        />
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={
                      isDeletingAccount || deleteConfirmation !== 'ELIMINAR'
                    }
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeletingAccount ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Eliminar Conta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      </div>
    </div>
  );
}
