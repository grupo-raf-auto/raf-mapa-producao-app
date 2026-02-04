'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiClient as api } from '@/lib/api-client';
import { ConsultasWrapper } from './consultas-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Search, FileSearch, Lock } from 'lucide-react';
import { useModelContext } from '@/lib/context/model-context';

interface Template {
  _id?: string;
  title: string;
  description?: string;
  modelType?: 'credito' | 'imobiliaria' | 'seguro' | null;
}

interface Submission {
  _id?: string;
  templateId: string;
  answers: { questionId: string; answer: string }[];
  submittedAt: Date | string;
  formDate?: string | null;
  submittedBy: string;
}

export function ConsultasContent() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeModel, loading: modelLoading } = useModelContext();

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);
      // A API já filtra automaticamente para mostrar apenas as submissões do utilizador logado
      const [submissionsData, templatesData] = await Promise.all([
        api.submissions.getAll().catch(() => []),
        api.templates.getAll().catch(() => []),
      ]);
      console.log('🚀 ~ loadData ~ submissionsData:', submissionsData);
      setSubmissions(submissionsData || []);
      setTemplates(templatesData || []);
    } catch (error: unknown) {
      console.error('Error loading data:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao carregar dados. Tente novamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

  // Filtrar submissões para mostrar apenas as que correspondem aos templates visíveis
  const filteredSubmissions = useMemo(() => {
    if (!activeModel) return submissions;

    const visibleTemplateIds = new Set(filteredTemplates.map((t) => t._id));
    return submissions.filter((submission) =>
      visibleTemplateIds.has(submission.templateId),
    );
  }, [submissions, filteredTemplates, activeModel]);

  // Helper para obter o nome de exibição do modelo
  const getModelDisplayName = (modelType: string) => {
    const names: Record<string, string> = {
      credito: 'Crédito',
      imobiliaria: 'Imobiliária',
      seguro: 'Seguros',
    };
    return names[modelType] || modelType;
  };

  useEffect(() => {
    loadData();
  }, [activeModel?.id]);

  if (loading || modelLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Consultas"
          description="Visualize os seus formulários registados e acompanhe o histórico de submissões."
          icon={Search}
          iconGradient="from-red-600 via-red-500 to-red-700"
          decoratorIcon={<FileSearch className="w-5 h-5" />}
          decoratorColor="text-red-500"
        />
        <Card>
          <CardContent className="py-8 text-center flex flex-col items-center gap-3">
            <Spinner variant="bars" className="w-6 h-6 text-muted-foreground" />
            <p className="text-muted-foreground">Carregando formulários...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Consultas"
          description="Visualize os seus formulários registados e acompanhe o histórico de submissões."
          icon={Search}
          iconGradient="from-red-600 via-red-500 to-red-700"
          decoratorIcon={<FileSearch className="w-5 h-5" />}
          decoratorColor="text-red-500"
        />
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive font-medium mb-2">
              Erro ao carregar formulários
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultas"
        description={
          activeModel
            ? `Visualize os seus formulários registados. Modelo ativo: ${getModelDisplayName(activeModel.modelType)}.`
            : 'Visualize os seus formulários registados e acompanhe o histórico de submissões.'
        }
        icon={Search}
        iconGradient="from-red-600 via-red-500 to-red-700"
        decoratorIcon={<FileSearch className="w-5 h-5" />}
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
              Por favor, selecione um modelo para visualizar as consultas
              disponíveis
            </p>
          </CardContent>
        </Card>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-8 text-center">
            <FileSearch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma consulta disponível para o modelo &quot;
              {getModelDisplayName(activeModel.modelType)}&quot;
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              As submissões serão exibidas aqui quando houver formulários
              preenchidos para este modelo
            </p>
          </CardContent>
        </Card>
      ) : (
        <ConsultasWrapper
          submissions={filteredSubmissions}
          templates={filteredTemplates}
          onSubmissionUpdate={loadData}
        />
      )}
    </div>
  );
}
