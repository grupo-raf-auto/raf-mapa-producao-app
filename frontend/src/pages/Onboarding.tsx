import { useState, useEffect } from 'react';
import { useRouter } from '@/lib/router-compat';
import { useSession } from '@/lib/auth-client';
import { useAuth } from '@/hooks/use-auth';
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
import { StepsWithContent } from '@/components/ui/steps';
import { AlertCircle, Check, ArrowRight, LayoutGrid, Users } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

const MODEL_OPTIONS = [
  { value: 'credito' as const, label: 'Crédito', description: 'Intermediação de crédito e financiamento', icon: '💰' },
  { value: 'imobiliaria' as const, label: 'Imobiliária', description: 'Gestão imobiliária e vendas de propriedades', icon: '🏠' },
  { value: 'seguro' as const, label: 'Seguros', description: 'Mediação de seguros e proteção', icon: '🛡️' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { hasTeam, isAdmin, updateUserStatus } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedModels, setSelectedModels] = useState<string[]>(['credito']);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<{ id: string; name: string; description?: string | null }[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const hasModels = selectedModels.length > 0;

  // Ao carregar: verificar estado e definir passo 1 ou 2 (nunca 3 — passo 3 só após concluir equipa nesta sessão)
  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.push('/sign-in');
      return;
    }
    if (isAdmin) {
      router.push('/admin');
      return;
    }
    checkState();
  }, [session, isPending, isAdmin]);

  // Se o utilizador já tem modelos e equipa opcional (ex.: auth acabou de carregar após reload), redirecionar
  useEffect(() => {
    if (!session?.user || isAdmin || isInitializing) return;
    if (hasModels) router.replace('/');
  }, [session?.user, isAdmin, hasModels, isInitializing]);

  async function checkState() {
    try {
      setIsInitializing(true);
      const [models, teamList] = await Promise.all([
        apiClient.userModels.getMyModels(),
        apiClient.teams.getList().catch(() => []),
      ]);
      setTeams(Array.isArray(teamList) ? teamList : []);
      if (models && models.length > 0) {
        setSelectedModels(models.map((m: { modelType: string }) => m.modelType));
        router.replace('/');
        return;
      }
      // Sempre começar no passo 1 (Modelo de negócio) ao carregar a página
      setCurrentStep(1);
    } catch (err) {
      console.error('Onboarding check:', err);
      setCurrentStep(1);
    } finally {
      setIsInitializing(false);
    }
  }

  useEffect(() => {
    if (currentStep !== 2) return;
    setTeamsLoading(true);
    apiClient.teams
      .getList()
      .then((list) => setTeams(Array.isArray(list) ? list : []))
      .catch(() => setTeams([]))
      .finally(() => setTeamsLoading(false));
  }, [currentStep]);

  function handleToggleModel(modelType: string) {
    setSelectedModels((prev) => {
      if (prev.includes(modelType)) {
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== modelType);
      }
      return [...prev, modelType];
    });
  }

  async function handleStep1Next(): Promise<boolean> {
    if (selectedModels.length === 0) {
      setError('Selecione pelo menos um modelo de negócio.');
      return false;
    }
    setError(null);
    setIsLoading(true);
    try {
      const existingModels = await apiClient.userModels.getMyModels();
      const existingTypes = new Set(
        (existingModels || []).map((m: { modelType?: string }) => m.modelType)
      );
      for (const modelType of selectedModels) {
        if (!existingTypes.has(modelType)) {
          await apiClient.userModels.addModelToMyUser(modelType);
        }
      }
      const list = await apiClient.userModels.getMyModels();
      const first = list?.[0] as { id?: string } | undefined;
      if (first?.id) {
        localStorage.setItem('activeModelId', first.id);
        document.cookie = `activeModelId=${first.id}; path=/; max-age=86400; SameSite=Lax`;
      }
      updateUserStatus({ hasModels: true });
      setCurrentStep(2);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStep2Next(): Promise<boolean> {
    setError(null);
    setIsLoading(true);
    try {
      if (selectedTeamId) {
        await apiClient.teams.join(selectedTeamId);
        updateUserStatus({ hasTeam: true });
      } else {
        updateUserStatus({ hasTeam: false });
      }
      setCurrentStep(3);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao juntar à equipa. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  // Redirect para o painel no passo 3 (conclusão)
  useEffect(() => {
    if (currentStep !== 3) return;
    const t = setTimeout(() => router.replace('/'), 2500);
    return () => clearTimeout(t);
  }, [currentStep, router]);

  if (isPending || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
        <Card className="w-full max-w-[420px] border-0 shadow-lg shadow-black/5 bg-card">
          <CardContent className="pt-10 pb-10 flex flex-col items-center gap-6">
            <div className="rounded-full bg-muted p-4">
              <Spinner variant="bars" className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">A carregar...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session?.user) return null;

  const step1Content = (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Selecione em que áreas pretende trabalhar na plataforma. Pode alterar mais tarde nas definições.
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
              className={`relative rounded-xl border-2 p-4 text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="absolute top-3 right-3">
                <Checkbox checked={isSelected} className="pointer-events-none" />
              </div>
              <span className="text-2xl block mb-2">{model.icon}</span>
              <h3 className="font-semibold text-foreground mb-0.5">{model.label}</h3>
              <p className="text-xs text-muted-foreground">{model.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const step3Content = (
    <div className="py-6 flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Check className="w-8 h-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Tudo pronto!</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          A sua conta está configurada. Será redirecionado para o painel em instantes.
        </p>
      </div>
      <Button
        onClick={() => router.replace('/')}
        size="lg"
        className="mt-2"
      >
        Entrar no painel agora <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );

  const step2Content = (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Escolha a sua equipa (opcional). Pode inscrever-se mais tarde na página Equipas. Terá acesso às métricas da sua equipa e poderá comparar com as restantes.
      </p>
      {teamsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner variant="bars" className="w-8 h-8 text-muted-foreground" />
        </div>
      ) : teams.length === 0 ? (
        <div className="space-y-2 py-4">
          <p className="text-sm text-muted-foreground">
            Ainda não existem equipas. Contacte o administrador para criar equipas (Admin → Equipas).
          </p>
          <p className="text-xs text-muted-foreground">
            Pode usar «Anterior» para voltar e alterar o modelo de negócio.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {teams.map((team) => {
            const isSelected = selectedTeamId === team.id;
            return (
              <div
                key={team.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTeamId(team.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedTeamId(team.id);
                  }
                }}
                aria-pressed={isSelected}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{team.name}</p>
                  {team.description && (
                    <p className="text-xs text-muted-foreground truncate">{team.description}</p>
                  )}
                </div>
                {isSelected && <Check className="w-5 h-5 text-primary shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const steps = [
    { title: 'Modelo de negócio', content: step1Content },
    { title: 'Equipa (opcional)', content: step2Content },
    { title: 'Conclusão', content: step3Content },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4 py-12">
      <div className="w-full max-w-[600px]">
        <Card className="border-0 shadow-lg shadow-black/5 bg-card overflow-hidden">
          <CardHeader className="text-center pb-2 pt-10">
            <div className="mx-auto rounded-full bg-primary/10 border border-primary/10 w-16 h-16 flex items-center justify-center mb-5">
              <LayoutGrid className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
              Configuração inicial
            </p>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Bem-vindo, {session.user.name ?? 'utilizador'}
            </CardTitle>
            <CardDescription className="text-sm mt-2 max-w-sm mx-auto">
              Complete estes passos para começar a usar a plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}
            <StepsWithContent
              steps={steps}
              defaultStep={1}
              step={currentStep}
              onStepChange={(e) => setCurrentStep(e.step)}
              hideFooter
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2 pb-10">
            {currentStep !== 3 && (
              <>
                <div className="flex justify-between w-full max-w-2xl mx-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep <= 1 || isLoading}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    disabled={isLoading || (currentStep === 1 && !hasModels)}
                    onClick={async () => {
                      if (currentStep === 1) await handleStep1Next();
                      else if (currentStep === 2) await handleStep2Next();
                    }}
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner variant="bars" className="w-4 h-4" /> A guardar...
                      </span>
                    ) : currentStep === 2 ? (
                      <span className="inline-flex items-center gap-2">
                        {selectedTeamId ? 'Continuar' : 'Continuar sem equipa'}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    ) : (
                      'Continuar'
                    )}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => router.push('/sign-in')}
                  disabled={isLoading}
                >
                  Terminar sessão
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
