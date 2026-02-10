import React, { useState, useEffect } from 'react';
import { useUserModels } from '@/hooks/use-user-models';
import { useModelContext } from '@/contexts/model-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Check,
  CreditCard,
  Shield,
  Building2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// Mapear tipos de modelo para ícones e labels
const modelConfig = {
  credito: {
    icon: CreditCard,
    label: 'Crédito',
    color:
      'bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/30',
  },
  seguro: {
    icon: Shield,
    label: 'Seguros',
    color:
      'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30',
  },
  imobiliaria: {
    icon: Building2,
    label: 'Imobiliária',
    color:
      'bg-orange-500/20 text-orange-700 dark:text-orange-300 hover:bg-orange-500/30',
  },
};

export function ModelSelector() {
  const { models, activeModel, switchModel, loading } = useUserModels();
  const { switchModel: contextSwitchModel } = useModelContext();
  const [isSwitching, setIsSwitching] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mostrar skeleton enquanto carrega (mesmo tamanho do trigger: ícone apenas)
  if (!mounted || loading) {
    return (
      <div
        className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse"
        aria-hidden
      />
    );
  }

  // Se não há modelo ativo e acabou de carregar, mostrar indicador
  if (!activeModel || !models || models.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300"
        title="Nenhum modelo configurado"
      >
        <CreditCard className="w-4 h-4 opacity-60" aria-hidden />
      </div>
    );
  }

  // Sempre renderizar o modelo ativo, independente de ser múltiplo ou não
  const activeConfig =
    modelConfig[activeModel.modelType as keyof typeof modelConfig];
  const ActiveIcon = activeConfig?.icon || CreditCard;
  const hasMultipleModels = models.length > 1;

  const handleModelSwitch = async (modelId: string) => {
    if (modelId === activeModel.id) return;

    try {
      setIsSwitching(true);
      await contextSwitchModel(modelId);
      toast.success('Modelo alterado com sucesso');
    } catch (error) {
      toast.error('Erro ao trocar modelo');
      console.error('Error switching model:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  const triggerTitle = activeConfig?.label || activeModel.modelType;

  // Um único modelo: só ícone com tooltip
  if (!hasMultipleModels) {
    return (
      <div
        className={`flex items-center justify-center w-9 h-9 rounded-xl ${activeConfig?.color || 'bg-slate-500/20 text-slate-700 dark:text-slate-300'}`}
        title={triggerTitle}
      >
        <ActiveIcon className="w-4 h-4 shrink-0" aria-hidden />
      </div>
    );
  }

  // Múltiplos modelos: trigger só com ícone do modelo ativo; ao abrir o dropdown vê as opções por extenso
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center justify-center w-9 h-9 rounded-xl border border-transparent cursor-pointer ${activeConfig?.color || 'bg-slate-500/20 text-slate-700 dark:text-slate-300'} hover:border-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          disabled={isSwitching || loading}
          title={`Modelo: ${triggerTitle}. Clique para mudar.`}
          aria-label={`Modelo ativo: ${triggerTitle}. Abrir menu para escolher.`}
        >
          {isSwitching ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
          ) : (
            <ActiveIcon className="w-4 h-4 shrink-0" aria-hidden />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border/60 mb-1">
          Escolher modelo
        </div>
        {models.map((model) => {
          const config =
            modelConfig[model.modelType as keyof typeof modelConfig];
          const Icon = config?.icon || CreditCard;
          const isActive = activeModel.id === model.id;
          const label = config?.label || model.modelType;

          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => handleModelSwitch(model.id)}
              disabled={isActive || isSwitching}
              className="flex items-center gap-3 cursor-pointer min-h-[44px]"
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && (
                <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
