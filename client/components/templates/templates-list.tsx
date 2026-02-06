'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient as api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale/pt';
import { FileStack, Calendar, Trash2, Edit } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { EditTemplateDialog } from './edit-template-dialog';
import { FillTemplateDialog } from './fill-template-dialog';

const MODEL_LABELS: Record<string, string> = {
  credito: 'Crédito',
  imobiliaria: 'Imobiliária',
  seguro: 'Seguros',
};

const MODEL_BADGE_CLASS: Record<string, string> = {
  credito:
    'bg-emerald-500/35 text-emerald-800 border-emerald-500/60 dark:bg-emerald-400/35 dark:text-emerald-100 dark:border-emerald-400/60 font-medium',
  imobiliaria:
    'bg-amber-500/35 text-amber-900 border-amber-500/60 dark:bg-amber-400/35 dark:text-amber-100 dark:border-amber-400/60 font-medium',
  seguro:
    'bg-sky-500/35 text-sky-800 border-sky-500/60 dark:bg-sky-400/35 dark:text-sky-100 dark:border-sky-400/60 font-medium',
};

interface Template {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  modelType?: string | null;
  questions: string[];
  _questions?: {
    _id?: string;
    id?: string;
    title: string;
    description?: string;
    inputType?: string;
    options?: string[];
  }[];
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  isPublic?: boolean;
}

interface TemplatesListProps {
  /** Mostrar botão Preencher e dialog (ocultar para admin). Default true. */
  showFillButton?: boolean;
  /** Mostrar botões Editar e Excluir (apenas admin na área de templates). Default true em contexto admin. */
  showEditActions?: boolean;
}

export function TemplatesList({
  showFillButton = true,
  showEditActions = true,
}: TemplatesListProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [fillingTemplate, setFillingTemplate] = useState<Template | null>(null);
  const [isFillDialogOpen, setIsFillDialogOpen] = useState(false);

  // Carregar templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setError(null);
        const templatesData = await api.templates.getAll();
        setTemplates(templatesData);
      } catch (error: any) {
        console.error('Error loading templates:', error);
        setError(
          error.message || 'Erro ao carregar templates. Tente novamente.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.templates.delete(id);
      // Atualizar lista local removendo o template excluído
      setTemplates((prev) => prev.filter((t) => t._id !== id && t.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao excluir template. Tente novamente.';
      alert(message);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingTemplate(null);
      // Recarregar templates após edição
      const loadTemplates = async () => {
        try {
          setError(null);
          const templatesData = await api.templates.getAll();
          setTemplates(templatesData);
        } catch (error: any) {
          console.error('Error loading templates:', error);
          setError(
            error.message || 'Erro ao carregar templates. Tente novamente.',
          );
        }
      };
      loadTemplates();
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-8 text-center flex flex-col items-center gap-3">
          <Spinner variant="bars" className="w-6 h-6 text-muted-foreground" />
          <p className="text-muted-foreground">Carregando templates...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-12 text-center">
          <FileStack className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-destructive font-medium mb-2">
            Erro ao carregar templates
          </p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setLoading(true);
              setError(null);
              const loadTemplates = async () => {
                try {
                  const templatesData = await api.templates.getAll();
                  setTemplates(templatesData);
                } catch (error: any) {
                  setError(
                    error.message ||
                      'Erro ao carregar templates. Tente novamente.',
                  );
                } finally {
                  setLoading(false);
                }
              };
              loadTemplates();
            }}
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {templates.length === 0 ? (
        <Card className="rounded-xl border-border/80 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="rounded-full bg-muted/60 p-4">
              <FileStack className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium text-foreground">
              Nenhum template criado ainda
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Crie templates para reutilizar em seus formulários
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((template) => (
            <Card
              key={template._id ?? template.id ?? template.title}
              className={cn(
                'overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm',
                'transition-all duration-200 ease-out',
                'hover:border-border hover:shadow-md hover:shadow-black/5',
                'dark:hover:shadow-black/20',
              )}
            >
              {/* Faixa superior sutil com cor do modelo (opcional) */}
              {template.modelType && (
                <div
                  className={cn(
                    'h-1 w-full',
                    template.modelType === 'credito' && 'bg-emerald-500/60',
                    template.modelType === 'imobiliaria' && 'bg-amber-500/60',
                    template.modelType === 'seguro' && 'bg-sky-500/60',
                  )}
                />
              )}
              <CardHeader className="pb-3 pt-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base font-semibold leading-tight tracking-tight text-foreground line-clamp-2">
                      {template.title}
                    </CardTitle>
                    {!template.modelType && (
                      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Template
                      </span>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    {template.description || 'Sem descrição'}
                  </CardDescription>
                  {template.modelType && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'w-fit text-[10px] px-1.5 py-0 font-medium',
                        MODEL_BADGE_CLASS[template.modelType] ??
                          'bg-muted/50 text-muted-foreground border-border',
                      )}
                    >
                      {MODEL_LABELS[template.modelType] ?? template.modelType}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pt-0">
                <div className="flex items-center gap-4 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <FileStack className="h-3.5 w-3.5 opacity-70" />
                    {template.questions.length} questão(ões)
                  </span>
                  <span className="text-muted-foreground/60">·</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 opacity-70" />
                    {format(new Date(template.createdAt), 'dd MMM yyyy', {
                      locale: pt,
                    })}
                  </span>
                </div>
                <div className="flex gap-2 border-t border-border/60 pt-4">
                  {showFillButton && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 font-medium shadow-sm"
                      onClick={() => {
                        setFillingTemplate(template);
                        setIsFillDialogOpen(true);
                      }}
                    >
                      Preencher
                    </Button>
                  )}
                  {showEditActions && (
                    <>
                      <Button
                        variant="outline"
                        size="default"
                        className="min-w-[2.75rem] font-medium md:min-w-0"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4 shrink-0 md:mr-1.5" />
                        <span className="hidden md:inline">Editar</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Excluir template"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Confirmar exclusão
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o template &quot;
                              {template.title}&quot;? Esta ação não pode ser
                              desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                (template._id ?? template.id) &&
                                handleDelete(template._id ?? template.id!)
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingTemplate && (
        <EditTemplateDialog
          template={editingTemplate}
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogClose}
          onSaved={(updated) => {
            setEditingTemplate(updated);
            setTemplates((prev) =>
              prev.map((t) =>
                t._id === updated._id || t._id === updated.id
                  ? { ...t, ...updated, _id: updated._id ?? updated.id }
                  : t,
              ),
            );
          }}
        />
      )}

      {showFillButton && (
        <FillTemplateDialog
          template={fillingTemplate}
          open={isFillDialogOpen}
          onOpenChange={(open) => {
            setIsFillDialogOpen(open);
            if (!open) {
              setFillingTemplate(null);
            }
          }}
        />
      )}
    </div>
  );
}
