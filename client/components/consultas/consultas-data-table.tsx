'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale/pt';
import { Spinner } from '@/components/ui/spinner';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
} from 'lucide-react';
import type { ConsultasFiltersState } from './consultas-filters';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { apiClient as api } from '@/lib/api-client';
import { QuestionInput } from '@/components/questions/question-input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Save, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useModal } from '@/lib/contexts/modal-context';
import {
  ColumnDef,
  PaginationState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { usePagination } from '@/components/hooks/use-pagination';
import { cn } from '@/lib/utils';

interface Submission {
  _id?: string;
  templateId: string;
  templateTitle?: string;
  answers: {
    questionId: string;
    answer: string;
  }[];
  submittedAt: Date | string;
  /** Data escolhida pelo utilizador no formulário (campo "Data"); quando existe, usar em vez de submittedAt. */
  formDate?: string | null;
  submittedBy: string;
  commissionPaid?: boolean;
  agentName?: string | null;
  valorQuestionId?: string;
  valorAnswer?: string | null;
  nomeClienteQuestionId?: string;
  nomeClienteAnswer?: string | null;
  bancoQuestionId?: string;
  bancoAnswer?: string | null;
  seguradoraQuestionId?: string;
  seguradoraAnswer?: string | null;
}

interface ConsultasDataTableProps {
  submissions: Submission[];
  filters: ConsultasFiltersState;
  onSubmissionUpdate?: () => void;
  /** Quando true, exibe coluna "Comissão paga" com checkbox (apenas admin) */
  showCommissionPaid?: boolean;
}

export function ConsultasDataTable({
  submissions,
  filters,
  onSubmissionUpdate,
  showCommissionPaid = false,
}: ConsultasDataTableProps) {
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(
    null,
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [questionsData, setQuestionsData] = useState<any[]>([]);
  const [templateData, setTemplateData] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] =
    useState<Submission | null>(null);
  const [updatingCommissionId, setUpdatingCommissionId] = useState<
    string | null
  >(null);
  const [localSubmissions, setLocalSubmissions] =
    useState<Submission[]>(submissions);
  const router = useRouter();
  const { setIsModalOpen } = useModal();

  useEffect(() => {
    setLocalSubmissions(submissions);
  }, [submissions]);

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'displayDate', desc: true },
  ]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Atualizar estado do modal quando o dialog abrir/fechar
  useEffect(() => {
    setIsModalOpen(isViewDialogOpen);
  }, [isViewDialogOpen, setIsModalOpen]);

  // Resetar para página 1 quando os dados mudarem
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [submissions.length, filters]);

  const handleView = async (submission: Submission) => {
    setViewingSubmission(submission);
    setIsViewDialogOpen(true);
    setIsEditing(false);
    setLoadingDetails(true);

    try {
      const [templates, allQuestions] = await Promise.all([
        api.templates.getAll().catch(() => []),
        api.questions.getAll().catch(() => []),
      ]);

      const templatesList = Array.isArray(templates) ? templates : [];
      const questionsList = Array.isArray(allQuestions) ? allQuestions : [];

      const template = templatesList.find(
        (t: any) => t._id === submission.templateId,
      );
      setTemplateData(template);

      if (template?.questions) {
        const questions = template.questions
          .map((qId: string) => questionsList.find((q: any) => q._id === qId))
          .filter(Boolean);
        setQuestionsData(questions);

        const initialAnswers: Record<string, string> = {};
        submission.answers.forEach((answer) => {
          initialAnswers[answer.questionId] = answer.answer;
        });
        setEditedAnswers(initialAnswers);
      }
    } catch (error) {
      console.error('Error loading submission details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (viewingSubmission) {
      const initialAnswers: Record<string, string> = {};
      viewingSubmission.answers.forEach((answer) => {
        initialAnswers[answer.questionId] = answer.answer;
      });
      setEditedAnswers(initialAnswers);
    }
  };

  const handleSave = async () => {
    if (!viewingSubmission?._id) return;

    setSaving(true);
    try {
      const originalAnswersMap = new Map(
        viewingSubmission.answers.map((a) => [a.questionId, a.answer]),
      );

      Object.entries(editedAnswers).forEach(([questionId, answer]) => {
        if (answer !== undefined && answer !== null) {
          originalAnswersMap.set(questionId, String(answer));
        }
      });

      const answers = Array.from(originalAnswersMap.entries()).map(
        ([questionId, answer]) => ({
          questionId,
          answer: String(answer),
        }),
      );

      const updatedSubmission = await api.submissions.update(
        viewingSubmission._id,
        { answers },
      );

      if (!updatedSubmission || !updatedSubmission.answers) {
        const fetchedSubmission = await api.submissions.getById(
          viewingSubmission._id,
        );
        setViewingSubmission(fetchedSubmission);

        const updatedAnswers: Record<string, string> = {};
        fetchedSubmission.answers.forEach(
          (answer: { questionId: string; answer: string }) => {
            updatedAnswers[answer.questionId] = answer.answer;
          },
        );
        setEditedAnswers(updatedAnswers);
      } else {
        setViewingSubmission(updatedSubmission);

        const updatedAnswers: Record<string, string> = {};
        updatedSubmission.answers.forEach(
          (answer: { questionId: string; answer: string }) => {
            updatedAnswers[answer.questionId] = answer.answer;
          },
        );
        setEditedAnswers(updatedAnswers);
      }

      setIsEditing(false);
      toast.success('Formulário atualizado com sucesso!');

      if (onSubmissionUpdate) {
        onSubmissionUpdate();
      } else {
        router.refresh();
      }
    } catch (error: any) {
      console.error('Error saving submission:', error);
      toast.error(
        error?.message || 'Erro ao salvar alterações. Tente novamente.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setEditedAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleDeleteClick = (submission: Submission) => {
    setSubmissionToDelete(submission);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    const submission = submissionToDelete || viewingSubmission;
    if (!submission?._id) {
      console.error('No submission ID available for deletion');
      return;
    }

    const submissionId = submission._id;
    setDeleting(true);

    try {
      await api.submissions.delete(submissionId);
      setDeleteDialogOpen(false);

      // Se estava visualizando o mesmo submission, fechar o modal
      if (viewingSubmission?._id === submissionId) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setIsViewDialogOpen(false);
        setIsModalOpen(false);
        setIsEditing(false);
        setViewingSubmission(null);
      }

      setSubmissionToDelete(null);
      toast.success('Formulário removido com sucesso!');

      setTimeout(() => {
        if (onSubmissionUpdate) {
          onSubmissionUpdate();
        } else {
          router.refresh();
        }
      }, 200);
    } catch (error: any) {
      console.error('Error deleting submission:', error);
      const errorMessage =
        error?.message || 'Erro ao remover formulário. Tente novamente.';
      toast.error(errorMessage);
      setDeleting(false);
    }
  };

  const handleCommissionPaidChange = useCallback(
    async (submission: Submission, checked: boolean) => {
      const id = submission._id;
      if (!id) return;
      setUpdatingCommissionId(id);
      try {
        await api.submissions.update(id, { commissionPaid: checked });
        setLocalSubmissions((prev) =>
          prev.map((s) =>
            s._id === id ? { ...s, commissionPaid: checked } : s,
          ),
        );
        toast.success('Comissão atualizada.', { duration: 2000 });
      } catch (error: any) {
        toast.error(
          error?.message ||
            'Erro ao atualizar estado da comissão. Tente novamente.',
        );
      } finally {
        setUpdatingCommissionId(null);
      }
    },
    [],
  );

  const columns: ColumnDef<Submission>[] = useMemo(
    () => [
      {
        header: 'Template',
        accessorKey: 'templateTitle',
        cell: ({ row }) => (
          <div className="font-medium">
            {row.getValue('templateTitle') || 'Template não encontrado'}
          </div>
        ),
      },
      ...(showCommissionPaid
        ? [
            {
              header: 'Agente',
              id: 'agentName',
              accessorKey: 'agentName',
              cell: ({ row }: { row: { original: Submission } }) => {
                const value = row.original.agentName;
                return value ? (
                  <span className="text-foreground">{value}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                );
              },
            } as ColumnDef<Submission>,
          ]
        : []),
      {
        header: 'Nome do Cliente',
        accessorKey: 'nomeClienteAnswer',
        cell: ({ row }) => {
          const value = row.getValue('nomeClienteAnswer') as string;
          return value || <span className="text-muted-foreground">-</span>;
        },
      },
      {
        header: 'Banco',
        accessorKey: 'bancoAnswer',
        cell: ({ row }) => {
          const value = row.getValue('bancoAnswer') as string;
          return value || <span className="text-muted-foreground">-</span>;
        },
      },
      {
        header: 'Seguradora',
        accessorKey: 'seguradoraAnswer',
        cell: ({ row }) => {
          const value = row.getValue('seguradoraAnswer') as string;
          return value || <span className="text-muted-foreground">-</span>;
        },
      },
      {
        header: 'Valor',
        accessorKey: 'valorAnswer',
        sortingFn: (rowA, rowB, columnId) => {
          const a = Number(rowA.getValue(columnId));
          const b = Number(rowB.getValue(columnId));
          if (Number.isNaN(a) && Number.isNaN(b)) return 0;
          if (Number.isNaN(a)) return 1;
          if (Number.isNaN(b)) return -1;
          return a - b;
        },
        cell: ({ row }) => {
          const value = row.getValue('valorAnswer') as string;
          if (value) {
            return (
              <span className="font-medium">
                {Number(value).toLocaleString('pt-PT', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            );
          }
          return <span className="text-muted-foreground">-</span>;
        },
      },
      {
        header: 'Data',
        id: 'displayDate',
        accessorFn: (row: Submission) => {
          const raw = row.formDate || row.submittedAt;
          return typeof raw === 'string' ? raw : new Date(raw).toISOString();
        },
        sortingFn: (rowA, rowB, columnId) => {
          const a = new Date(rowA.getValue(columnId) as string).getTime();
          const b = new Date(rowB.getValue(columnId) as string).getTime();
          return a - b;
        },
        cell: ({ row }) => {
          const submission = row.original;
          const dateStr = submission.formDate || submission.submittedAt;
          const date = new Date(dateStr);
          return (
            <time dateTime={date.toISOString().slice(0, 10)}>
              {format(date, 'dd/MM/yyyy')}
            </time>
          );
        },
      },
      {
        header: 'Ações',
        id: 'actions',
        cell: ({ row }) => {
          const submission = row.original;
          const isUpdating =
            showCommissionPaid && submission._id === updatingCommissionId;
          return (
            <div className="flex items-center gap-2">
              {showCommissionPaid && (
                <>
                  {isUpdating ? (
                    <Spinner
                      variant="bars"
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  ) : (
                    <Checkbox
                      checked={Boolean(submission.commissionPaid)}
                      disabled={isUpdating}
                      onCheckedChange={(value) =>
                        handleCommissionPaidChange(submission, value === true)
                      }
                      aria-label={
                        submission.commissionPaid
                          ? 'Comissão paga'
                          : 'Comissão não paga'
                      }
                      className="rounded border-green-600 shrink-0 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      title="Comissão paga"
                    />
                  )}
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(submission)}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">Ver formulário</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(submission)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remover formulário</span>
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [showCommissionPaid, updatingCommissionId, handleCommissionPaidChange],
  );

  const table = useReactTable({
    data: localSubmissions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  });

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 5,
  });

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-b border-border/50"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 px-4 align-middle font-semibold text-foreground text-left"
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        role="button"
                        className={cn(
                          header.column.getCanSort() &&
                            'inline-flex cursor-pointer select-none items-center gap-1.5',
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                          if (
                            header.column.getCanSort() &&
                            (e.key === 'Enter' || e.key === ' ')
                          ) {
                            e.preventDefault();
                            header.column.getToggleSortingHandler()?.(e);
                          }
                        }}
                        tabIndex={header.column.getCanSort() ? 0 : undefined}
                        title={
                          header.column.getIsSorted() === 'asc'
                            ? 'Ordenação ascendente. Clique para alterar.'
                            : header.column.getIsSorted() === 'desc'
                              ? 'Ordenação descendente. Clique para alterar.'
                              : 'Clique para ordenar'
                        }
                        aria-label={
                          header.column.getIsSorted() === 'asc'
                            ? 'Ordenação ascendente'
                            : header.column.getIsSorted() === 'desc'
                              ? 'Ordenação descendente'
                              : 'Ordenar coluna'
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: (
                            <ChevronUp
                              className="shrink-0 opacity-70"
                              size={16}
                              strokeWidth={2}
                              aria-hidden
                            />
                          ),
                          desc: (
                            <ChevronDown
                              className="shrink-0 opacity-70"
                              size={16}
                              strokeWidth={2}
                              aria-hidden
                            />
                          ),
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-muted/30 transition-colors border-b border-border/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum formulário encontrado com os filtros aplicados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:gap-3">
        <p
          className="flex-1 whitespace-nowrap text-sm text-muted-foreground"
          aria-live="polite"
        >
          Página{' '}
          <span className="font-medium text-foreground">
            {table.getState().pagination.pageIndex + 1}
          </span>{' '}
          de{' '}
          <span className="font-medium text-foreground">
            {table.getPageCount()}
          </span>
        </p>

        <div className="grow">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Ir para página anterior"
                >
                  <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                </Button>
              </PaginationItem>

              {showLeftEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {pages.map((page) => {
                const isActive =
                  page === table.getState().pagination.pageIndex + 1;
                return (
                  <PaginationItem key={page}>
                    <Button
                      size="icon"
                      variant={isActive ? 'outline' : 'ghost'}
                      onClick={() => table.setPageIndex(page - 1)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                );
              })}

              {showRightEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Ir para próxima página"
                >
                  <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        <div className="flex flex-1 justify-end">
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
            aria-label="Resultados por página"
          >
            <SelectTrigger
              id="results-per-page"
              className="w-fit whitespace-nowrap bg-background border-border"
            >
              <SelectValue placeholder="Selecionar número de resultados" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize} por página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modal de visualização/edição */}
      {viewingSubmission && (
        <Dialog
          open={isViewDialogOpen}
          onOpenChange={(open) => {
            setIsViewDialogOpen(open);
            setIsModalOpen(open);
            if (!open) {
              setIsEditing(false);
              setViewingSubmission(null);
            }
          }}
        >
          <DialogContent
            className="!max-w-[90vw] !w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden !z-[200] max-h-[90vh]"
            overlayClassName="!z-[150]"
          >
            <div className="px-6 pt-6 pb-4 shrink-0 border-b">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {templateData?.title || 'Formulário'}
                </DialogTitle>
                <DialogDescription>
                  {templateData?.description || 'Sem descrição'}
                </DialogDescription>
                <p className="text-xs text-muted-foreground mt-2">
                  {viewingSubmission.formDate
                    ? `Data do registo: ${format(
                        new Date(viewingSubmission.formDate),
                        "dd 'de' MMMM 'de' yyyy",
                        { locale: pt },
                      )}`
                    : `Submetido em ${format(
                        new Date(viewingSubmission.submittedAt),
                        "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                        { locale: pt },
                      )}`}
                </p>
              </DialogHeader>
              {!isEditing && !loadingDetails && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                </div>
              )}
            </div>

            {loadingDetails ? (
              <div className="flex-1 flex items-center justify-center gap-3">
                <Spinner
                  variant="bars"
                  className="w-5 h-5 text-muted-foreground"
                />
                <p className="text-muted-foreground">Carregando detalhes...</p>
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  {questionsData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma questão encontrada
                    </div>
                  ) : (
                    <form className="space-y-8">
                      {(() => {
                        // Agrupar questões por seções lógicas
                        const clientSection = questionsData.filter((q) => {
                          const title = q.title?.toLowerCase() || '';
                          return (
                            title.includes('cliente') ||
                            title.includes('nome') ||
                            title.includes('email') ||
                            title.includes('telefone') ||
                            title.includes('nascimento') ||
                            title.includes('distrito')
                          );
                        });

                        const financialSection = questionsData.filter((q) => {
                          const title = q.title?.toLowerCase() || '';
                          return (
                            title.includes('valor') ||
                            title.includes('banco') ||
                            title.includes('seguradora') ||
                            title.includes('fracionamento')
                          );
                        });

                        const generalSection = questionsData.filter((q) => {
                          const title = q.title?.toLowerCase() || '';
                          return (
                            !title.includes('cliente') &&
                            !title.includes('nome') &&
                            !title.includes('email') &&
                            !title.includes('telefone') &&
                            !title.includes('nascimento') &&
                            !title.includes('distrito') &&
                            !title.includes('valor') &&
                            !title.includes('banco') &&
                            !title.includes('seguradora') &&
                            !title.includes('fracionamento')
                          );
                        });

                        const sections = [
                          {
                            title: 'Informações do Cliente',
                            description:
                              'Dados pessoais e de contacto do cliente',
                            questions: clientSection,
                          },
                          {
                            title: 'Informações Financeiras',
                            description: 'Detalhes financeiros e bancários',
                            questions: financialSection,
                          },
                          {
                            title: 'Informações Gerais',
                            description: 'Outras informações relevantes',
                            questions: generalSection,
                          },
                        ].filter((section) => section.questions.length > 0);

                        return sections.map((section, sectionIndex) => (
                          <div key={sectionIndex} className="space-y-4">
                            <div>
                              <h3 className="text-base font-semibold text-foreground">
                                {section.title}
                              </h3>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {section.description}
                              </p>
                            </div>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                              {section.questions.map((question, index) => {
                                const answer = isEditing
                                  ? editedAnswers[question._id || '']
                                  : viewingSubmission.answers.find(
                                      (a) => a.questionId === question._id,
                                    )?.answer;

                                if (!question._id) return null;

                                return (
                                  <div
                                    key={question._id || index}
                                    className="space-y-2"
                                  >
                                    <Label
                                      htmlFor={`question-${question._id}`}
                                      className="text-sm font-medium text-foreground"
                                    >
                                      {question.title}
                                      {question.description && (
                                        <span className="block text-xs font-normal text-muted-foreground mt-1">
                                          {question.description}
                                        </span>
                                      )}
                                    </Label>
                                    {isEditing ? (
                                      <div className="mt-2">
                                        <QuestionInput
                                          question={question}
                                          value={answer || ''}
                                          onChange={(value) =>
                                            handleAnswerChange(
                                              question._id || '',
                                              value,
                                            )
                                          }
                                        />
                                      </div>
                                    ) : (
                                      <div className="mt-2">
                                        <p className="text-sm text-foreground bg-muted/50 border border-border rounded-md p-3 min-h-[40px] flex items-center">
                                          {answer || (
                                            <span className="text-muted-foreground italic">
                                              Sem resposta
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {sectionIndex < sections.length - 1 && (
                              <Separator className="my-6" />
                            )}
                          </div>
                        ));
                      })()}
                    </form>
                  )}
                </div>
                {isEditing && (
                  <>
                    <Separator className="my-0" />
                    <div className="px-6 pb-6 pt-4 shrink-0 bg-background flex items-center justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="whitespace-nowrap"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="whitespace-nowrap"
                      >
                        {saving ? (
                          <>
                            <span className="mr-2">Salvando...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!deleting) {
            setDeleteDialogOpen(open);
            if (!open) {
              setSubmissionToDelete(null);
            }
          }
        }}
      >
        <AlertDialogContent className="z-[300]">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este formulário? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              onClick={() => {
                if (!deleting) {
                  setDeleteDialogOpen(false);
                  setSubmissionToDelete(null);
                }
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
