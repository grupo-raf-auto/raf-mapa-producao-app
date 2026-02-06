'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from '@/lib/router-compat';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient as api } from '@/lib/api-client';
import { useSession } from '@/lib/auth-client';
import { QuestionInput } from '@/components/questions/question-input';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

/** Título da questão "Agente" – preenchido com o nome do utilizador logado */
const AGENT_QUESTION_TITLE = 'Agente';

/** Nome completo: nome + apelido (ou name/email como fallback) */
function getDisplayName(
  user:
    | {
        name?: string | null;
        firstName?: string;
        lastName?: string;
        email?: string;
      }
    | null
    | undefined,
): string {
  if (!user) return '';
  const u = user as { firstName?: string; lastName?: string };
  const first = u.firstName?.trim() ?? '';
  const last = u.lastName?.trim() ?? '';
  const full = [first, last].filter(Boolean).join(' ').trim();
  return full || user.name || user.email || '';
}

interface Template {
  _id?: string;
  title: string;
  description?: string;
  questions: string[]; // Question IDs
}

interface Question {
  _id?: string;
  title: string;
  description?: string;
  status: string;
  inputType?: 'text' | 'date' | 'select' | 'email' | 'tel' | 'number' | 'radio';
  options?: string[];
}

interface FillTemplateDialogProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Verifica se a data (string YYYY-MM-DD ou parseável) é futura (após hoje). */
function isFutureDate(dateStr: string): boolean {
  if (!dateStr || !String(dateStr).trim()) return false;
  const d = new Date(String(dateStr).trim());
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return d.getTime() > today.getTime();
}

// Gerar schema dinamicamente baseado nas questões
function generateSchema(questions: Question[]) {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  questions.forEach((question) => {
    const fieldId = question._id || '';

    if (question.inputType === 'number') {
      schemaFields[fieldId] = z.coerce
        .number()
        .min(0, 'Valor deve ser positivo')
        .optional()
        .or(z.literal(''));
    } else if (question.inputType === 'email') {
      schemaFields[fieldId] = z
        .string()
        .email('Email inválido')
        .optional()
        .or(z.literal(''));
    } else if (question.inputType === 'date') {
      schemaFields[fieldId] = z
        .string()
        .min(1, 'Data é obrigatória')
        .refine(
          (val) => !isFutureDate(val),
          'A data não pode ser uma data futura',
        );
    } else if (
      question.inputType === 'select' ||
      question.inputType === 'radio'
    ) {
      schemaFields[fieldId] = z.string().min(1, 'Selecione uma opção');
    } else {
      schemaFields[fieldId] = z
        .string()
        .min(1, `${question.title} é obrigatório`);
    }
  });

  return z.object(schemaFields);
}

