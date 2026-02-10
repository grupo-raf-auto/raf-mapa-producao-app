import { useState } from "react";
import { useUserModels } from "@/hooks/use-user-models";
import { useModelContext } from "@/contexts/model-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check, Loader2 } from "lucide-react";

const MODEL_LABELS: Record<string, string> = {
  credito: "Crédito",
  imobiliaria: "Imobiliária",
  seguro: "Seguros",
};

/**
 * ModelSwitcher Component
 *
 * Dropdown menu para trocar entre modelos de usuário
 * Apenas exibido se o usuário tiver múltiplos modelos
 *
 * Uso:
 * <ModelSwitcher />
 */
export function ModelSwitcher() {
  const { models, activeModel, switchModel, loading, hasMultipleModels } =
    useUserModels();
  const { switchModel: contextSwitchModel } = useModelContext();
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hasMultipleModels || loading) {
    return null;
  }

  async function handleSwitchModel(modelId: string) {
    try {
      setError(null);
      setIsSwitching(true);

      await contextSwitchModel(modelId);

      // Trigger cache invalidation through the custom event
      // The model switch event already triggers this in ModelContext
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to switch model";
      setError(errorMessage);
      console.error("Error switching model:", err);
    } finally {
      setIsSwitching(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isSwitching}
        >
          {isSwitching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mudando...</span>
            </>
          ) : (
            <>
              {activeModel
                ? MODEL_LABELS[activeModel.modelType] || activeModel.modelType
                : "Selecione modelo"}
              <ChevronDown className="w-4 h-4 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Trocar Contexto</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => handleSwitchModel(model.id)}
            className="cursor-pointer"
            disabled={isSwitching || activeModel?.id === model.id}
          >
            <div className="flex items-center justify-between w-full">
              <span>{MODEL_LABELS[model.modelType] || model.modelType}</span>
              {activeModel?.id === model.id && (
                <Check className="w-4 h-4 text-primary ml-2" />
              )}
            </div>
          </DropdownMenuItem>
        ))}

        {error && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-red-600">{error}</div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
