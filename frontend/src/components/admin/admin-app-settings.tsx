'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
  Palette,
  Image as ImageIcon,
  LayoutGrid,
  RotateCcw,
  Save,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, invalidateCache } from '@/services/api';
import { useAppSettings } from '@/contexts/app-settings-context';

interface AppSettings {
  id: string;
  sidebarLogo: string | null;
  sidebarText: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  sidebarColor: string | null;
  theme: string;
  customButtonEnabled: boolean;
  customButtonLabel: string;
  customButtonColor: string;
  customButtonUrl: string;
  version: number;
  updatedBy: string | null;
  updatedAt: string;
  createdAt: string;
}

const DEFAULT_COLORS = {
  primary: '#dc2626', // red-600
  secondary: '#991b1b', // red-800
  accent: '#fca5a5', // red-300
};

// Loading bars component
function LoadingBars({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <style>
        {`
          .bar { animation: pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
          .bar:nth-child(2) { animation-delay: 0.15s; }
          .bar:nth-child(3) { animation-delay: 0.3s; }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scaleY(0.6); }
            50% { opacity: 1; transform: scaleY(1); }
          }
        `}
      </style>
      <rect className="bar" x="4" y="6" width="4" height="12" rx="1" />
      <rect className="bar" x="10" y="6" width="4" height="12" rx="1" />
      <rect className="bar" x="16" y="6" width="4" height="12" rx="1" />
    </svg>
  );
}

