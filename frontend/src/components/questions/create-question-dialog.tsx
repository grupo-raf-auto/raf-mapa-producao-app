'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/router-compat';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Plus,
  Trash2,
  Type,
  Calendar,
  Mail,
  Phone,
  Hash,
  ListChecks,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient as api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

type InputType =
  | 'text'
  | 'date'
  | 'select'
  | 'email'
  | 'tel'
  | 'number'
  | 'radio';

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

const questionSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  inputType: z
    .enum(['text', 'date', 'select', 'email', 'tel', 'number', 'radio'])
    .optional(),
  options: z.array(z.string()).optional(),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

export function CreateQuestionDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'active',
      inputType: 'text',
      options: [],
    },
  });

  const inputType = form.watch('inputType');
  const inputTypes = Object.keys(INPUT_TYPE_LABELS) as InputType[];

  const onSubmit = async (data: QuestionFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        options: (data.options ?? []).filter((s) => s.trim().length > 0),
      };
      await api.questions.create(payload);
      toast.success('Questão criada.');
      router.refresh();
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Erro ao criar questão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/20">
          <DialogTitle className="text-lg font-semibold">
            Nova questão
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col"
          >
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
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium">
                      Estado
                    </FormLabel>
                    <div className="flex gap-2">
                      {(['active', 'inactive'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => field.onChange(s)}
                          className={cn(
                            'flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors',
                            field.value === s
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60',
                          )}
                        >
                          {s === 'active' ? 'Ativo' : 'Inativo'}
                        </button>
                      ))}
                    </div>
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
                    <Spinner variant="bars" className="w-4 h-4 mr-2" />A criar…
                  </>
                ) : (
                  'Criar questão'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
