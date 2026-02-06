import { useState, useEffect } from 'react';
import { useRouter } from '@/lib/router-compat';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, Check, ArrowRight, LayoutGrid } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

const MODEL_OPTIONS = [
  {
    value: 'credito' as const,
    label: 'Crédito',
    description: 'Intermediação de crédito e financiamento',
    icon: '💰',
  },
  {
    value: 'imobiliaria' as const,
    label: 'Imobiliária',
    description: 'Gestão imobiliária e vendas de propriedades',
    icon: '🏠',
  },
  {
    value: 'seguro' as const,
    label: 'Seguros',
    description: 'Mediação de seguros e proteção',
    icon: '🛡️',
  },
];

export default function SelectModelsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [selectedModels, setSelectedModels] = useState<string[]>(['credito']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.push('/sign-in');
      return;
    }
    checkUserModels();
  }, [session, isPending]);

  async function checkUserModels() {
    try {
      setIsInitializing(true);
      const models = await apiClient.userModels.getMyModels();
      if (models && models.length > 0) {
        router.push('/');
        return;
      }
      setIsInitializing(false);
    } catch (err) {
      console.error('Error checking user models:', err);
      setIsInitializing(false);
    }
  }

  function handleToggleModel(modelType: string) {
    setSelectedModels((prev) => {
      if (prev.includes(modelType)) {
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== modelType);
      }
      return [...prev, modelType];
    });
  }

  async function handleSubmit() {
    if (selectedModels.length === 0) {
      setError('Selecione pelo menos um modelo de negócio para continuar.');
      return;
    }
    try {
      setError(null);
      setIsLoading(true);
      for (const modelType of selectedModels) {
        await apiClient.userModels.addModelToMyUser(modelType);
      }
      try {
        const list = await apiClient.userModels.getMyModels();
        const first = list[0] as { id?: string } | undefined;
        if (first?.id) {
          localStorage.setItem('activeModelId', first.id);
          document.cookie = `activeModelId=${first.id}; path=/; max-age=86400; SameSite=Lax`;
        }
      } catch (_) {}
      router.push('/');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao guardar. Tente novamente.',
      );
      console.error('Error selecting models:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isPending || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
        <Card className="w-full max-w-[420px] border-0 shadow-lg shadow-black/5 bg-card">
          <CardContent className="pt-10 pb-10 flex flex-col items-center gap-6">
            <div className="rounded-full bg-muted p-4">
              <Spinner
                variant="bars"
                className="w-8 h-8 text-muted-foreground"
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                A carregar a sua conta
              </p>
              <p className="text-xs text-muted-foreground">
                Aguarde um momento...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4 py-12">
      <div className="w-full max-w-[520px]">
        <Card className="border-0 shadow-lg shadow-black/5 bg-card overflow-hidden">
          <CardHeader className="text-center pb-2 pt-10">
            <div className="mx-auto rounded-full bg-primary/10 border border-primary/10 w-16 h-16 flex items-center justify-center mb-5">
              <LayoutGrid className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
              Último passo
            </p>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Escolha os seus modelos de negócio
            </CardTitle>
            <CardDescription className="text-sm mt-2 max-w-sm mx-auto leading-relaxed">
              Bem-vindo, {session.user.name ?? 'utilizador'}. A sua conta foi
              aprovada. Selecione em que áreas pretende trabalhar na plataforma
              — pode alterar esta escolha mais tarde.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-foreground mb-3">
                Modelos de negócio (selecione pelo menos um)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MODEL_OPTIONS.map((model) => {
                  const isSelected = selectedModels.includes(model.value);
                  return (
                    <div
                      key={model.value}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleToggleModel(model.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleModel(model.value);
                        }
                      }}
                      aria-pressed={isSelected}
                      aria-disabled={isLoading}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/30 hover:bg-muted/30'
                      } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="absolute top-3 right-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleModel(model.value)}
                          disabled={isLoading}
                          className="pointer-events-none"
                        />
                      </div>
                      <span className="text-2xl block mb-2">{model.icon}</span>
                      <h3 className="font-semibold text-foreground mb-0.5">
                        {model.label}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {model.description}
                      </p>
                      {isSelected && (
                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                          <Check className="w-3.5 h-3.5" /> Selecionado
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium text-foreground mb-1">
                O que acontece a seguir?
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>
                  Terá acesso às áreas da plataforma correspondentes aos modelos
                  escolhidos
                </li>
                <li>
                  Poderá adicionar ou remover modelos mais tarde nas definições
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2 pb-10">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || selectedModels.length === 0}
              variant="default"
              size="lg"
              className="w-full h-11 font-medium"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner variant="bars" className="w-4 h-4" /> A guardar...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Confirmar e entrar na plataforma{' '}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {selectedModels.length} de {MODEL_OPTIONS.length} modelos
              selecionados
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => router.push('/sign-in')}
              disabled={isLoading}
            >
              Terminar sessão
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
