"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ModelType = "credito" | "imobiliaria" | "seguro";

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

  const switchModel = useCallback(async (modelId: string) => {
    try {
      setLoading(true);

      // Find the model to switch to
      const model = availableModels.find((m) => m.id === modelId);
      if (!model) {
        throw new Error("Model not found");
      }

      // Call API to switch model
      const response = await fetch("/api/user-models/switch-model/" + modelId, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to switch model");
      }

      const data = await response.json();

      // Update active model in context
      setActiveModel(model);

      // Store the active model ID in localStorage for persistence
      localStorage.setItem("activeModelId", modelId);

      // Emit custom event to signal model switch (for cache invalidation)
      window.dispatchEvent(
        new CustomEvent("model-switched", {
          detail: { modelId, modelType: model.modelType },
        })
      );
    } catch (error) {
      console.error("Error switching model:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [availableModels]);

  const hasMultipleModels = availableModels.length > 1;

  return (
    <ModelContext.Provider
      value={{
        activeModel,
        availableModels,
        loading,
        setActiveModel,
        setAvailableModels,
        setLoading,
        switchModel,
        hasMultipleModels,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModelContext() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error("useModelContext must be used within ModelContextProvider");
  }
  return context;
}