export function FillTemplateDialog({
  template,
  open,
  onOpenChange,
}: FillTemplateDialogProps) {
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const agentDisplayName = getDisplayName(session?.user);

  // Carregar questões do template
  const loadQuestions = useCallback(async () => {
    if (!template?.questions || template.questions.length === 0) {
      setQuestions([]);
      return;
    }

    setLoading(true);
    try {
      const questionsData = await Promise.all(
        template.questions.map(async (id) => {
          if (!id) return null;
          try {
            return await api.questions.getById(id);
          } catch (err) {
            console.error(`Error loading question ${id}:`, err);
            return null;
          }
        }),
      );

      // Filtrar questões válidas, ordenar pela ordem do template
      // Mostrar todas as questões válidas (não apenas ativas) para debug
      const validQuestions = questionsData
        .filter((q): q is Question => {
          return q !== null && q !== undefined;
        })
        .sort((a, b) => {
          const indexA = template.questions.indexOf(a._id || '');
          const indexB = template.questions.indexOf(b._id || '');
          return indexA - indexB;
        });

      setQuestions(validQuestions);

      if (validQuestions.length === 0) {
        const hasLoadedQuestions = questionsData.some((q) => q !== null);
        if (hasLoadedQuestions) {
          toast.warning('Nenhuma questão válida encontrada neste template');
        } else {
          toast.error(
            'Erro ao carregar questões do template. Verifique se o servidor está rodando.',
          );
        }
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Erro ao carregar questões. Tente novamente.');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [template]);

  useEffect(() => {
    if (open && template) {
      loadQuestions();
    } else if (!open) {
      // Resetar quando fechar
      setQuestions([]);
    }
  }, [open, template, loadQuestions]);

  // Gerar schema dinâmico
  const formSchema = useMemo(() => generateSchema(questions), [questions]);
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  // Resetar form quando questões mudarem; campo "Agente" com nome do utilizador logado
  useEffect(() => {
    if (questions.length > 0) {
      const defaultValues: Record<string, string> = {};
      questions.forEach((q) => {
        const id = q._id || '';
        const title = (q.title || '').trim();
        const isAgente =
          title.toLowerCase() === AGENT_QUESTION_TITLE.toLowerCase();
        defaultValues[id] = isAgente ? agentDisplayName : '';
      });
      form.reset(defaultValues);
    }
  }, [questions, agentDisplayName]);

  const onSubmit = async (data: FormValues) => {
    if (!template?._id) return;

    setSubmitting(true);
    try {
      // Transformar dados para FormSubmission
      const answers = Object.entries(data)
        .filter(
          ([, value]) => value !== '' && value !== undefined && value !== null,
        )
        .map(([questionId, answer]) => ({
          questionId,
          answer: String(answer),
        }));

      if (answers.length === 0) {
        toast.error('Por favor, preencha pelo menos um campo');
        setSubmitting(false);
        return;
      }

      await api.submissions.create({
        templateId: template._id,
        answers,
      });

      // Fechar dialog e resetar form
      form.reset();
      onOpenChange(false);
      router.refresh();

      // Mostrar mensagem de sucesso
      toast.success('Formulário submetido com sucesso!');
    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      const message = error instanceof Error ? error.message : null;
      toast.error(
        message && message !== 'Redirecting to login'
          ? message
          : 'Erro ao submeter formulário. Tente novamente.',
      );
      if (message && /data.*futura|futura.*data/i.test(message)) {
        const dataQuestion = questions.find(
          (q) =>
            q.inputType === 'date' ||
            (q.title || '').trim().toLowerCase() === 'data',
        );
        if (dataQuestion?._id) {
          requestAnimationFrame(() => {
            const el = document.querySelector(
              `[data-question-id="${dataQuestion._id}"]`,
            ) as HTMLElement | null;
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogHeader>
            <DialogTitle>{template.title}</DialogTitle>
            {template.description && (
              <DialogDescription>{template.description}</DialogDescription>
            )}
          </DialogHeader>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 px-6 flex-1">
            <Spinner variant="bars" className="w-6 h-6 text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Carregando questões...
            </span>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex items-center justify-center py-12 px-6 flex-1">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                {template.questions && template.questions.length > 0
                  ? 'Nenhuma questão ativa encontrada neste template'
                  : 'Este template não possui questões'}
              </p>
              {template.questions && template.questions.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Verifique se as questões estão ativas
                </p>
              )}
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (errors) => {
                const firstErrorField = Object.keys(errors)[0];
                if (firstErrorField) {
                  toast.warning(
                    'Corrija os erros assinalados nos campos abaixo.',
                  );
                  requestAnimationFrame(() => {
                    const el = document.querySelector(
                      `[data-question-id="${firstErrorField}"]`,
                    ) as HTMLElement | null;
                    if (el) {
                      el.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                      });
                      const focusable = el.querySelector<HTMLElement>(
                        'input:not([type="hidden"]), select, [role="combobox"], button[type="button"]',
                      );
                      focusable?.focus({ preventScroll: true });
                    }
                  });
                }
              })}
              className="flex flex-col h-full overflow-hidden"
            >
              {/* ScrollArea para muitas questões */}
              <div className="flex-1 overflow-hidden px-6">
                <ScrollArea className="h-full w-full px-2">
                  <div className="space-y-6 py-4 pr-4">
                    {questions.map((question, index) => {
                      const isAgenteQuestion =
                        (question.title || '').trim().toLowerCase() ===
                        AGENT_QUESTION_TITLE.toLowerCase();
                      // Campo Agente: sempre input de texto com nome do utilizador logado (sem dropdown)
                      const questionForInput = isAgenteQuestion
                        ? {
                            ...question,
                            inputType: 'text' as const,
                            options: undefined,
                          }
                        : question;
                      const questionId = question._id || `question-${index}`;
                      return (
                        <div
                          key={questionId}
                          data-question-id={question._id || ''}
                        >
                          <FormField
                            control={form.control}
                            name={question._id || ''}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-medium">
                                  {question.title}
                                </FormLabel>

                                <FormControl>
                                  <QuestionInput
                                    question={questionForInput}
                                    value={
                                      field.value as string | Date | undefined
                                    }
                                    onChange={field.onChange}
                                    disabled={isAgenteQuestion}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {index < questions.length - 1 && (
                            <Separator className="mt-6" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              <DialogFooter className="px-6 py-6 border-t shrink-0 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    onOpenChange(false);
                  }}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Spinner variant="bars" className="w-4 h-4 mr-2" />
                      Submetendo...
                    </>
                  ) : (
                    'Submeter'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
