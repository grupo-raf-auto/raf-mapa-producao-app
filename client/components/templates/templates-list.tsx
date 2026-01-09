'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
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

interface Template {
  _id?: string;
  title: string;
  description?: string;
  questions: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  isDefault?: boolean;
}

export function TemplatesList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [fillingTemplate, setFillingTemplate] = useState<Template | null>(null);
  const [isFillDialogOpen, setIsFillDialogOpen] = useState(false);
  const router = useRouter();

  // Carregar templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setError(null);
        const templatesData = await api.templates.getAll();
        setTemplates(templatesData);
      } catch (error: any) {
        console.error('Error loading templates:', error);
        setError(error.message || 'Erro ao carregar templates. Tente novamente.');
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
      setTemplates((prev) => prev.filter((t) => t._id !== id));
      router.refresh();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Erro ao excluir template. Tente novamente.');
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
          setError(error.message || 'Erro ao carregar templates. Tente novamente.');
        }
      };
      loadTemplates();
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-12 text-center flex flex-col items-center gap-4">
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
          <p className="text-destructive font-medium mb-2">Erro ao carregar templates</p>
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
                  setError(error.message || 'Erro ao carregar templates. Tente novamente.');
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
    <div className="space-y-8">
      {templates.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <FileStack className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum template criado ainda
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Crie templates para reutilizar em seus formulários
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template) => (
            <Card
              key={template._id}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    Template
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileStack className="w-4 h-4" />
                    <span>{template.questions.length} questão(ões)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Criado em{' '}
                      {format(new Date(template.createdAt), 'dd MMM yyyy', {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                      onClick={() => {
                        setFillingTemplate(template);
                        setIsFillDialogOpen(true);
                      }}
                    >
                      Preencher
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    {!template.isDefault && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
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
                                template._id && handleDelete(template._id)
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
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
        />
      )}

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
    </div>
  );
}
