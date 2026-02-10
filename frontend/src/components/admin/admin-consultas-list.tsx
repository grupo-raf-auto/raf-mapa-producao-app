import { useMemo, useState, useEffect } from 'react';
import { ConsultasDataTable } from '../consultas/consultas-data-table';
import type { AdminConsultasFiltersState } from './admin-consultas-filters';
import { apiClient as api } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
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

interface Submission {
  _id?: string;
  templateId: string;
  answers: { questionId: string; answer: string }[];
  submittedAt: Date | string;
  formDate?: string | null;
  submittedBy: string;
}

interface Template {
  _id?: string;
  title: string;
  description?: string;
}

interface Question {
  _id?: string;
  title: string;
  inputType?: string;
}

interface User {
  _id?: string;
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

interface SubmissionWithDetails extends Submission {
  template?: Template;
  templateTitle?: string;
  agentName?: string | null;
  bancoAnswer?: string | null;
  seguradoraAnswer?: string | null;
  valorAnswer?: string | null;
  nomeClienteAnswer?: string | null;
  valorQuestionId?: string;
  nomeClienteQuestionId?: string;
  bancoQuestionId?: string;
  seguradoraQuestionId?: string;
  commissionPaid?: boolean;
}

interface AdminConsultasListProps {
  submissions: Submission[];
  templates: Template[];
  questions: Question[];
  users: User[];
  filters: AdminConsultasFiltersState;
  onSubmissionUpdate?: () => void;
  onQuestionValuesChange?: (values: Record<string, string[]>) => void;
}

export function AdminConsultasList({
  submissions,
  templates,
  questions,
  users,
  filters,
  onSubmissionUpdate,
  onQuestionValuesChange,
}: AdminConsultasListProps) {
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
        const allQuestions = await api.questions.getAll().catch(() => []);
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

        // Enriquecer submissões com informações do template, agente, valor, nome do cliente, banco e seguradora
        const enriched = submissions.map((submission) => {
          const template = templates.find(
            (t) => t._id === submission.templateId,
          );
          const agent = users.find(
            (u) =>
              u.id === submission.submittedBy ||
              u._id === submission.submittedBy,
          );
          const agentName = agent
            ? agent.name ||
              [agent.firstName, agent.lastName].filter(Boolean).join(' ') ||
              agent.email
            : null;

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
            agentName,
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
  }, [submissions, templates, users]);

  // Coletar valores únicos para cada questão
  const questionValues = useMemo(() => {
    const values: Record<string, Set<string>> = {};

    submissionsWithDetails.forEach((submission) => {
      submission.answers.forEach((answer) => {
        if (!values[answer.questionId]) {
          values[answer.questionId] = new Set();
        }
        if (answer.answer && answer.answer.trim() !== '') {
          values[answer.questionId].add(answer.answer);
        }
      });
    });

    const result: Record<string, string[]> = {};
    Object.keys(values).forEach((questionId) => {
      result[questionId] = Array.from(values[questionId]);
    });

    return result;
  }, [submissionsWithDetails]);

  // Notificar mudanças nos valores das questões
  useEffect(() => {
    onQuestionValuesChange?.(questionValues);
  }, [questionValues, onQuestionValuesChange]);

  // Aplicar filtros
  const filteredSubmissions = useMemo(() => {
    if (loading) return [];

    return submissionsWithDetails.filter((submission) => {
      // Filtro de utilizador
      if (filters.userId !== 'all') {
        if (submission.submittedBy !== filters.userId) {
          return false;
        }
      }

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

      // Filtros por questão
      for (const [questionId, filterValue] of Object.entries(
        filters.questionFilters,
      )) {
        if (!filterValue || filterValue === 'all') continue;

        const answer = submission.answers.find(
          (a) => a.questionId === questionId,
        );
        if (!answer) {
          return false;
        }

        const question = questions.find((q) => q._id === questionId);
        const inputType = question?.inputType || 'text';

        // Para select/radio - igualdade exata
        if (inputType === 'select' || inputType === 'radio') {
          if (answer.answer !== filterValue) {
            return false;
          }
        }
        // Para number - comparação numérica
        else if (inputType === 'number') {
          const answerNum = Number(answer.answer);
          const filterNum = Number(filterValue);
          if (isNaN(answerNum) || isNaN(filterNum) || answerNum !== filterNum) {
            return false;
          }
        }
        // Para date - igualdade exata
        else if (inputType === 'date') {
          if (answer.answer !== filterValue) {
            return false;
          }
        }
        // Para text, email, tel - busca parcial (case-insensitive)
        else {
          if (
            !answer.answer.toLowerCase().includes(filterValue.toLowerCase())
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }, [submissionsWithDetails, filters, loading, questions]);

  if (loading) {
    return (
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 sm:py-16 px-4">
          <Spinner variant="bars" className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">A carregar lista de consultas...</p>
        </CardContent>
      </Card>
    );
  }

  // Converter para o formato esperado pelo ConsultasDataTable
  const formattedFilters = {
    templateId: filters.templateId,
    status: 'all' as const,
    inputType: 'all' as const,
    search: filters.search,
    banco: '',
    seguradora: '',
    valorMin: '',
    valorMax: '',
  };

  const handleExportCsv = () => {
    if (filteredSubmissions.length === 0) {
      toast.error('Não há dados para exportar. Aplique filtros ou aguarde o carregamento.');
      return;
    }
    try {
      const rows: ConsultasExportRow[] = filteredSubmissions.map((s) => ({
        templateTitle: s.templateTitle,
        agentName: s.agentName,
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
      toast.error('Não há dados para exportar. Aplique filtros ou aguarde o carregamento.');
      return;
    }
    setExportPdfLoading(true);
    try {
      const rows: ConsultasExportRow[] = filteredSubmissions.map((s) => ({
        templateTitle: s.templateTitle,
        agentName: s.agentName,
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

  return (
    <div className="space-y-4 sm:space-y-8 py-2 min-w-0 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4 min-w-0">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold">
            {filteredSubmissions.length}{' '}
            {filteredSubmissions.length === 1
              ? 'formulário encontrado'
              : 'formulários encontrados'}
          </h2>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl border-teal-600/40 bg-teal-600 text-white shadow-sm hover:bg-teal-700 hover:text-white hover:border-teal-700 focus-visible:ring-teal-500 disabled:opacity-50 disabled:pointer-events-none min-h-[44px] sm:min-h-0 w-full sm:w-auto touch-manipulation"
              disabled={filteredSubmissions.length === 0 || exportPdfLoading}
            >
              <FileDown className="h-4 w-4 shrink-0" aria-hidden />
              <span className="font-medium">Exportar</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40 border-border/80 shadow-lg">
            <DropdownMenuItem onClick={handleExportCsv} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleExportPdf}
              disabled={exportPdfLoading}
              className="gap-2"
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
        filters={formattedFilters}
        onSubmissionUpdate={onSubmissionUpdate}
        showCommissionPaid
      />
    </div>
  );
}
