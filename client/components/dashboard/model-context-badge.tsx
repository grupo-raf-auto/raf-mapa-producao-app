"use client";

import { useUserModels } from "@/lib/hooks/use-user-models";
import { Loader2 } from "lucide-react";

/**
 * Model Context Badge Component
 * Displays the currently active model in the dashboard
 */
export function ModelContextBadge() {
  const { activeModel, loading } = useUserModels();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeModel) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Contexto ativo:</span>
      <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
        {activeModel.modelType === "credito"
          ? "💰 Crédito"
          : activeModel.modelType === "imobiliaria"
            ? "🏠 Imobiliária"
            : "🛡️ Seguros"}
      </span>
    </div>
  );
}
