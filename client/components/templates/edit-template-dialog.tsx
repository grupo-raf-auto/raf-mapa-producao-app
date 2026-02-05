'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient as api } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TemplateQuestionsEditor,
  type QuestionEntry,
  type QuestionFromApi,
} from '@/components/templates/template-questions-editor';
import { Spinner } from '@/components/ui/spinner';

const MODEL_ALL = '__all__';
const MODEL_OPTIONS = [
  { value: MODEL_ALL, label: 'Todos os modelos' },
  { value: 'credito', label: 'Crédito' },
  { value: 'imobiliaria', label: 'Imobiliária' },
  { value: 'seguro', label: 'Seguros' },
] as const;

const templateSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  modelType: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface QuestionFromApiWithId extends QuestionFromApi {
  _id?: string;
}

interface Template {
  _id?: string;
  title: string;
  description?: string;
  modelType?: string | null;
  questions: string[];
  _questions?: QuestionFromApiWithId[];
  isDefault?: boolean;
}

interface EditTemplateDialogProps {
  template: Template;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const questionOrder = [
  'Data',
  'Apontador',
  'Agente',
  'Nome do Cliente',
  'Data nascimento',
  'Email cliente',
  'Telefone cliente',
  'Distrito cliente',
  'Rating cliente',
  'Seguradora',
  'Banco',
  'Valor',
  'Fracionamento',
];

function sortQuestions(questions: QuestionFromApi[]): QuestionFromApi[] {
  const unique = questions.filter(
    (q, i, arr) => i === arr.findIndex((t) => t.title === q.title),
  );
  return unique.sort((a, b) => {
    const ia = questionOrder.indexOf(a.title);
    const ib = questionOrder.indexOf(b.title);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.title.localeCompare(b.title);
  });
}

function templateToEntries(template: Template): QuestionEntry[] {
  const qs = template._questions ?? [];
  if (qs.length > 0) {
    return qs.map((q) => ({
      id: q._id,
      title: q.title,
      description: q.description,
      inputType: q.inputType,
      options: q.options,
    }));
  }
  return [];
}

export function EditTemplateDialog({
  template,
  open,
  onOpenChange,
}: EditTemplateDialogProps) {
  const [entries, setEntries] = useState<QuestionEntry[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<
    QuestionFromApi[]
  >([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: template.title,
      description: template.description || '',
      modelType:
        template.modelType && template.modelType !== ''
          ? template.modelType
          : MODEL_ALL,
    },
  });

  const initialEntries = useMemo(() => templateToEntries(template), [template]);

  useEffect(() => {
    if (open) {
      form.reset({
        title: template.title,
        description: template.description || '',
        modelType:
          template.modelType && template.modelType !== ''
            ? template.modelType
            : MODEL_ALL,
      });
      setEntries(initialEntries);
    }
  }, [open, template, form, initialEntries]);

  // Se o template não trouxer _questions, reconstruir entradas a partir dos ids quando houver questões disponíveis
  useEffect(() => {
    if (
      !open ||
      initialEntries.length > 0 ||
      !template.questions?.length ||
      availableQuestions.length === 0
    ) {
      return;
    }
    const built: QuestionEntry[] = template.questions
      .map((id) => {
        const q = availableQuestions.find((aq) => aq._id === id);
        return q
          ? {
              id: q._id,
              title: q.title,
              description: q.description,
              inputType: q.inputType,
              options: q.options,
            }
          : null;
      })
      .filter((e): e is QuestionEntry => e != null);
    if (built.length > 0) setEntries(built);
  }, [open, initialEntries.length, template.questions, availableQuestions]);

  useEffect(() => {
    if (open) {
      setLoadingQuestions(true);
      api.questions
        .getAll({ status: 'active' })
        .then((list) => setAvailableQuestions(sortQuestions(list)))
        .catch((err) => {
          console.error(err);
          toast.error('Erro ao carregar questões.');
        })
        .finally(() => setLoadingQuestions(false));
    }
  }, [open]);

  const onSubmit = async (data: TemplateFormValues) => {
    if (!template._id) {
      toast.error('ID do template não encontrado.');
      return;
    }
    if (entries.length === 0) {
      toast.error('Adicione pelo menos uma questão ao template.');
      return;
    }

    setIsSubmitting(true);
    try {
      const initialById = new Map(initialEntries.map((e) => [e.id, e]));

      const newEntries = entries.filter((e) => e.isNew);
      const createdIds =
        newEntries.length > 0
          ? await Promise.all(
              newEntries.map(async (entry) => {
                const created = (await api.questions.create({
                  title: entry.title,
                  description: entry.description,
                  status: 'active',
                  inputType: entry.inputType,
                  options: entry.options,
                })) as { id?: string; _id?: string };
                return created?.id ?? created?._id ?? '';
              }),
            )
          : [];

      const toUpdate = entries
        .filter((e) => e.id && !e.isNew)
        .filter((entry) => {
          const initial = initialById.get(entry.id!);
          return (
            !initial ||
            initial.title !== entry.title ||
            (initial.description ?? '') !== (entry.description ?? '') ||
            (initial.inputType ?? '') !== (entry.inputType ?? '') ||
            JSON.stringify(initial.options ?? []) !==
              JSON.stringify(entry.options ?? [])
          );
        });

      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map((entry) =>
            api.questions.update(entry.id!, {
              title: entry.title,
              description: entry.description,
              inputType: entry.inputType,
              options: entry.options,
            }),
          ),
        );
      }

      let createdIndex = 0;
      const questionIds = entries
        .map((e) => {
          if (e.isNew) return createdIds[createdIndex++];
          return e.id ?? '';
        })
        .filter(Boolean);

      await api.templates.update(template._id, {
        title: data.title,
        description: data.description || undefined,
        modelType:
          data.modelType && data.modelType !== MODEL_ALL
            ? data.modelType
            : null,
        questions: questionIds,
      });

      toast.success('Template atualizado com sucesso.');
      router.refresh();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Erro ao atualizar template. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] flex flex-col p-0 gap-0"
        style={{ maxWidth: 'min(calc(100vw - 2rem), 72rem)' }}
      >
        <DialogHeader className="shrink-0 px-8 pt-8 pb-5 border-b bg-muted/30">
          <DialogTitle className="text-xl">Editar Template</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            Altere o título, modelo e as questões. Pode adicionar, editar,
            reordenar e remover questões.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-12">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título do Template</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o título do template"
                            className="h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-8">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descrição opcional"
                            className="min-h-[88px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-4">
                  <FormField
                    control={form.control}
                    name="modelType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <Select
                          value={field.value ?? MODEL_ALL}
                          onValueChange={(v) => field.onChange(v)}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 w-full">
                              <SelectValue placeholder="Selecione o modelo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MODEL_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-12 pt-2">
                  <FormItem className="space-y-3">
                    <div>
                      <FormLabel className="text-base font-medium">
                        Questões
                      </FormLabel>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Adicione, edite, reordene ou remova questões do
                        template.
                      </p>
                    </div>
                    <TemplateQuestionsEditor
                      value={entries}
                      onChange={setEntries}
                      availableQuestions={availableQuestions}
                      loadingAvailable={loadingQuestions}
                      minHeight="280px"
                      onPersistQuestion={async (id, data) => {
                        try {
                          await api.questions.update(id, {
                            title: data.title,
                            description: data.description,
                            inputType: data.inputType,
                            options: data.options,
                          });
                          toast.success('Questão atualizada.');
                        } catch (err) {
                          console.error(err);
                          toast.error('Erro ao guardar a questão.');
                          throw err;
                        }
                      }}
                    />
                    {entries.length === 0 && (
                      <p className="text-sm text-destructive mt-1">
                        Adicione pelo menos uma questão.
                      </p>
                    )}
                  </FormItem>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex justify-end gap-2 px-8 py-4 border-t bg-background">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={entries.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner variant="bars" className="w-4 h-4 mr-2" />A
                    guardar…
                  </>
                ) : (
                  'Salvar alterações'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
