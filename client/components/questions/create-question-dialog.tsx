'use client';

import { useState } from 'react';
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
import { api } from '@/lib/api';

const questionSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  inputType: z.enum(['text', 'date', 'select', 'email', 'tel', 'number', 'radio']).optional(),
  options: z.array(z.string()).optional(),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

export function CreateQuestionDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
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

  const onSubmit = async (data: QuestionFormValues) => {
    try {
      await api.questions.create(data);
        router.refresh();
        setOpen(false);
        form.reset();
    } catch (error) {
      console.error('Error creating question:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Questão</DialogTitle>
          <DialogDescription>
            Crie uma nova questão para seus formulários
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título da questão" {...field} />
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
                      placeholder="Digite a descrição (opcional)"
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
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="inputType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Input</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de input" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="date">Data</SelectItem>
                      <SelectItem value="select">Seleção (Select)</SelectItem>
                      <SelectItem value="radio">Radio Button</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="tel">Telefone</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(inputType === 'select' || inputType === 'radio') && (
              <FormField
                control={form.control}
                name="options"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opções (uma por linha)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite as opções, uma por linha"
                        value={field.value?.join('\n') || ''}
                        onChange={(e) => {
                          const options = e.target.value
                            .split('\n')
                            .map(line => line.trim())
                            .filter(line => line.length > 0);
                          field.onChange(options);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Criar Questão</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
