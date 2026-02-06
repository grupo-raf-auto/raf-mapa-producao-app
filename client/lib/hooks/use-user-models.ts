'use client';

import { useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import {
  useOptionalModelContext,
  type UserModel,
} from '@/lib/context/model-context';
import { apiClient } from '@/lib/api-client';

const NO_CONTEXT_RETURN = {
  models: [] as UserModel[],
  activeModel: null as UserModel | null,
  loading: false,
  switchModel: async (_modelId: string) => {},
  hasMultipleModels: false,
  hasContext: false,
} as const;

/**
 * Hook para gerenciar modelos de usuário
 * Carrega os modelos do usuário autenticado e popula o ModelContext.
 * Se usado fora de ModelContextProvider, retorna estado vazio e hasContext: false (evita crash).
 *
 * Uso:
 * const { models, activeModel, switchModel, loading, hasContext } = useUserModels();
 */
export function useUserModels() {
  const { data: session, isPending: sessionLoading } = useSession();
  const modelContext = useOptionalModelContext();

  // Run only when session is ready; do not depend on modelContext to avoid
  // infinite loop (context updates after loadUserModels → new reference → effect re-runs).
  useEffect(() => {
    if (!modelContext || !session?.user || sessionLoading) return;

    loadUserModels();

    // Listen for model switch events from other tabs/windows
    const handleModelSwitch = () => {
      loadUserModels();
    };

    window.addEventListener('model-switched', handleModelSwitch);

    return () => {
      window.removeEventListener('model-switched', handleModelSwitch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- modelContext intentionally omitted to prevent update loop
  }, [session?.user?.id, sessionLoading]);

  async function loadUserModels() {
    if (!modelContext) return;
    try {
      modelContext.setLoading(true);

      const raw = await apiClient.userModels.getMyModels();

      // Handle both unwrapped array and { success, data } from API
      const models = Array.isArray(raw)
        ? raw
        : raw &&
            typeof raw === 'object' &&
            'data' in raw &&
            Array.isArray((raw as { data: unknown }).data)
          ? (raw as { data: UserModel[] }).data
          : [];

      const modelArray = models;

      // Set available models
      modelContext.setAvailableModels(modelArray);

      if (modelArray.length === 0) {
        // No models available
        modelContext.setActiveModel(null);
        localStorage.removeItem('activeModelId');
        return;
      }

      // Determine active model: try localStorage, then first available
      const storedModelId = localStorage.getItem('activeModelId');
      let activeModel = modelArray.find(
        (m: UserModel) => m.id === storedModelId,
      );

      // If stored model doesn't exist in current list, use first available
      if (!activeModel) {
        activeModel = modelArray[0];
      }

      if (activeModel) {
        modelContext.setActiveModel(activeModel);
        localStorage.setItem('activeModelId', activeModel.id);
        // Also set cookie for Server Components
        document.cookie = `activeModelId=${activeModel.id}; path=/; max-age=86400; SameSite=Lax`;
      }
    } catch (error) {
      console.error('Error loading user models:', error);
      modelContext.setActiveModel(null);
      modelContext.setAvailableModels([]);
    } finally {
      modelContext.setLoading(false);
    }
  }

  if (!modelContext) {
    return { ...NO_CONTEXT_RETURN };
  }

  return {
    models: modelContext.availableModels,
    activeModel: modelContext.activeModel,
    loading: modelContext.loading || sessionLoading,
    switchModel: modelContext.switchModel,
    hasMultipleModels: modelContext.hasMultipleModels,
    hasContext: true,
  };
}
