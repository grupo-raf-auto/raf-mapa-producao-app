"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient as api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const templateSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  questions: z.array(z.string()),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface Question {
  _id?: string;
  title: string;
  description?: string;
  status: string;
  inputType?: "text" | "date" | "select" | "email" | "tel" | "number" | "radio";
  options?: string[];
}

interface Template {
  _id?: string;
  title: string;
  description?: string;
  questions: string[];
  isDefault?: boolean;
}

interface EditTemplateDialogProps {
  template: Template;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTemplateDialog({
  template,
  open,
  onOpenChange,
}: EditTemplateDialogProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: template.title,
      description: template.description || "",
      questions: template.questions || [],
    },
  });

  // Carregar questões quando o dialog abrir ou template mudar
  useEffect(() => {
    if (open) {
      loadQuestions();
      // Resetar form com dados do template
      form.reset({
        title: template.title,
        description: template.description || "",
        questions: template.questions || [],
      });
    } else {
      // Ao fechar, resetar para o estado original
      if (originalQuestions.length > 0) {
        setQuestions([...originalQuestions]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template]);

  // Ordem definida para as questões
  const questionOrder = [
    "Data",
    "Apontador",
    "Agente",
    "Nome do Cliente",
    "Data nascimento",
    "Email cliente",
    "Telefone cliente",
    "Distrito cliente",
    "Rating cliente",
    "Seguradora",
    "Banco",
    "Valor",
    "Fracionamento",
  ];

  const sortQuestions = (questions: Question[]): Question[] => {
    // Remover duplicatas baseado no título
    const uniqueQuestions = questions.filter(
      (q, index, self) => index === self.findIndex((t) => t.title === q.title),
    );

    // Ordenar de acordo com a ordem especificada
    return uniqueQuestions.sort((a, b) => {
      const indexA = questionOrder.indexOf(a.title);
      const indexB = questionOrder.indexOf(b.title);

      // Se ambos estão na ordem, ordenar pela posição
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // Se apenas A está na ordem, A vem primeiro
      if (indexA !== -1) return -1;
      // Se apenas B está na ordem, B vem primeiro
      if (indexB !== -1) return 1;
      // Se nenhum está na ordem, manter ordem alfabética
      return a.title.localeCompare(b.title);
    });
  };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const allQuestions = await api.questions.getAll({ status: "active" });
      // Ordenar e remover duplicatas
      const sortedQuestions = sortQuestions(allQuestions);
      // Criar cópia profunda para backup
      const questionsCopy = JSON.parse(JSON.stringify(sortedQuestions));
      setOriginalQuestions(questionsCopy);
      setQuestions(sortedQuestions);
    } catch (error) {
      console.error("Error loading questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOption = (questionId: string, optionToRemove: string) => {
    // Apenas atualizar o estado local, sem chamar a API
    setQuestions((prev) =>
      prev.map((q) => {
        if (q._id === questionId && q.options) {
          return {
            ...q,
            options: q.options.filter((opt) => opt !== optionToRemove),
          };
        }
        return q;
      }),
    );
  };

  const onSubmit = async (data: TemplateFormValues) => {
    try {
      if (!template._id) {
        toast.error("ID do template não encontrado");
        return;
      }

      // Aplicar todas as mudanças nas questões (remover opções)
      const questionsToUpdate = questions.filter((q) => {
        const original = originalQuestions.find((oq) => oq._id === q._id);
        if (!original) return false;
        // Verificar se as opções mudaram
        const originalOptions = JSON.stringify(original.options || []);
        const currentOptions = JSON.stringify(q.options || []);
        return originalOptions !== currentOptions;
      });

      // Atualizar cada questão que teve opções removidas
      for (const question of questionsToUpdate) {
        if (question._id) {
          await api.questions.update(question._id, {
            options: question.options || [],
          });
        }
      }

      // Atualizar o template
      await api.templates.update(template._id, {
        title: data.title,
        description: data.description || undefined,
        questions: data.questions || [],
      });

      router.refresh();
      onOpenChange(false);
      toast.success("Template atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Erro ao atualizar template. Tente novamente.");
    }
  };

  const selectedQuestions = form.watch("questions") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Template</DialogTitle>
          <DialogDescription>
            Edite o template e ajuste as questões conforme necessário
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Template</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite o título do template"
                      {...field}
                    />
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
                      placeholder="Digite a descrição do template (opcional)"
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
                      Selecione as questões que deseja incluir no template
                    </p>
                    {selectedQuestions.length > 0 && (
                      <p className="text-sm text-primary mt-1">
                        {selectedQuestions.length} questão(ões) selecionada(s)
                      </p>
                    )}
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner
                        variant="bars"
                        className="w-6 h-6 text-muted-foreground"
                      />
                    </div>
                  ) : questions.length === 0 ? (
                    <Card className="shadow-sm">
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">
                          Nenhuma questão ativa disponível. Crie questões
                          primeiro.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 border rounded-lg p-4">
                      {questions.map((question) => (
                        <FormField
                          key={question._id}
                          control={form.control}
                          name="questions"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={question._id}
                                className="flex flex-row items-start space-x-3 space-y-0 py-2 border-b last:border-b-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(
                                      question._id || "",
                                    )}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || [];
                                      return checked
                                        ? field.onChange([
                                            ...currentValue,
                                            question._id,
                                          ])
                                        : field.onChange(
                                            currentValue.filter(
                                              (value) => value !== question._id,
                                            ),
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal flex-1 cursor-pointer">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-sm text-foreground">
                                        {question.title}
                                      </h4>
                                      {question.description && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {question.description}
                                        </p>
                                      )}
                                      {(question.inputType === "select" ||
                                        question.inputType === "radio") &&
                                        question.options &&
                                        question.options.length > 0 && (
                                          <div className="mt-2 p-2 bg-muted rounded-md">
                                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                              {question.inputType === "select"
                                                ? "Opções do Select:"
                                                : "Opções do Radio:"}
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                              {question.options.map(
                                                (option, idx) => (
                                                  <Badge
                                                    key={idx}
                                                    variant="secondary"
                                                    className="text-xs relative pr-6"
                                                  >
                                                    {option}
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (question._id) {
                                                          handleRemoveOption(
                                                            question._id,
                                                            option,
                                                          );
                                                        }
                                                      }}
                                                      className="absolute top-0 right-0 h-full w-5 flex items-center justify-center hover:bg-destructive/20 rounded-r transition-colors"
                                                      aria-label={`Remover ${option}`}
                                                    >
                                                      <X className="h-3 w-3 text-white" />
                                                    </button>
                                                  </Badge>
                                                ),
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                    {question.inputType && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {question.inputType === "date" &&
                                          "📅 Data"}
                                        {question.inputType === "select" &&
                                          "📋 Select"}
                                        {question.inputType === "radio" &&
                                          "🔘 Radio"}
                                        {question.inputType === "email" &&
                                          "📧 Email"}
                                        {question.inputType === "tel" &&
                                          "📞 Telefone"}
                                        {question.inputType === "number" &&
                                          "🔢 Número"}
                                        {question.inputType === "text" &&
                                          "📝 Texto"}
                                      </Badge>
                                    )}
                                  </div>
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
                onClick={() => {
                  // Resetar questões para o estado original
                  if (originalQuestions.length > 0) {
                    setQuestions([...originalQuestions]);
                  }
                  onOpenChange(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
