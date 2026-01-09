'use client';

import { useMemo, useState, useEffect } from 'react';
import { ConsultasDataTable } from './consultas-data-table';
import type { ConsultasFiltersState } from './consultas-filters';
import { apiClient as api } from '@/lib/api-client';

interface Submission {
  _id?: string;
  templateId: string;
  answers: {
    questionId: string;
    answer: string;
  }[];
  submittedAt: Date | string;
  submittedBy: string;
}

interface Template {
  _id?: string;
  title: string;
  description?: string;
}

interface SubmissionWithDetails extends Submission {
  template?: Template;
  templateTitle?: string;
  bancoAnswer?: string | null;
  seguradoraAnswer?: string | null;
  valorAnswer?: string | null;
}

interface ConsultasListProps {
  submissions: Submission[];
  templates: Template[];
  filters: ConsultasFiltersState;
  onSubmissionUpdate?: () => void;
  onBancosChange?: (bancos: string[]) => void;
  onSeguradorasChange?: (seguradoras: string[]) => void;
}

export function ConsultasList({
  submissions,
  templates,
  filters,
  onSubmissionUpdate,
  onBancosChange,
  onSeguradorasChange,
}: ConsultasListProps) {
  const [submissionsWithDetails, setSubmissionsWithDetails] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const enrichSubmissions = async () => {
      try {
        setLoading(true);
        // Buscar questões para encontrar "Valor", "Nome do Cliente", "Banco" e "Seguradora"
        const allQuestions = await api.questions.getAll().catch(() => []);
        const valorQuestion = allQuestions.find((q: any) => q.title === 'Valor');
        const nomeClienteQuestion = allQuestions.find((q: any) => q.title === 'Nome do Cliente');
        const bancoQuestion = allQuestions.find((q: any) => q.title === 'Banco');
        const seguradoraQuestion = allQuestions.find((q: any) => q.title === 'Seguradora');
        
        // Enriquecer submissões com informações do template, valor, nome do cliente, banco e seguradora
        const enriched = submissions.map((submission) => {
          const template = templates.find((t) => t._id === submission.templateId);
          
          // Encontrar resposta da questão "Valor"
          let valorAnswer = null;
          if (valorQuestion?._id) {
            const valorAnswerObj = submission.answers.find(
              (a) => a.questionId === valorQuestion._id
            );
            valorAnswer = valorAnswerObj?.answer || null;
          }
          
          // Encontrar resposta da questão "Nome do Cliente"
          let nomeClienteAnswer = null;
          if (nomeClienteQuestion?._id) {
            const nomeClienteAnswerObj = submission.answers.find(
              (a) => a.questionId === nomeClienteQuestion._id
            );
            nomeClienteAnswer = nomeClienteAnswerObj?.answer || null;
          }
          
          // Encontrar resposta da questão "Banco"
          let bancoAnswer = null;
          if (bancoQuestion?._id) {
            const bancoAnswerObj = submission.answers.find(
              (a) => a.questionId === bancoQuestion._id
            );
            bancoAnswer = bancoAnswerObj?.answer || null;
          }
          
          // Encontrar resposta da questão "Seguradora"
          let seguradoraAnswer = null;
          if (seguradoraQuestion?._id) {
            const seguradoraAnswerObj = submission.answers.find(
              (a) => a.questionId === seguradoraQuestion._id
            );
            seguradoraAnswer = seguradoraAnswerObj?.answer || null;
          }
          
          return {
            ...submission,
            template,
            templateTitle: template?.title || 'Template não encontrado',
            valorQuestionId: valorQuestion?._id,
            valorAnswer: valorAnswer,
            nomeClienteQuestionId: nomeClienteQuestion?._id,
            nomeClienteAnswer: nomeClienteAnswer,
            bancoQuestionId: bancoQuestion?._id,
            bancoAnswer: bancoAnswer,
            seguradoraQuestionId: seguradoraQuestion?._id,
            seguradoraAnswer: seguradoraAnswer,
          };
        });
        setSubmissionsWithDetails(enriched);
      } catch (error) {
        console.error('Error enriching submissions:', error);
        setSubmissionsWithDetails(submissions.map(s => ({ ...s, templateTitle: 'Desconhecido' })));
      } finally {
        setLoading(false);
      }
    };

    if (submissions.length > 0) {
      enrichSubmissions();
    } else {
      setSubmissionsWithDetails([]);
      setLoading(false);
    }
  }, [submissions, templates]);

  // Aplicar filtros
  const filteredSubmissions = useMemo(() => {
    if (loading) return [];

    return submissionsWithDetails.filter((submission) => {
      // Filtro de template
      if (filters.templateId !== 'all') {
        if (submission.templateId !== filters.templateId) {
          return false;
        }
      }

      // Filtro de pesquisa
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTemplate = submission.templateTitle?.toLowerCase().includes(searchLower);
        const matchesAnswers = submission.answers.some((a) =>
          a.answer.toLowerCase().includes(searchLower)
        );
        if (!matchesTemplate && !matchesAnswers) {
          return false;
        }
      }

      // Filtro de banco (igualdade exata)
      if (filters.banco) {
        if (!submission.bancoAnswer || submission.bancoAnswer !== filters.banco) {
          return false;
        }
      }

      // Filtro de seguradora (igualdade exata)
      if (filters.seguradora) {
        if (!submission.seguradoraAnswer || submission.seguradoraAnswer !== filters.seguradora) {
          return false;
        }
      }

      // Filtro de valor (range)
      if (filters.valorMin || filters.valorMax) {
        const valor = submission.valorAnswer ? Number(submission.valorAnswer) : null;
        if (valor === null) {
          return false;
        }
        if (filters.valorMin) {
          const minVal = Number(filters.valorMin);
          if (isNaN(minVal) || valor < minVal) {
            return false;
          }
        }
        if (filters.valorMax) {
          const maxVal = Number(filters.valorMax);
          if (isNaN(maxVal) || valor > maxVal) {
            return false;
          }
        }
      }

      return true;
    });
  }, [submissionsWithDetails, filters, loading]);

  // Coletar valores únicos de banco e seguradora
  const bancosUnicos = useMemo(() => {
    const bancos = new Set<string>();
    submissionsWithDetails.forEach((submission) => {
      if (submission.bancoAnswer && submission.bancoAnswer.trim() !== '') {
        bancos.add(submission.bancoAnswer);
      }
    });
    return Array.from(bancos);
  }, [submissionsWithDetails]);

  const seguradorasUnicas = useMemo(() => {
    const seguradoras = new Set<string>();
    submissionsWithDetails.forEach((submission) => {
      if (submission.seguradoraAnswer && submission.seguradoraAnswer.trim() !== '') {
        seguradoras.add(submission.seguradoraAnswer);
      }
    });
    return Array.from(seguradoras);
  }, [submissionsWithDetails]);

  // Notificar mudanças nos bancos e seguradoras
  useEffect(() => {
    onBancosChange?.(bancosUnicos);
  }, [bancosUnicos, onBancosChange]);

  useEffect(() => {
    onSeguradorasChange?.(seguradorasUnicas);
  }, [seguradorasUnicas, onSeguradorasChange]);

  if (loading) {
    return (
      <div className="space-y-8 py-2">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {filteredSubmissions.length}{' '}
            {filteredSubmissions.length === 1 ? 'formulário encontrado' : 'formulários encontrados'}
          </h2>
        </div>
      </div>

      <ConsultasDataTable 
        submissions={filteredSubmissions} 
        filters={filters}
        onSubmissionUpdate={onSubmissionUpdate}
      />
    </div>
  );
}