export function AdminAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { refreshSettings } = useAppSettings();

  // Form states
  const [sidebarLogo, setSidebarLogo] = useState<string | null>(null);
  const [sidebarText, setSidebarText] = useState<string>('Grupo RAF');
  const [primaryColor, setPrimaryColor] = useState<string>('');
  const [secondaryColor, setSecondaryColor] = useState<string>('');
  const [accentColor, setAccentColor] = useState<string>('');
  const [sidebarColor, setSidebarColor] = useState<string>('');
  const [customButtonEnabled, setCustomButtonEnabled] = useState(true);
  const [customButtonLabel, setCustomButtonLabel] = useState('CRM MyCredit');
  const [customButtonColor, setCustomButtonColor] = useState('#22c55e');
  const [customButtonUrl, setCustomButtonUrl] = useState('https://mycredit.pt');

  // Carregar configurações
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = (await apiClient.appSettings.get()) as AppSettings;

      if (!data) {
        throw new Error('Nenhuma configuração encontrada');
      }

      setSettings(data);

      // Preencher formulário
      setSidebarLogo(data.sidebarLogo || null);
      setSidebarText(data.sidebarText || 'Grupo RAF');
      setPrimaryColor(data.primaryColor || '');
      setSecondaryColor(data.secondaryColor || '');
      setAccentColor(data.accentColor || '');
      setSidebarColor(data.sidebarColor || '');
      setCustomButtonEnabled(data.customButtonEnabled ?? true);
      setCustomButtonLabel(data.customButtonLabel || 'CRM MyCredit');
      setCustomButtonColor(data.customButtonColor || '#22c55e');
      setCustomButtonUrl(data.customButtonUrl || 'https://mycredit.pt');

      return data;
    } catch (error) {
      toast.error('Erro ao carregar configurações');
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Upload de logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter menos de 2MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecione uma imagem válida');
      return;
    }

    try {
      // Converter para base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setSidebarLogo(reader.result as string);
        toast.success('Logo carregada. Clique em "Guardar" para aplicar');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Erro ao carregar imagem');
      console.error(error);
    }
  };

  // Remover logo
  const handleRemoveLogo = () => {
    setSidebarLogo(null);
    toast.success('Logo removida. Clique em "Guardar" para aplicar');
  };

  // Restaurar valores padrão no formulário
  const handleSetDefaults = () => {
    setPrimaryColor(DEFAULT_COLORS.primary);
    setSecondaryColor(DEFAULT_COLORS.secondary);
    setAccentColor(DEFAULT_COLORS.accent);
    toast.success('Cores predefinidas carregadas. Clique em "Guardar" para aplicar');
  };

  // Guardar configurações
  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validar URL
      if (customButtonUrl) {
        try {
          new URL(customButtonUrl);
        } catch {
          toast.error('URL do botão inválida');
          return;
        }
      }

      const updateData = {
        sidebarLogo,
        sidebarText,
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null,
        accentColor: accentColor || null,
        sidebarColor: sidebarColor || null,
        customButtonEnabled,
        customButtonLabel,
        customButtonColor,
        customButtonUrl,
      };

      await apiClient.appSettings.update(updateData);

      // Invalidar cache e atualizar contexto
      invalidateCache('app-settings');
      await refreshSettings();
      await loadSettings();

      toast.success('Configurações aplicadas com sucesso');
    } catch (error) {
      toast.error('Erro ao guardar configurações');
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Repor definições
  const handleReset = async () => {
    try {
      setIsResetting(true);
      await apiClient.appSettings.reset();

      // Invalidar cache e atualizar contexto
      invalidateCache('app-settings');
      await refreshSettings();
      await loadSettings();

      toast.success('Configurações restauradas com sucesso');
    } catch (error) {
      toast.error('Erro ao repor configurações');
      console.error(error);
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingBars className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Grid de 3 Colunas - Logo + Cores + Botão NavBar */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Logo da Sidebar */}
          <Card className="rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 shrink-0">
                  <ImageIcon className="h-5 w-5 text-red-700" />
                </div>
                Logo da Sidebar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sidebarLogo && (
                <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-muted/30">
                  <img
                    src={sidebarLogo}
                    alt="Logo da sidebar"
                    className="h-12 max-w-full object-contain"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                className="min-h-[44px] w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {sidebarLogo ? 'Alterar' : 'Carregar'}
              </Button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG ou SVG. Máx. 2MB.
              </p>
              <Separator className="my-3" />
              <div className="space-y-2">
                <Label htmlFor="sidebarText" className="text-xs">Texto da Sidebar</Label>
                <Input
                  id="sidebarText"
                  value={sidebarText}
                  onChange={(e) => setSidebarText(e.target.value)}
                  placeholder="Grupo RAF"
                  className="min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground">
                  Texto exibido ao lado do logo.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cores da Aplicação */}
          <Card className="rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 shrink-0">
                  <Palette className="h-5 w-5 text-red-700" />
                </div>
                Cores da Aplicação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="primaryColor" className="text-xs">Cor Primária</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor || DEFAULT_COLORS.primary}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-16 cursor-pointer shrink-0"
                  />
                  <Input
                    type="text"
                    value={primaryColor || ''}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#dc2626"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor" className="text-xs">Cor Secundária</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={secondaryColor || DEFAULT_COLORS.secondary}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-16 cursor-pointer shrink-0"
                  />
                  <Input
                    type="text"
                    value={secondaryColor || ''}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#991b1b"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accentColor" className="text-xs">Cor de Destaque</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={accentColor || DEFAULT_COLORS.accent}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-16 cursor-pointer shrink-0"
                  />
                  <Input
                    type="text"
                    value={accentColor || ''}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#fca5a5"
                    className="flex-1"
                  />
                </div>
              </div>
              <Separator className="my-2" />
              <div className="space-y-2">
                <Label htmlFor="sidebarColor" className="text-xs">Cor da Sidebar</Label>
                <div className="flex gap-2">
                  <Input
                    id="sidebarColor"
                    type="color"
                    value={sidebarColor || '#7f1d1d'}
                    onChange={(e) => setSidebarColor(e.target.value)}
                    className="h-10 w-16 cursor-pointer shrink-0"
                  />
                  <Input
                    type="text"
                    value={sidebarColor || ''}
                    onChange={(e) => setSidebarColor(e.target.value)}
                    placeholder="#7f1d1d"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Cor de fundo da barra lateral.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSetDefaults} className="w-full">
                <Palette className="h-4 w-4 mr-2" />
                Predefinidas
              </Button>
            </CardContent>
          </Card>

          {/* Botão Customizável da NavBar */}
          <Card className="rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 shrink-0">
                    <LayoutGrid className="h-5 w-5 text-green-700" />
                  </div>
                  <span className="text-sm">Botão da NavBar</span>
                </CardTitle>
                <Switch
                  checked={customButtonEnabled}
                  onCheckedChange={setCustomButtonEnabled}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {customButtonEnabled ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="buttonLabel" className="text-xs">Nome</Label>
                    <Input
                      id="buttonLabel"
                      value={customButtonLabel}
                      onChange={(e) => setCustomButtonLabel(e.target.value)}
                      placeholder="CRM MyCredit"
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buttonColor" className="text-xs">Cor</Label>
                    <div className="flex gap-2">
                      <Input
                        id="buttonColor"
                        type="color"
                        value={customButtonColor}
                        onChange={(e) => setCustomButtonColor(e.target.value)}
                        className="h-10 w-16 cursor-pointer shrink-0"
                      />
                      <Input
                        type="text"
                        value={customButtonColor}
                        onChange={(e) => setCustomButtonColor(e.target.value)}
                        placeholder="#22c55e"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buttonUrl" className="text-xs">URL</Label>
                    <Input
                      id="buttonUrl"
                      type="url"
                      value={customButtonUrl}
                      onChange={(e) => setCustomButtonUrl(e.target.value)}
                      placeholder="https://mycredit.pt"
                      className="min-h-[44px]"
                    />
                  </div>
                  {/* Preview */}
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <button
                      type="button"
                      style={{
                        backgroundColor: customButtonColor,
                        color: '#ffffff',
                      }}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-3 w-full hover:opacity-90"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      {customButtonLabel}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Botão desativado
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ações */}
        <Card className="rounded-2xl border border-border/50 shadow-sm bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving || isResetting}
                className="min-h-[44px] flex-1 transition-all"
              >
                {isSaving ? (
                  <>
                    <LoadingBars className="h-4 w-4 mr-2" />
                    A guardar...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Configurações
                  </>
                )}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isSaving || isResetting}
                    className="min-h-[44px] sm:w-auto transition-all"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Repor Definições
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Repor todas as definições?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá restaurar todas as configurações da aplicação para os
                      valores padrão. As alterações atuais serão perdidas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset} disabled={isResetting}>
                      {isResetting ? (
                        <>
                          <LoadingBars className="h-4 w-4 mr-2" />
                          A repor...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Repor Definições
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {settings && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Última atualização: {new Date(settings.updatedAt).toLocaleString('pt-PT')} •
                Versão: {settings.version}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
