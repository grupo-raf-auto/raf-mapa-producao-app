import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ListOrdered,
  Type,
  Calendar,
  Mail,
  Phone,
  Hash,
  ListChecks,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';

// —— Types ——

export type InputType =
  | 'text'
  | 'date'
  | 'select'
  | 'email'
  | 'tel'
  | 'number'
  | 'radio';

export interface QuestionEntry {
  id?: string;
  title: string;
  description?: string;
  inputType?: InputType;
  options?: string[];
  isNew?: boolean;
}

export interface QuestionFromApi {
  _id?: string;
  title: string;
  description?: string;
  status?: string;
  inputType?: InputType;
  options?: string[];
}

const INPUT_TYPE_LABELS: Record<InputType, string> = {
  text: 'Texto',
  date: 'Data',
  select: 'Select',
  email: 'Email',
  tel: 'Telefone',
  number: 'Número',
  radio: 'Radio',
};

const INPUT_TYPE_ICONS: Record<
  InputType,
  React.ComponentType<{ className?: string }>
> = {
  text: Type,
  date: Calendar,
  select: ListChecks,
  email: Mail,
  tel: Phone,
  number: Hash,
  radio: CircleDot,
};

const INPUT_TYPE_BADGE_CLASS: Record<InputType, string> = {
  text: 'bg-slate-500/25 text-slate-800 border-slate-500/50 dark:bg-slate-400/25 dark:text-slate-200 dark:border-slate-400/50',
  date: 'bg-violet-500/25 text-violet-800 border-violet-500/50 dark:bg-violet-400/25 dark:text-violet-200 dark:border-violet-400/50',
  select:
    'bg-amber-500/25 text-amber-800 border-amber-500/50 dark:bg-amber-400/25 dark:text-amber-200 dark:border-amber-400/50',
  email:
    'bg-blue-500/25 text-blue-800 border-blue-500/50 dark:bg-blue-400/25 dark:text-blue-200 dark:border-blue-400/50',
  tel: 'bg-teal-500/25 text-teal-800 border-teal-500/50 dark:bg-teal-400/25 dark:text-teal-200 dark:border-teal-400/50',
  number:
    'bg-emerald-500/25 text-emerald-800 border-emerald-500/50 dark:bg-emerald-400/25 dark:text-emerald-200 dark:border-emerald-400/50',
  radio:
    'bg-rose-500/25 text-rose-800 border-rose-500/50 dark:bg-rose-400/25 dark:text-rose-200 dark:border-rose-400/50',
};

const BADGE_NOVA_CLASS =
  'bg-emerald-500/30 text-emerald-800 border-emerald-500/60 dark:bg-emerald-400/30 dark:text-emerald-100 dark:border-emerald-400/60 font-medium';

const questionFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  inputType: z
    .enum([
      'text',
      'date',
      'select',
      'email',
      'tel',
      'number',
      'radio',
    ] as const)
    .optional(),
  options: z.array(z.string()).optional(),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

// —— Question form dialog (add / edit) ——

interface QuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<QuestionEntry>;
  onSave: (data: QuestionFormValues) => void | Promise<void>;
  title: string;
}

function QuestionFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  title,
}: QuestionFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      title: '',
      description: '',
      inputType: 'text',
      options: [],
    },
  });

  const inputType = form.watch('inputType');

  // Ao abrir o diálogo, preencher o formulário com os dados da questão (editar) ou vazios (nova)
  useEffect(() => {
    if (open) {
      form.reset({
        title: initial?.title ?? '',
        description: initial?.description ?? '',
        inputType: initial?.inputType ?? 'text',
        options: initial?.options ?? [],
      });
    }
  }, [
    open,
    form,
    initial?.title,
    initial?.description,
    initial?.inputType,
    initial?.options,
  ]);

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  const submit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        options: (data.options ?? []).filter((s) => s.trim().length > 0),
      };
      await onSave(payload);
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  });

  const inputTypes = Object.keys(INPUT_TYPE_LABELS) as InputType[];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/20">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={submit} className="flex flex-col">
            <div className="px-6 py-5 space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium">
                      Título da questão
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Nome do cliente"
                        className="h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inputType"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">
                      Tipo de resposta
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Define como o utilizador responderá a esta questão.
                    </p>
                    <FormControl>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {inputTypes.map((t) => {
                          const Icon = INPUT_TYPE_ICONS[t];
                          const isSelected = (field.value ?? 'text') === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => field.onChange(t)}
                              className={cn(
                                'flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-center transition-colors',
                                isSelected
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground',
                              )}
                            >
                              {Icon && (
                                <Icon
                                  className={cn(
                                    'h-5 w-5',
                                    isSelected ? 'text-primary' : '',
                                  )}
                                />
                              )}
                              <span className="text-xs font-medium leading-tight">
                                {INPUT_TYPE_LABELS[t]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium text-muted-foreground">
                      Descrição <span className="font-normal">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Texto de ajuda para o preenchimento"
                        className="resize-none min-h-[60px] text-sm"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(inputType === 'select' || inputType === 'radio') && (
                <FormField
                  control={form.control}
                  name="options"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium">
                        Opções de resposta
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Adicione as opções disponíveis. A ordem será mantida.
                      </p>
                      <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                        {(field.value ?? []).map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs w-5 shrink-0">
                              {i + 1}.
                            </span>
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const next = [...(field.value ?? [])];
                                next[i] = e.target.value;
                                field.onChange(next);
                              }}
                              placeholder={`Opção ${i + 1}`}
                              className="h-9 text-sm"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                const next = (field.value ?? []).filter(
                                  (_, j) => j !== i,
                                );
                                field.onChange(next);
                              }}
                              aria-label="Remover opção"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full mt-1 h-9"
                          onClick={() =>
                            field.onChange([...(field.value ?? []), ''])
                          }
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          Adicionar opção
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <DialogFooter className="px-6 py-4 border-t bg-background gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner variant="bars" className="w-4 h-4 mr-2" />A
                    guardar…
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// —— Select existing questions dialog ——

interface SelectQuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  available: QuestionFromApi[];
  alreadySelectedIds: string[];
  onSelect: (ids: string[]) => void;
  loading?: boolean;
}

function SelectQuestionsDialog({
  open,
  onOpenChange,
  available,
  alreadySelectedIds,
  onSelect,
  loading,
}: SelectQuestionsDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    onSelect(Array.from(selected));
    setSelected(new Set());
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelected(new Set());
    onOpenChange(next);
  };

  const canAdd = available.filter(
    (q) => !alreadySelectedIds.includes(q._id ?? ''),
  );
  const selectedArray = Array.from(selected);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg border-2 border-border">
        <DialogHeader>
          <DialogTitle>Selecionar questões existentes</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            A carregar…
          </div>
        ) : available.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Nenhuma questão disponível. Crie questões na secção Questões
            primeiro.
          </p>
        ) : canAdd.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Todas as questões disponíveis já estão no template.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <ScrollArea className="h-[320px] w-full rounded-md border">
              <div className="p-3 space-y-2">
                {canAdd.map((q) => (
                  <label
                    key={q._id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50',
                      selected.has(q._id ?? '') &&
                        'bg-primary/5 border-primary/30',
                    )}
                  >
                    <Checkbox
                      checked={selected.has(q._id ?? '')}
                      onCheckedChange={() => toggle(q._id ?? '')}
                      aria-label={q.title}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{q.title}</span>
                      {q.inputType && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'ml-2 text-[10px] px-1.5 py-0 border font-medium',
                            INPUT_TYPE_BADGE_CLASS[q.inputType as InputType] ??
                              'bg-muted text-muted-foreground',
                          )}
                        >
                          {INPUT_TYPE_LABELS[q.inputType as InputType] ??
                            q.inputType}
                        </Badge>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </ScrollArea>
            <DialogFooter className="border-t pt-4">
              <Button
                variant="secondary"
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedArray.length === 0}
              >
                Adicionar{' '}
                {selectedArray.length > 0 ? `(${selectedArray.length})` : ''}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// —— Main editor ——

export interface TemplateQuestionsEditorProps {
  value: QuestionEntry[];
  onChange: (entries: QuestionEntry[]) => void;
  availableQuestions: QuestionFromApi[];
  loadingAvailable?: boolean;
  disabled?: boolean;
  minHeight?: string;
  /** Chamado ao guardar uma questão existente (edição). Persiste na API imediatamente. */
  onPersistQuestion?: (id: string, data: QuestionFormValues) => Promise<void>;
}

