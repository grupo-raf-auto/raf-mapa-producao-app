"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface UserModel {
  id: string;
  modelType: string;
  isActive: boolean;
  activatedAt: string;
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

export default function UserModelsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [userModels, setUserModels] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadUserModels();
  }, [userId]);

  async function loadUserModels() {
    try {
      setLoading(true);
      setError(null);
      const models = await apiClient.userModels.getUserModels(userId);
      setUserModels(models || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar modelos";
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
      const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar modelo";
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
      const errorMessage = err instanceof Error ? err.message : "Erro ao remover modelo";
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
      const errorMessage = err instanceof Error ? err.message : "Erro ao alterar modelo";
      toast.error(errorMessage);
      console.error("Error toggling model:", err);
    } finally {
      setActionLoading(null);
    }
  }

  const activeModelTypes = userModels.map((m) => m.modelType);
  const availableToAdd = AVAILABLE_MODELS.filter((m) => !activeModelTypes.includes(m.type));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Modelos do Utilizador</h2>
          <p className="text-muted-foreground">Gerir modelos de negócio do utilizador</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Active Models */}
      <Card>
        <CardHeader>
          <CardTitle>Modelos Ativos</CardTitle>
          <CardDescription>
            Modelos atribuídos ao utilizador ({userModels.length})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {userModels.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Nenhum modelo atribuído. Adicione um modelo abaixo.
            </p>
          ) : (
            userModels.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant={model.isActive ? "default" : "secondary"}>
                      {MODEL_LABELS[model.modelType]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Ativado em {new Date(model.activatedAt).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* Toggle Status Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleModel(model.id, model.modelType)}
                    disabled={actionLoading === model.id}
                    className="gap-2"
                  >
                    {actionLoading === model.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : model.isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        Ativar
                      </>
                    )}
                  </Button>

                  {/* Remove Button */}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeModel(model.id, model.modelType)}
                    disabled={
                      actionLoading === model.id ||
                      (userModels.length === 1 && model.isActive)
                    }
                    className="gap-2"
                  >
                    {actionLoading === model.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Remover
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add New Model */}
      {availableToAdd.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Modelo</CardTitle>
            <CardDescription>
              Modelos disponíveis ({availableToAdd.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                        <div className="font-medium">{MODEL_LABELS[model.type]}</div>
                        <div className="text-xs text-muted-foreground">Adicionar</div>
                      </div>
                    </>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <strong>Nota:</strong> O utilizador deve ter pelo menos um modelo ativo. Os dados e
          submissões são filtrados por modelo ativo na sessão do utilizador.
        </div>
      </div>
    </div>
  );
}
