import { useMemo, useState, useEffect } from 'react';
import { ConsultasDataTable } from './consultas-data-table';
import type { ConsultasFiltersState } from './consultas-filters';
import { apiClient as api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import {
  exportConsultasToCsv,
  exportConsultasToPdf,
  type ConsultasExportRow,
} from '@/lib/export-consultas';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

interface Submission {
  _id?: string;
  templateId: string;
  answers: {
    questionId: string;
    answer: string;
  }[];
  submittedAt: Date | string;
  formDate?: string | null;
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
  nomeClienteAnswer?: string | null;
  bancoAnswer?: string | null;
  seguradoraAnswer?: string | null;
  valorAnswer?: string | null;
  commissionPaid?: boolean;
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
  const [submissionsWithDetails, setSubmissionsWithDetails] = useState<
    SubmissionWithDetails[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [exportPdfLoading, setExportPdfLoading] = useState(false);

  useEffect(() => {
    const enrichSubmissions = async () => {
      try {
        setLoading(true);
        // Buscar questões para encontrar "Valor", "Nome do Cliente", "Banco" e "Seguradora"
        // api.questions.getAll() já retorna array (unwrapped pelo api-client)
        const questionsResponse = await api.questions.getAll().catch(() => []);
        const allQuestions = Array.isArray(questionsResponse)
          ? questionsResponse
          : [];

        const valorQuestion = allQuestions.find(
          (q: any) => q.title === 'Valor',
        );
        const nomeClienteQuestion = allQuestions.find(
          (q: any) => q.title === 'Nome do Cliente',
        );
        const bancoQuestion = allQuestions.find(
          (q: any) => q.title === 'Banco',
        );
        const seguradoraQuestion = allQuestions.find(
          (q: any) => q.title === 'Seguradora',
        );

        // Enriquecer submissões com informações do template, valor, nome do cliente, banco e seguradora
        const enriched = submissions.map((submission) => {
          const template = templates.find(
            (t) => t._id === submission.templateId,
          );

          // Encontrar resposta da questão "Valor"
          let valorAnswer = null;
          if (valorQuestion?._id) {
            const valorAnswerObj = submission.answers.find(
              (a) => a.questionId === valorQuestion._id,
            );
            valorAnswer = valorAnswerObj?.answer || null;
          }

          // Encontrar resposta da questão "Nome do Cliente"
          let nomeClienteAnswer = null;
          if (nomeClienteQuestion?._id) {
            const nomeClienteAnswerObj = submission.answers.find(
              (a) => a.questionId === nomeClienteQuestion._id,
            );
            nomeClienteAnswer = nomeClienteAnswerObj?.answer || null;
          }

          // Encontrar resposta da questão "Banco"
          let bancoAnswer = null;
          if (bancoQuestion?._id) {
            const bancoAnswerObj = submission.answers.find(
              (a) => a.questionId === bancoQuestion._id,
            );
            bancoAnswer = bancoAnswerObj?.answer || null;
          }

          // Encontrar resposta da questão "Seguradora"
          let seguradoraAnswer = null;
          if (seguradoraQuestion?._id) {
            const seguradoraAnswerObj = submission.answers.find(
              (a) => a.questionId === seguradoraQuestion._id,
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
        setSubmissionsWithDetails(
          submissions.map((s) => ({ ...s, templateTitle: 'Desconhecido' })),
        );
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
        const matchesTemplate = submission.templateTitle
          ?.toLowerCase()
          .includes(searchLower);
        const matchesAnswers = submission.answers.some((a) =>
          a.answer.toLowerCase().includes(searchLower),
        );
        if (!matchesTemplate && !matchesAnswers) {
          return false;
        }
      }

      // Filtro de banco (igualdade exata)
      if (filters.banco) {
        if (
          !submission.bancoAnswer ||
          submission.bancoAnswer !== filters.banco
        ) {
          return false;
        }
      }

      // Filtro de seguradora (igualdade exata)
      if (filters.seguradora) {
        if (
          !submission.seguradoraAnswer ||
          submission.seguradoraAnswer !== filters.seguradora
        ) {
          return false;
        }
      }

      // Filtro de valor (range)
      if (filters.valorMin || filters.valorMax) {
        const valor = submission.valorAnswer
          ? Number(submission.valorAnswer)
          : null;
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
      if (
        submission.seguradoraAnswer &&
        submission.seguradoraAnswer.trim() !== ''
      ) {
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

  const handleExportCsv = () => {
    if (filteredSubmissions.length === 0) {
      toast.error(
        'Não há dados para exportar. Aplique filtros ou aguarde o carregamento.',
      );
      return;
    }
    try {
      const rows: ConsultasExportRow[] = filteredSubmissions.map((s) => ({
        templateTitle: s.templateTitle,
        agentName: null,
        nomeClienteAnswer: s.nomeClienteAnswer,
        bancoAnswer: s.bancoAnswer,
        seguradoraAnswer: s.seguradoraAnswer,
        valorAnswer: s.valorAnswer,
        formDate: s.formDate,
        submittedAt: s.submittedAt,
        commissionPaid: s.commissionPaid,
      }));
      exportConsultasToCsv(rows);
      toast.success('Exportação CSV concluída.');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao exportar CSV.');
    }
  };

  const handleExportPdf = () => {
    if (filteredSubmissions.length === 0) {
      toast.error(
        'Não há dados para exportar. Aplique filtros ou aguarde o carregamento.',
      );
      return;
    }
    setExportPdfLoading(true);
    try {
      const rows: ConsultasExportRow[] = filteredSubmissions.map((s) => ({
        templateTitle: s.templateTitle,
        agentName: null,
        nomeClienteAnswer: s.nomeClienteAnswer,
        bancoAnswer: s.bancoAnswer,
        seguradoraAnswer: s.seguradoraAnswer,
        valorAnswer: s.valorAnswer,
        formDate: s.formDate,
        submittedAt: s.submittedAt,
        commissionPaid: s.commissionPaid,
      }));
      exportConsultasToPdf(rows);
      toast.success('Exportação PDF concluída.');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao exportar PDF.');
    } finally {
      setExportPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 py-2">
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
          <Spinner variant="bars" className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-3">A carregar consultas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 py-2">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">
          {filteredSubmissions.length}{' '}
          {filteredSubmissions.length === 1 ? 'formulário encontrado' : 'formulários encontrados'}
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl border-teal-600/40 bg-teal-600 text-white shadow-sm hover:bg-teal-700 hover:text-white hover:border-teal-700 focus-visible:ring-teal-500 disabled:opacity-50 disabled:pointer-events-none w-full sm:w-auto min-h-[44px] sm:min-h-0 touch-manipulation"
              disabled={filteredSubmissions.length === 0 || exportPdfLoading}
            >
              <FileDown className="h-4 w-4 shrink-0" aria-hidden />
              <span className="font-medium">Exportar</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44 rounded-xl border-border/80 shadow-lg">
            <DropdownMenuItem onClick={handleExportCsv} className="gap-2 rounded-lg">
              <FileSpreadsheet className="h-4 w-4" />
              Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleExportPdf}
              disabled={exportPdfLoading}
              className="gap-2 rounded-lg"
            >
              {exportPdfLoading ? (
                <Spinner variant="bars" className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {exportPdfLoading ? 'A exportar...' : 'Exportar PDF'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConsultasDataTable
        submissions={filteredSubmissions}
        filters={filters}
        onSubmissionUpdate={onSubmissionUpdate}
      />
    </div>
  );
}
