'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { QuestionInput } from '@/components/questions/question-input';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

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
      schemaFields[fieldId] = z.string().min(1, 'Data é obrigatória');
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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

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
        })
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
        const hasLoadedQuestions = questionsData.some(q => q !== null);
        if (hasLoadedQuestions) {
          toast.warning('Nenhuma questão válida encontrada neste template');
        } else {
          toast.error('Erro ao carregar questões do template. Verifique se o servidor está rodando.');
        }
      } else {
        // Log para debug - remover depois
        console.log(`Loaded ${validQuestions.length} questions for template ${template._id}`);
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

  // Resetar form quando questões mudarem
  useEffect(() => {
    if (questions.length > 0) {
      const defaultValues: Record<string, string> = {};
      questions.forEach((q) => {
        defaultValues[q._id || ''] = '';
      });
      form.reset(defaultValues);
    }
  }, [questions]);

  const onSubmit = async (data: FormValues) => {
    if (!template?._id) return;

    setSubmitting(true);
    try {
      // Transformar dados para FormSubmission
      const answers = Object.entries(data)
        .filter(
          ([, value]) => value !== '' && value !== undefined && value !== null
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
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Erro ao submeter formulário. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden">
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
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col h-full overflow-hidden"
            >
              {/* ScrollArea para muitas questões */}
              <div className="flex-1 overflow-hidden px-6">
                <ScrollArea className="h-full w-full">
                  <div className="space-y-6 py-4 pr-4">
                    {questions.map((question, index) => (
                      <div key={question._id}>
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
                                  question={question}
                                  value={
                                    field.value as string | Date | undefined
                                  }
                                  onChange={field.onChange}
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
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <DialogFooter className="px-6 pb-6 pt-4 border-t shrink-0">
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
