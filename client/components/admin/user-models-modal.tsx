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
  credito: "💰 Crédito",
  imobiliaria: "🏠 Imobiliária",
  seguro: "🛡️ Seguros",
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

        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
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
                <h3 className="font-semibold mb-3 text-sm">
                  Modelos Ativos ({userModels.length})
                </h3>
                <div className="space-y-3">
                  {userModels.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-4">
                      Nenhum modelo atribuído. Adicione um modelo abaixo.
                    </p>
                  ) : (
                    userModels.map((model) => (
                      <div
                        key={model.id}
                        className="flex items-center justify-between gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col gap-1 min-w-0">
                          <Badge
                            variant={model.isActive ? "default" : "secondary"}
                            className="w-fit"
                          >
                            {MODEL_LABELS[model.modelType]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Ativado em{" "}
                            {new Date(model.activatedAt).toLocaleDateString(
                              "pt-PT"
                            )}
                          </span>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          {/* Toggle Status Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              toggleModel(model.id, model.modelType)
                            }
                            disabled={
                              actionLoading === model.id ||
                              (userModels.length === 1 && model.isActive)
                            }
                            className="gap-2"
                            title={
                              userModels.length === 1 && model.isActive
                                ? "Não pode desativar o último modelo ativo"
                                : model.isActive
                                  ? "Desativar modelo (mantém histórico)"
                                  : "Ativar modelo"
                            }
                          >
                            {actionLoading === model.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : model.isActive ? (
                              <>
                                <ToggleRight className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                  Desativar
                                </span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Ativar</span>
                              </>
                            )}
                          </Button>

                          {/* Remove Button */}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              removeModel(model.id, model.modelType)
                            }
                            disabled={
                              actionLoading === model.id ||
                              (userModels.length === 1 && model.isActive)
                            }
                            className="p-2"
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
                  <h3 className="font-semibold mb-3 text-sm">
                    Adicionar Modelo ({availableToAdd.length} disponível
                    {availableToAdd.length !== 1 ? "s" : ""})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {availableToAdd.map((model) => (
                      <Button
                        key={model.type}
                        variant="outline"
                        onClick={() => addModel(model.type)}
                        disabled={actionLoading === model.type}
                        className="gap-2 h-auto py-3"
                      >
                        {actionLoading === model.type ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <div className="text-left">
                              <div className="font-medium">
                                {MODEL_LABELS[model.type]}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Adicionar
                              </div>
                            </div>
                          </>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-800 space-y-1">
                    <strong>Informações importantes:</strong>
                    <ul className="list-disc list-inside text-xs space-y-0.5">
                      <li>
                        <strong>Desativar:</strong> O modelo fica inativo mas o histórico é mantido. Pode ser reativado depois.
                      </li>
                      <li>
                        <strong>Remover:</strong> O modelo é eliminado completamente. Os dados são perdidos e não pode ser revertido.
                      </li>
                      <li>
                        O utilizador deve ter <strong>pelo menos 1 modelo ativo</strong> em qualquer momento.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
