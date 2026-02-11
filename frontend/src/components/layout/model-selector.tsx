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
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// Mapear tipos de modelo para ícones, labels e cores (trigger + itens do dropdown)
const modelConfig = {
  credito: {
    icon: CreditCard,
    label: 'Crédito',
    color:
      'bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/30',
    itemColor:
      'text-blue-700 dark:text-blue-300 data-[highlighted]:bg-blue-500/15',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  seguro: {
    icon: Shield,
    label: 'Seguros',
    color:
      'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30',
    itemColor:
      'text-emerald-700 dark:text-emerald-300 data-[highlighted]:bg-emerald-500/15',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  imobiliaria: {
    icon: Building2,
    label: 'Imobiliária',
    color:
      'bg-orange-500/20 text-orange-700 dark:text-orange-300 hover:bg-orange-500/30',
    itemColor:
      'text-orange-700 dark:text-orange-300 data-[highlighted]:bg-orange-500/15',
    iconColor: 'text-orange-600 dark:text-orange-400',
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

  // Mostrar skeleton enquanto carrega
  if (!mounted || loading) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-700 animate-pulse"
        style={{ width: '120px', height: '28px' }}
      />
    );
  }

  // Se não há modelo ativo e acabou de carregar, mostrar mensagem
  if (!activeModel || !models || models.length === 0) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-700 dark:text-amber-300"
        title="Nenhum modelo configurado"
      >
        <span>Nenhum modelo</span>
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

  // Se apenas um modelo, mostrar como indicador simples
  if (!hasMultipleModels) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeConfig?.color || 'bg-slate-500/20 text-slate-700 dark:text-slate-300'}`}
        title="Modelo ativo"
      >
        <ActiveIcon className="w-3.5 h-3.5" />
        <span>{activeConfig?.label || activeModel.modelType}</span>
      </div>
    );
  }

  // Com múltiplos modelos, mostrar dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border border-transparent cursor-pointer ${activeConfig?.color || 'bg-slate-500/20 text-slate-700 dark:text-slate-300'} hover:border-border disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={isSwitching || loading}
          title="Selecionar modelo"
        >
          {isSwitching ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Mudando...</span>
            </>
          ) : (
            <>
              <ActiveIcon className="w-3.5 h-3.5" />
              <span>{activeConfig?.label || activeModel.modelType}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {models.map((model) => {
          const config =
            modelConfig[model.modelType as keyof typeof modelConfig];
          const Icon = config?.icon || CreditCard;
          const isActive = activeModel.id === model.id;

          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => handleModelSwitch(model.id)}
              disabled={isActive || isSwitching}
              className={`flex items-center gap-2 cursor-pointer ${config?.itemColor || ''}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${config?.iconColor || 'text-muted-foreground'}`} />
              <span className="flex-1 font-medium">{config?.label || model.modelType}</span>
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
