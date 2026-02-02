'use client';

import { useState, useEffect } from 'react';
import { apiClient as api } from '@/lib/api-client';
import { ConsultasWrapper } from './consultas-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Search, FileSearch } from 'lucide-react';

export function ConsultasContent() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
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
        description="Visualize os seus formulários registados e acompanhe o histórico de submissões."
        icon={Search}
        iconGradient="from-red-600 via-red-500 to-red-700"
        decoratorIcon={<FileSearch className="w-5 h-5" />}
        decoratorColor="text-red-500"
      />

      <ConsultasWrapper
        submissions={submissions}
        templates={templates}
        onSubmissionUpdate={loadData}
      />
    </div>
  );
}
