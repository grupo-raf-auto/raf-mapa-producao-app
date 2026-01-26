"use client";

import { useState, useEffect } from "react";
import { apiClient as api } from "@/lib/api-client";
import { AdminConsultasWrapper } from "./admin-consultas-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";

export function AdminConsultasContent() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);
      // Admin vê todas as submissões
      const [submissionsData, templatesData, questionsData] = await Promise.all([
        api.submissions.getAll().catch(() => []),
        api.templates.getAll().catch(() => []),
        api.questions.getAll().catch(() => []),
      ]);
      setSubmissions(submissionsData || []);
      setTemplates(templatesData || []);
      setQuestions(questionsData || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      setError(error.message || "Erro ao carregar dados. Tente novamente.");
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
        <Card>
          <CardContent className="py-8 text-center flex flex-col items-center gap-3">
            <Spinner variant="bars" className="w-6 h-6 text-muted-foreground" />
            <p className="text-muted-foreground">Carregando consultas...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive font-medium mb-2">
              Erro ao carregar consultas
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminConsultasWrapper
        submissions={submissions}
        templates={templates}
        questions={questions}
        onSubmissionUpdate={loadData}
      />
    </div>
  );
}
