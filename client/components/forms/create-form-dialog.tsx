'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  questions: z.array(z.string()).default([]),
});

type FormFormValues = z.infer<typeof formSchema>;

interface Question {
  _id?: string;
  title: string;
  description?: string;
  category: string;
  status: string;
}

export function CreateFormDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FormFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      questions: [],
    },
  });

  // Buscar questões quando o dialog abrir
  useEffect(() => {
    if (open) {
      loadQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const allQuestions = await api.questions.getAll({ status: 'active' });
      setQuestions(allQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormFormValues) => {
    try {
      await api.forms.create({
        title: data.title,
        description: data.description || undefined,
        questions: data.questions || [],
      });
      router.refresh();
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating form:', error);
      alert('Erro ao criar formulário. Tente novamente.');
    }
  };

  const selectedQuestions = form.watch('questions') || [];

  const categoryColors: Record<string, string> = {
    Finance: 'bg-blue-100 text-blue-800',
    Marketing: 'bg-purple-100 text-purple-800',
    HR: 'bg-green-100 text-green-800',
    Tech: 'bg-orange-100 text-orange-800',
    Custom: 'bg-gray-100 text-gray-800',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Formulário</DialogTitle>
          <DialogDescription>
            Crie um novo formulário e selecione as questões que deseja incluir
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título do formulário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Digite a descrição do formulário (opcional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="questions"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Questões</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Selecione as questões que deseja incluir no formulário
                    </p>
                    {selectedQuestions.length > 0 && (
                      <p className="text-sm text-primary mt-1">
                        {selectedQuestions.length} questão(ões) selecionada(s)
                      </p>
                    )}
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : questions.length === 0 ? (
                    <Card className="shadow-sm">
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">
                          Nenhuma questão ativa disponível. Crie questões primeiro.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {questions.map((question) => (
                        <FormField
                          key={question._id}
                          control={form.control}
                          name="questions"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={question._id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(question._id || '')}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || [];
                                      return checked
                                        ? field.onChange([...currentValue, question._id])
                                        : field.onChange(
                                            currentValue.filter(
                                              (value) => value !== question._id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal flex-1 cursor-pointer">
                                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <h4 className="font-medium text-sm mb-1">
                                            {question.title}
                                          </h4>
                                          {question.description && (
                                            <p className="text-xs text-muted-foreground mb-2">
                                              {question.description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              className={
                                                categoryColors[question.category] ||
                                                categoryColors.Custom
                                              }
                                            >
                                              {question.category}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Criar Formulário</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
