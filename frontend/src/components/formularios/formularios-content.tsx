import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient as api } from "@/lib/api-client";
import { format } from "date-fns";
import { pt } from "date-fns/locale/pt";
import { FileStack, Calendar, FileEdit, Lock } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { FillTemplateDialog } from "@/components/templates/fill-template-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { BorderRotate } from "@/components/ui/animated-gradient-border";
import { useModelContext } from "@/contexts/model-context";

interface Template {
  _id?: string;
  title: string;
  description?: string;
  questions: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  isDefault?: boolean;
  modelType?: "credito" | "imobiliaria" | "seguro" | null;
}

export function FormulariosContent() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [fillingTemplate, setFillingTemplate] = useState<Template | null>(null);
  const [isFillDialogOpen, setIsFillDialogOpen] = useState(false);
  const { activeModel, loading: modelLoading } = useModelContext();

  // Carregar templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templatesData = await api.templates.getAll();
        setTemplates(templatesData);
      } catch (error) {
        console.error("Error loading templates:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // Filtrar templates baseado no modelo ativo do usuário
  const filteredTemplates = useMemo(() => {
    if (!activeModel) return templates;
    
    return templates.filter((template) => {
      // Templates sem modelType são públicos (disponíveis para todos)
      if (!template.modelType) return true;
      
      // Templates com modelType só são visíveis se corresponderem ao modelo ativo
      return template.modelType === activeModel.modelType;
    });
  }, [templates, activeModel]);

  // Helper para obter o nome de exibição do modelo
  const getModelDisplayName = (modelType: string) => {
    const names: Record<string, string> = {
      credito: "Crédito",
      imobiliaria: "Imobiliária",
      seguro: "Seguros",
    };
    return names[modelType] || modelType;
  };

  if (loading || modelLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Formulários"
          description="Preencher e submeter formulários."
          icon={FileStack}
          iconGradient="from-red-600 via-red-500 to-red-700"
          decoratorIcon={<FileEdit className="w-5 h-5" />}
          decoratorColor="text-red-500"
        />
        <Card className="shadow-sm">
          <CardContent className="py-8 text-center flex flex-col items-center gap-3">
            <Spinner variant="bars" className="w-6 h-6 text-muted-foreground" />
            <p className="text-muted-foreground">Carregando formulários...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Formulários"
        description={activeModel 
          ? `Modelo ativo: ${activeModel.modelType}.`
          : "Preencher e submeter formulários."
        }
        icon={FileStack}
        iconGradient="from-red-600 via-red-500 to-red-700"
        decoratorIcon={<FileEdit className="w-5 h-5" />}
        decoratorColor="text-red-500"
      />
      {!activeModel ? (
        <Card className="shadow-sm">
          <CardContent className="py-8 text-center">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum modelo ativo selecionado
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Por favor, selecione um modelo para visualizar os formulários disponíveis
            </p>
          </CardContent>
        </Card>
      ) : filteredTemplates.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-8 text-center">
            <FileStack className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum formulário disponível para o modelo "{activeModel.modelType}"
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Entre em contato com o administrador para criar templates para este modelo
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <BorderRotate
              key={template._id}
              gradientColors={{ primary: '#5c1a1a', secondary: '#ef4444', accent: '#fca5a5' }}
              backgroundColor="var(--card)"
              borderRadius={16}
              borderWidth={2}
            >
            <Card
              className="rounded-2xl border-0 shadow-sm"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {template.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {template.description || "Sem descrição"}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1 ml-2">
                    <Badge variant="outline">Formulário</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileStack className="w-4 h-4" />
                    <span>{template.questions.length} questão(ões)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Criado em{" "}
                      {format(new Date(template.createdAt), "dd MMM yyyy", {
                        locale: pt,
                      })}
                    </span>
                  </div>
                  <div className="pt-3">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setFillingTemplate(template);
                        setIsFillDialogOpen(true);
                      }}
                    >
                      Preencher Formulário
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            </BorderRotate>
          ))}
        </div>
      )}

      <FillTemplateDialog
        template={fillingTemplate}
        open={isFillDialogOpen}
        onOpenChange={(open) => {
          setIsFillDialogOpen(open);
          if (!open) {
            setFillingTemplate(null);
          }
        }}
      />
    </div>
  );
}
