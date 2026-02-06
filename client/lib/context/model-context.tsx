'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

export type ModelType = 'credito' | 'imobiliaria' | 'seguro';

export interface UserModel {
  id: string;
  userId: string;
  modelType: ModelType;
  isActive: boolean;
  activatedAt: string;
  activatedBy?: string | null;
  creditoProfileId?: string | null;
  creditoProfile?: any;
  imobiliariaProfileId?: string | null;
  imobiliariaProfile?: any;
  seguroProfileId?: string | null;
  seguroProfile?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface ModelContextType {
  activeModel: UserModel | null;
  availableModels: UserModel[];
  loading: boolean;
  setActiveModel: (model: UserModel | null) => void;
  setAvailableModels: (models: UserModel[]) => void;
  setLoading: (loading: boolean) => void;
  switchModel: (modelId: string) => Promise<void>;
  hasMultipleModels: boolean;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelContextProvider({ children }: { children: ReactNode }) {
  const [activeModel, setActiveModel] = useState<UserModel | null>(null);
  const [availableModels, setAvailableModels] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);

  const switchModel = useCallback(
    async (modelId: string) => {
      try {
        setLoading(true);

        // Find the model to switch to
        const model = availableModels.find((m) => m.id === modelId);
        if (!model) {
          throw new Error('Model not found');
        }

        // Call API to switch model via the proxy route
        const response = await fetch(
          '/api/proxy/user-models/switch-model/' + modelId,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          },
        );

        if (!response.ok) {
          throw new Error('Failed to switch model');
        }

        const data = await response.json();

        // Update active model in context
        setActiveModel(model);

        // Store the active model ID in localStorage for persistence
        localStorage.setItem('activeModelId', modelId);

        // Also store in cookie for Server Components to access
        document.cookie = `activeModelId=${modelId}; path=/; max-age=86400; SameSite=Lax`;

        // Emit custom event to signal model switch (for cache invalidation)
        window.dispatchEvent(
          new CustomEvent('model-switched', {
            detail: { modelId, modelType: model.modelType },
          }),
        );
      } catch (error) {
        console.error('Error switching model:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [availableModels],
  );

  const hasMultipleModels = availableModels.length > 1;

  const value = useMemo(
    () => ({
      activeModel,
      availableModels,
      loading,
      setActiveModel,
      setAvailableModels,
      setLoading,
      switchModel,
      hasMultipleModels,
    }),
    [activeModel, availableModels, loading, switchModel, hasMultipleModels],
  );

  return (
    <ModelContext.Provider value={value}>{children}</ModelContext.Provider>
  );
}

export function useModelContext() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModelContext must be used within ModelContextProvider');
  }
  return context;
}

/** Versão opcional: retorna undefined se fora do provider (evita crash na navbar/edge cases). */
export function useOptionalModelContext() {
  return useContext(ModelContext);
}
