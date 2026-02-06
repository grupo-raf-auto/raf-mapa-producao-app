'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { LayoutTemplate } from 'lucide-react';

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

interface CreateTemplateDialogProps {
  children: React.ReactNode;
  /** Chamado após criar o template com sucesso */
  onCreated?: () => void;
}

export function CreateTemplateDialog({
  children,
  onCreated,
}: CreateTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<
    QuestionFromApi[]
  >([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [entries, setEntries] = useState<QuestionEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: '',
      description: '',
      modelType: MODEL_ALL,
    },
  });

  useEffect(() => {
    if (open) {
      setLoadingQuestions(true);
      api.questions
        .getAll({ status: 'active' })
        .then((list) => {
          setAvailableQuestions(sortQuestions(list));
        })
        .catch((err) => {
          console.error(err);
          toast.error('Erro ao carregar questões.');
        })
        .finally(() => setLoadingQuestions(false));
    }
  }, [open]);

  const onSubmit = async (data: TemplateFormValues) => {
    if (entries.length === 0) {
      toast.error('Adicione pelo menos uma questão ao template.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newEntries = entries.filter((e) => e.isNew);
      console.log('[CreateTemplate] entries:', entries);
      console.log('[CreateTemplate] newEntries (isNew=true):', newEntries);

      const createdIds =
        newEntries.length > 0
          ? await Promise.all(
              newEntries.map(async (entry) => {
                console.log('[CreateTemplate] Creating question:', entry.title);
                const raw = await api.questions.create({
                  title: entry.title,
                  description: entry.description,
                  status: 'active',
                  inputType: entry.inputType,
                  options: entry.options,
                });
                console.log('[CreateTemplate] Question create response:', raw);
                const created =
                  (
                    raw as {
                      data?: { id?: string; _id?: string };
                      id?: string;
                      _id?: string;
                    }
                  )?.data ?? (raw as { id?: string; _id?: string });
                const id = (created?.id ?? created?._id ?? '').trim();
                if (!id) {
                  console.error('[CreateTemplate] No ID in response:', raw);
                  throw new Error(
                    'Não foi possível obter o ID da questão criada.',
                  );
                }
                return id;
              }),
            )
          : [];

      let newIndex = 0;
      const questionIds = entries
        .map((e) => (e.isNew ? createdIds[newIndex++] : (e.id ?? '')))
        .filter(Boolean);

      await api.templates.create({
        title: data.title,
        description: data.description || undefined,
        modelType:
          data.modelType && data.modelType !== MODEL_ALL
            ? data.modelType
            : undefined,
        questions: questionIds,
      });

      toast.success('Template criado com sucesso.');
      setOpen(false);
      form.reset();
      setEntries([]);
      // Notificar o pai para atualizar a lista
      onCreated?.();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Erro ao criar template. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setEntries([]);
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-h-[90vh] flex flex-col p-0 gap-0 rounded-xl border shadow-2xl overflow-hidden !max-w-[min(96vw,1680px)] w-[min(96vw,1680px)]"
        style={{ width: 'min(96vw, 1680px)', maxWidth: 'min(96vw, 1680px)' }}
      >
        <DialogHeader className="shrink-0 px-6 sm:px-10 pt-8 sm:pt-10 pb-5 sm:pb-6 border-b border-border/80 bg-gradient-to-b from-muted/50 to-background">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LayoutTemplate className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="space-y-1.5 pt-0.5 min-w-0 flex-1">
              <DialogTitle className="text-xl sm:text-2xl font-semibold tracking-tight">
                Novo Template
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-3xl">
                Crie um template e defina as questões: selecione existentes ou
                crie novas. Depois associe ao modelo para os utilizadores
                preencherem.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-4 sm:px-6 md:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8">
                <section className="space-y-4 sm:space-y-5">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Informação do template
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                    <div className="lg:col-span-12 min-w-0">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título do Template</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex.: Mapa de Produção Mensal"
                                className="h-11 w-full min-w-0 rounded-lg border-border/80"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="lg:col-span-8 min-w-0">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="min-h-[100px]">
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Descrição opcional do template"
                                className="min-h-[100px] w-full min-w-0 resize-none rounded-lg border-border/80"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="lg:col-span-4 min-w-0 max-w-full lg:max-w-[320px]">
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
                                <SelectTrigger className="h-11 w-full min-w-0 rounded-lg border-border/80">
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
                            <p className="text-sm text-muted-foreground mt-1.5">
                              Um modelo pode ter vários templates.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-6 min-w-0">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Questões
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Adicione questões: selecione das existentes ou crie novas.
                      Pode reordenar, editar e remover.
                    </p>
                  </div>
                  <FormItem className="space-y-3">
                    <TemplateQuestionsEditor
                      value={entries}
                      onChange={setEntries}
                      availableQuestions={availableQuestions}
                      loadingAvailable={loadingQuestions}
                      minHeight="300px"
                    />
                    {entries.length === 0 && (
                      <p className="text-sm text-destructive mt-1">
                        Adicione pelo menos uma questão.
                      </p>
                    )}
                  </FormItem>
                </section>
              </div>
            </div>

            <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 px-4 sm:px-6 md:px-10 py-4 sm:py-5 border-t border-border/80 bg-muted/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto min-w-0 sm:min-w-[100px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={entries.length === 0 || isSubmitting}
                className="w-full sm:w-auto min-w-0 sm:min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Spinner variant="bars" className="w-4 h-4 mr-2" />A
                    guardar…
                  </>
                ) : (
                  'Criar Template'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
