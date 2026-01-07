'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import {
  HelpCircle,
  FolderTree,
  Calendar,
  Tag,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type {
  FilterType,
  CategoryFilter,
  StatusFilter,
} from './consultas-filters';

interface Question {
  _id?: string;
  title: string;
  description?: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface Category {
  _id?: string;
  name: string;
  description?: string;
  createdAt: Date | string;
}

interface ConsultasListProps {
  questions: Question[];
  categories: Category[];
  filters?: {
    type: FilterType;
    category: CategoryFilter;
    status: StatusFilter;
    search: string;
  };
}

const categoryColors: Record<string, string> = {
  Finance: 'bg-blue-100 text-blue-800',
  Marketing: 'bg-purple-100 text-purple-800',
  HR: 'bg-green-100 text-green-800',
  Tech: 'bg-orange-100 text-orange-800',
  Custom: 'bg-gray-100 text-gray-800',
};

export function ConsultasList({
  questions,
  categories,
  filters: externalFilters,
}: ConsultasListProps) {
  const [activeTab, setActiveTab] = useState<
    'all' | 'questions' | 'categories'
  >('all');
  const [filters, setFilters] = useState({
    type: 'all' as FilterType,
    category: 'all' as CategoryFilter,
    status: 'all' as StatusFilter,
    search: '',
  });

  // Sincronizar filtros externos se fornecidos
  useEffect(() => {
    if (externalFilters) {
      setFilters(externalFilters);
      if (externalFilters.type !== 'all') {
        setActiveTab(externalFilters.type);
      }
    }
  }, [externalFilters]);

  const filteredData = useMemo(() => {
    let filteredQuestions = questions;
    let filteredCategories = categories;

    // Aplicar filtro de tipo
    if (filters.type === 'questions' || activeTab === 'questions') {
      filteredCategories = [];
    } else if (filters.type === 'categories' || activeTab === 'categories') {
      filteredQuestions = [];
    }

    // Aplicar filtro de pesquisa
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredQuestions = filteredQuestions.filter(
        (q) =>
          q.title.toLowerCase().includes(searchLower) ||
          q.description?.toLowerCase().includes(searchLower)
      );
      filteredCategories = filteredCategories.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro de categoria removido das questões

    // Aplicar filtro de status
    if (filters.status !== 'all') {
      filteredQuestions = filteredQuestions.filter(
        (q) => q.status === filters.status
      );
    }

    return {
      questions: filteredQuestions,
      categories: filteredCategories,
    };
  }, [questions, categories, filters, activeTab]);

  const totalItems =
    filteredData.questions.length + filteredData.categories.length;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">Todos ({totalItems})</TabsTrigger>
          <TabsTrigger value="questions">
            Questões ({filteredData.questions.length})
          </TabsTrigger>
          <TabsTrigger value="categories">
            Categorias ({filteredData.categories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {/* Questões */}
          {filteredData.questions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Questões ({filteredData.questions.length})
              </h3>
              {filteredData.questions.map((question) => (
                <Card
                  key={question._id}
                  className="shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-foreground">
                            {question.title}
                          </h4>
                          <Badge
                            variant={
                              question.status === 'active'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {question.status === 'active' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Inativo
                              </>
                            )}
                          </Badge>
                        </div>
                        {question.description && (
                          <p className="text-sm text-muted-foreground">
                            {question.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Criado em{' '}
                            {format(
                              new Date(question.createdAt),
                              "dd MMM yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </span>
                          {question.updatedAt &&
                            new Date(question.updatedAt).getTime() !==
                              new Date(question.createdAt).getTime() && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Atualizado em{' '}
                                {format(
                                  new Date(question.updatedAt),
                                  "dd MMM yyyy 'às' HH:mm",
                                  { locale: ptBR }
                                )}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Categorias */}
          {filteredData.categories.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <FolderTree className="w-5 h-5" />
                Categorias ({filteredData.categories.length})
              </h3>
              {filteredData.categories.map((category) => (
                <Card
                  key={category._id}
                  className="shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-foreground">
                            {category.name}
                          </h4>
                          <Badge
                            className={
                              categoryColors[category.name] ||
                              categoryColors.Custom
                            }
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {category.name}
                          </Badge>
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Criado em{' '}
                            {format(
                              new Date(category.createdAt),
                              "dd MMM yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {totalItems === 0 && (
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Nenhum resultado encontrado com os filtros aplicados
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-4 mt-6">
          {filteredData.questions.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Nenhuma questão encontrada
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredData.questions.map((question) => (
              <Card
                key={question._id}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-foreground">
                          {question.title}
                        </h4>
                        <Badge
                          variant={
                            question.status === 'active'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {question.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Inativo
                            </>
                          )}
                        </Badge>
                      </div>
                      {question.description && (
                        <p className="text-sm text-muted-foreground">
                          {question.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Criado em{' '}
                          {format(
                            new Date(question.createdAt),
                            "dd MMM yyyy 'às' HH:mm",
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-6">
          {filteredData.categories.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Nenhuma categoria encontrada
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredData.categories.map((category) => (
              <Card
                key={category._id}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-foreground">
                          {category.name}
                        </h4>
                        <Badge
                          className={
                            categoryColors[category.name] ||
                            categoryColors.Custom
                          }
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {category.name}
                        </Badge>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Criado em{' '}
                          {format(
                            new Date(category.createdAt),
                            "dd MMM yyyy 'às' HH:mm",
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
