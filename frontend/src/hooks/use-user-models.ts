import { useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useModelContext, type UserModel } from '@/contexts/model-context';
import { apiClient } from '@/lib/api-client';

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
      // Reload models to sync across tabs
      loadUserModels();
    };

    window.addEventListener('model-switched', handleModelSwitch);

    return () => {
      window.removeEventListener('model-switched', handleModelSwitch);
    };
  }, [session?.user?.id, sessionLoading]);

  async function loadUserModels() {
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

  return {
    models: modelContext.availableModels,
    activeModel: modelContext.activeModel,
    loading: modelContext.loading || sessionLoading,
    switchModel: modelContext.switchModel,
    hasMultipleModels: modelContext.hasMultipleModels,
  };
}
