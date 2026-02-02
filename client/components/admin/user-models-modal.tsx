"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface UserModel {
  id: string;
  modelType: string;
  isActive: boolean;
  activatedAt: string;
}

interface UserModelsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName?: string;
}

const MODEL_LABELS: Record<string, string> = {
  credito: "Crédito",
  imobiliaria: "Imobiliária",
  seguro: "Seguros",
};

const AVAILABLE_MODELS = [
  { type: "credito", label: "Crédito" },
  { type: "imobiliaria", label: "Imobiliária" },
  { type: "seguro", label: "Seguros" },
];

export function UserModelsModal({
  open,
  onOpenChange,
  userId,
  userName = "Utilizador",
}: UserModelsModalProps) {
  const [userModels, setUserModels] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadUserModels();
    }
  }, [open, userId]);

  async function loadUserModels() {
    try {
      setLoading(true);
      setError(null);
      const models = await apiClient.userModels.getUserModels(userId);
      setUserModels(models || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao carregar modelos";
      setError(errorMessage);
      console.error("Error loading user models:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addModel(modelType: string) {
    try {
      setActionLoading(modelType);
      await apiClient.userModels.addModelToUser(userId, modelType);
      toast.success(`Modelo ${modelType} adicionado com sucesso`);
      await loadUserModels();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao adicionar modelo";
      toast.error(errorMessage);
      console.error("Error adding model:", err);
    } finally {
      setActionLoading(null);
    }
  }

  async function removeModel(modelId: string, modelType: string) {
    if (userModels.length === 1) {
      toast.error("Utilizador deve ter pelo menos um modelo ativo");
      return;
    }

    if (
      !confirm(
        `Tem certeza que deseja remover o modelo ${MODEL_LABELS[modelType]}? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      setActionLoading(modelId);
      await apiClient.userModels.removeModelFromUser(userId, modelId);
      toast.success(`Modelo ${modelType} removido com sucesso`);
      await loadUserModels();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao remover modelo";
      toast.error(errorMessage);
      console.error("Error removing model:", err);
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleModel(modelId: string, modelType: string) {
    try {
      setActionLoading(modelId);
      await apiClient.userModels.toggleModelStatus(userId, modelId);
      toast.success(`Status do modelo ${modelType} alterado com sucesso`);
      await loadUserModels();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao alterar modelo";
      toast.error(errorMessage);
      console.error("Error toggling model:", err);
    } finally {
      setActionLoading(null);
    }
  }

  const activeModelTypes = userModels.map((m) => m.modelType);
  const availableToAdd = AVAILABLE_MODELS.filter(
    (m) => !activeModelTypes.includes(m.type)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modelos de {userName}</DialogTitle>
          <DialogDescription>
            Gerir modelos de negócio do utilizador
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Active Models */}
              <div>
                <h3 className="font-semibold mb-2 text-sm text-foreground">
                  Modelos Ativos ({userModels.length})
                </h3>
                <div className="space-y-2">
                  {userModels.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      Nenhum modelo atribuído.
                    </p>
                  ) : (
                    userModels.map((model) => (
                      <div
                        key={model.id}
                        className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {MODEL_LABELS[model.modelType]}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Ativado em {new Date(model.activatedAt).toLocaleDateString("pt-PT")}
                          </div>
                        </div>

                        <div className="flex gap-1 ml-2 shrink-0">
                          {/* Toggle Status Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              toggleModel(model.id, model.modelType)
                            }
                            disabled={
                              actionLoading === model.id ||
                              (userModels.length === 1 && model.isActive)
                            }
                            className="p-1.5 h-auto"
                            title={
                              userModels.length === 1 && model.isActive
                                ? "Não pode desativar o último modelo ativo"
                                : model.isActive
                                  ? "Desativar"
                                  : "Ativar"
                            }
                          >
                            {actionLoading === model.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : model.isActive ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </Button>

                          {/* Remove Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              removeModel(model.id, model.modelType)
                            }
                            disabled={
                              actionLoading === model.id ||
                              (userModels.length === 1 && model.isActive)
                            }
                            className="p-1.5 h-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {actionLoading === model.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add New Model */}
              {availableToAdd.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm text-foreground">
                    Adicionar Modelo ({availableToAdd.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {availableToAdd.map((model) => (
                      <Button
                        key={model.type}
                        variant="outline"
                        onClick={() => addModel(model.type)}
                        disabled={actionLoading === model.type}
                        className="h-auto py-2"
                      >
                        {actionLoading === model.type ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-3 h-3 mr-1.5" />
                            <span className="text-xs">{MODEL_LABELS[model.type]}</span>
                          </>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
