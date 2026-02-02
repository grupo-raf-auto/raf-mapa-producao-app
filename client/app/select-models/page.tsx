"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface ModelOption {
  value: "credito" | "imobiliaria" | "seguro";
  label: string;
  description: string;
  icon: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    value: "credito",
    label: "Crédito",
    description: "Intermediação de crédito e financiamento",
    icon: "💰",
  },
  {
    value: "imobiliaria",
    label: "Imobiliária",
    description: "Gestão imobiliária e vendas de propriedades",
    icon: "🏠",
  },
  {
    value: "seguro",
    label: "Seguros",
    description: "Mediação de seguros e proteção",
    icon: "🛡️",
  },
];

export default function SelectModelsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [selectedModels, setSelectedModels] = useState<string[]>(["credito"]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Verify session and redirect if user already has models
  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      router.push("/sign-in");
      return;
    }

    // Check if user already has models
    checkUserModels();
  }, [session, isPending, router]);

  async function checkUserModels() {
    try {
      setIsInitializing(true);
      const models = await apiClient.userModels.getMyModels();

      if (models && models.length > 0) {
        // User already has models, redirect to dashboard
        router.push("/");
        return;
      }

      setIsInitializing(false);
    } catch (err) {
      console.error("Error checking user models:", err);
      setIsInitializing(false);
      // Continue to show selection page even if check fails
    }
  }

  function handleToggleModel(modelType: string) {
    setSelectedModels((prev) => {
      if (prev.includes(modelType)) {
        // Don't allow deselecting the last model
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((m) => m !== modelType);
      } else {
        return [...prev, modelType];
      }
    });
  }

  async function handleSubmit() {
    if (selectedModels.length === 0) {
      setError("Deve selecionar pelo menos um modelo");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Add each selected model to user
      for (const modelType of selectedModels) {
        await apiClient.userModels.addModelToMyUser(modelType);
      }

      // Redirect to dashboard
      router.push("/");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao selecionar modelos";
      setError(errorMessage);
      console.error("Error selecting models:", err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isPending || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Bem-vindo, {session.user.name}!</CardTitle>
          <CardDescription className="text-base mt-2">
            Selecione os modelos de negócio que deseja ativar. Pode sempre
            adicionar ou remover modelos depois.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Model Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MODEL_OPTIONS.map((model) => (
              <div
                key={model.value}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedModels.includes(model.value)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleToggleModel(model.value)}
              >
                <div className="absolute top-4 right-4">
                  <Checkbox
                    checked={selectedModels.includes(model.value)}
                    onChange={() => handleToggleModel(model.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="text-4xl mb-3">{model.icon}</div>

                <h3 className="font-semibold text-lg mb-1">{model.label}</h3>
                <p className="text-sm text-muted-foreground">{model.description}</p>
              </div>
            ))}
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Dica:</strong> Você deve selecionar pelo menos um modelo.
              Cada modelo dará acesso a funcionalidades específicas dessa área de
              negócio.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/sign-out")}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isLoading || selectedModels.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                "Confirmar Seleção"
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Modelos selecionados: {selectedModels.length}/{MODEL_OPTIONS.length}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