export function TemplateQuestionsEditor({
  value,
  onChange,
  availableQuestions,
  loadingAvailable = false,
  disabled = false,
  minHeight = '240px',
  onPersistQuestion,
}: TemplateQuestionsEditorProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formInitial, setFormInitial] = useState<
    Partial<QuestionEntry> | undefined
  >();

  const selectedIds = value.map((e) => e.id).filter(Boolean) as string[];

  const addNew = useCallback(() => {
    setFormInitial(undefined);
    setEditingIndex(null);
    setFormOpen(true);
  }, []);

  const openSelect = useCallback(() => {
    setSelectOpen(true);
  }, []);

  const editIndex = useCallback(
    (index: number) => {
      setFormInitial(value[index]);
      setEditingIndex(index);
      setFormOpen(true);
    },
    [value],
  );

  const removeAt = useCallback(
    (index: number) => {
      const next = value.filter((_, i) => i !== index);
      onChange(next);
    },
    [value, onChange],
  );

  const move = useCallback(
    (index: number, dir: 'up' | 'down') => {
      const next = [...value];
      const j = dir === 'up' ? index - 1 : index + 1;
      if (j < 0 || j >= next.length) return;
      [next[index], next[j]] = [next[j], next[index]];
      onChange(next);
    },
    [value, onChange],
  );

  const saveForm = useCallback(
    async (data: QuestionFormValues) => {
      if (editingIndex !== null) {
        const entry = value[editingIndex];
        const next = [...value];
        next[editingIndex] = {
          ...entry,
          title: data.title,
          description: data.description,
          inputType: data.inputType as InputType,
          options: data.options,
        };
        onChange(next);
        if (entry.id && onPersistQuestion) {
          await onPersistQuestion(entry.id, data);
        }
      } else {
        onChange([
          ...value,
          {
            ...data,
            inputType: data.inputType as InputType,
            options: data.options,
            isNew: true,
          },
        ]);
      }
      setEditingIndex(null);
      setFormInitial(undefined);
    },
    [editingIndex, value, onChange, onPersistQuestion],
  );

  const handleSelectExisting = useCallback(
    (ids: string[]) => {
      const toAdd = ids
        .map((id) => {
          const q = availableQuestions.find((aq) => aq._id === id);
          if (!q) return null;
          return {
            id: q._id,
            title: q.title,
            description: q.description,
            inputType: q.inputType as InputType,
            options: q.options,
          } as QuestionEntry;
        })
        .filter(Boolean) as QuestionEntry[];
      onChange([...value, ...toAdd]);
    },
    [availableQuestions, value, onChange],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ListOrdered className="h-4 w-4" />
          <span>
            {value.length} questão{value.length !== 1 ? 'ões' : ''} no template
          </span>
        </div>
        {!disabled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Adicionar questão
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-100000">
              <DropdownMenuItem onSelect={openSelect}>
                Selecionar existentes
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={addNew}>
                Nova questão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div
        className={cn(
          'rounded-lg border bg-muted/20 overflow-hidden',
          disabled && 'opacity-70 pointer-events-none',
        )}
        style={{ minHeight }}
      >
        {value.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground text-sm gap-4">
            <p className="mb-0">Nenhuma questão no template.</p>
            {!disabled && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={openSelect}
                >
                  Selecionar questões existentes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNew}
                >
                  Nova questão
                </Button>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {value.map((entry, index) => (
              <li
                key={entry.id ?? `new-${index}`}
                className="flex items-center gap-2 px-3 py-2.5 bg-background/80 hover:bg-background first:border-t-0"
              >
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="w-5 text-xs font-medium tabular-nums">
                    {index + 1}.
                  </span>
                  {!disabled && (
                    <div className="flex flex-col">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0"
                        onClick={() => move(index, 'up')}
                        disabled={index === 0}
                        aria-label="Subir"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0"
                        onClick={() => move(index, 'down')}
                        disabled={index === value.length - 1}
                        aria-label="Descer"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
                  <p className="font-medium text-sm truncate w-full">
                    {entry.title}
                  </p>
                  {entry.inputType && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] px-1.5 py-0 border font-medium',
                        INPUT_TYPE_BADGE_CLASS[entry.inputType],
                      )}
                    >
                      {INPUT_TYPE_LABELS[entry.inputType]}
                    </Badge>
                  )}
                  {entry.isNew && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] px-1.5 py-0 border',
                        BADGE_NOVA_CLASS,
                      )}
                    >
                      Nova
                    </Badge>
                  )}
                </div>
                {!disabled && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => editIndex(index)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeAt(index)}
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <QuestionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={formInitial}
        onSave={saveForm}
        title={editingIndex !== null ? 'Editar questão' : 'Nova questão'}
      />

      <SelectQuestionsDialog
        open={selectOpen}
        onOpenChange={setSelectOpen}
        available={availableQuestions}
        alreadySelectedIds={selectedIds}
        onSelect={handleSelectExisting}
        loading={loadingAvailable}
      />
    </div>
  );
}
