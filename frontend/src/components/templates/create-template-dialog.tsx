import { useState, useEffect } from 'react';
import { useRouter } from '@/lib/router-compat';
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

export function CreateTemplateDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<
    QuestionFromApi[]
  >([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [entries, setEntries] = useState<QuestionEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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
      router.refresh();
      setOpen(false);
      form.reset();
      setEntries([]);
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
        className="max-h-[90vh] flex flex-col p-0 gap-0"
        style={{ maxWidth: 'min(calc(100vw - 2rem), 72rem)' }}
      >
        <DialogHeader className="shrink-0 px-8 pt-8 pb-5 border-b bg-muted/30">
          <DialogTitle className="text-xl">Novo Template</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            Crie um template e defina as questões: selecione existentes ou crie
            novas.
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
                        <p className="text-sm text-muted-foreground mt-1.5">
                          Um modelo pode ter vários templates.
                        </p>
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
                        Adicione questões ao template: selecione das existentes
                        ou crie novas. Pode reordenar, editar e remover.
                      </p>
                    </div>
                    <TemplateQuestionsEditor
                      value={entries}
                      onChange={setEntries}
                      availableQuestions={availableQuestions}
                      loadingAvailable={loadingQuestions}
                      minHeight="280px"
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
                onClick={() => setOpen(false)}
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
