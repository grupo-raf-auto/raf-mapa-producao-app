"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useModelContext, type UserModel } from "@/lib/context/model-context";
import { apiClient } from "@/lib/api-client";

/**
 * Hook para gerenciar modelos de usuário
 * Carrega os modelos do usuário autenticado e popula o ModelContext
 *
 * Uso:
 * const { models, activeModel, switchModel, loading } = useUserModels();
 */
export function useUserModels() {
  const { data: session, isPending: sessionLoading } = useSession();
  const modelContext = useModelContext();

  useEffect(() => {
    if (!session?.user || sessionLoading) return;

    loadUserModels();

    // Listen for model switch events from other tabs/windows
    const handleModelSwitch = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("Model switched from another tab:", customEvent.detail);
      // Optionally reload models to sync
      loadUserModels();
    };

    window.addEventListener("model-switched", handleModelSwitch);

    return () => {
      window.removeEventListener("model-switched", handleModelSwitch);
    };
  }, [session?.user?.id, sessionLoading]);

  async function loadUserModels() {
    try {
      modelContext.setLoading(true);

      const models = await apiClient.userModels.getMyModels();

      // Set available models
      modelContext.setAvailableModels(models);

      // Determine active model from localStorage or first available
      const storedModelId = localStorage.getItem("activeModelId");
      const activeModel =
        models.find((m: UserModel) => m.id === storedModelId) || models[0];

      if (activeModel) {
        modelContext.setActiveModel(activeModel);
        localStorage.setItem("activeModelId", activeModel.id);
      }
    } catch (error) {
      console.error("Error loading user models:", error);
    } finally {
      modelContext.setLoading(false);
    }
  }

  return {
    models: modelContext.availableModels,
    activeModel: modelContext.activeModel,
    loading: modelContext.loading || sessionLoading,
    switchModel: modelContext.switchModel,
    hasMultipleModels: modelContext.hasMultipleModels,
  };
}
