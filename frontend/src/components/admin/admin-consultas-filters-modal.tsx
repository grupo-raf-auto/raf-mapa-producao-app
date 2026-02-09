import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  X,
  Briefcase,
  DollarSign,
  Calendar,
  Settings,
  ChevronRight,
  Filter,
} from 'lucide-react';
import type { AdminConsultasFiltersState } from './admin-consultas-filters';

interface Question {
  _id?: string;
  title: string;
  inputType?: string;
  options?: string[];
}

interface User {
  _id?: string;
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

interface AdminConsultasFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Array<{ _id?: string; title: string }>;
  users: User[];
  questions: Question[];
  questionValues: Record<string, string[]>;
  filters: AdminConsultasFiltersState;
  onFiltersChange: (filters: AdminConsultasFiltersState) => void;
  onApply: () => void;
}

type FilterCategory = 'main' | 'questions';

const getQuestionIcon = (inputType?: string) => {
  switch (inputType) {
    case 'select':
    case 'radio':
      return <Briefcase className="w-4 h-4" />;
    case 'number':
      return <DollarSign className="w-4 h-4" />;
    case 'date':
      return <Calendar className="w-4 h-4" />;
    default:
      return <Settings className="w-4 h-4" />;
  }
};

export function AdminConsultasFiltersModal({
  open,
  onOpenChange,
  templates,
  users,
  questions,
  questionValues,
  filters,
  onFiltersChange,
  onApply,
}: AdminConsultasFiltersModalProps) {
  const [localFilters, setLocalFilters] =
    useState<AdminConsultasFiltersState>(filters);
  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>('main');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );

  // Sincronizar filtros locais quando os filtros externos mudam
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (localFilters.templateId !== 'all') count++;
    if (localFilters.userId !== 'all') count++;
    if (localFilters.search.trim()) count++;
    Object.values(localFilters.questionFilters).forEach((value) => {
      if (value && value !== 'all' && value.trim()) count++;
    });
    return count;
  }, [localFilters]);

  // Obter badges de filtros aplicados por categoria
  const getCategoryBadges = (category: FilterCategory) => {
    const badges: string[] = [];
    if (category === 'main') {
      if (localFilters.templateId !== 'all') {
        const template = templates.find(
          (t) => t._id === localFilters.templateId,
        );
        if (template) badges.push(template.title);
      }
      if (localFilters.userId !== 'all') {
        const user = users.find((u) => (u._id || u.id) === localFilters.userId);
        if (user) {
          const userName =
            user.firstName || user.lastName || user.name || user.email;
          badges.push(`User: ${userName}`);
        }
      }
      if (localFilters.search.trim()) {
        badges.push(localFilters.search);
      }
    } else if (category === 'questions') {
      Object.entries(localFilters.questionFilters).forEach(
        ([questionId, value]) => {
          if (value && value !== 'all' && value.trim()) {
            const question = questions.find((q) => q._id === questionId);
            if (question) {
              badges.push(`${question.title}: ${value}`);
            }
          }
        },
      );
    }
    return badges;
  };

  const updateLocalFilter = (updates: Partial<AdminConsultasFiltersState>) => {
    setLocalFilters((prev) => ({ ...prev, ...updates }));
  };

  const updateQuestionFilter = (questionId: string, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      questionFilters: {
        ...prev.questionFilters,
        [questionId]: value === 'all' ? '' : value,
      },
    }));
  };

  const handleReset = () => {
    setLocalFilters({
      templateId: 'all',
      userId: 'all',
      search: '',
      questionFilters: {},
    });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalFilters(filters); // Reverter para filtros originais
    onOpenChange(false);
  };

  const renderMainFilters = () => (
    <div className="space-y-6 max-w-2xl">
      {/* User */}
      <div className="space-y-2">
        <Label htmlFor="user" className="text-sm font-medium">
          Utilizador
        </Label>
        <Select
          value={localFilters.userId}
          onValueChange={(value) => updateLocalFilter({ userId: value })}
        >
          <SelectTrigger id="user" className="h-10">
            <SelectValue placeholder="Todos os utilizadores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Utilizadores</SelectItem>
            {users.map((user) => (
              <SelectItem key={user._id || user.id} value={user._id || user.id}>
                {user.firstName || user.lastName || user.name || user.email}
                {user.email && ` (${user.email})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Template */}
      <div className="space-y-2">
        <Label htmlFor="template" className="text-sm font-medium">
          Template
        </Label>
        <Select
          value={localFilters.templateId}
          onValueChange={(value) => updateLocalFilter({ templateId: value })}
        >
          <SelectTrigger id="template" className="h-10">
            <SelectValue placeholder="Todos os templates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Templates</SelectItem>
            {templates.map((template) => (
              <SelectItem key={template._id} value={template._id || ''}>
                {template.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pesquisa */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-medium">
          Pesquisa Geral
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Pesquisar por template ou conteúdo..."
            value={localFilters.search}
            onChange={(e) => updateLocalFilter({ search: e.target.value })}
            className="pl-10 h-10"
          />
        </div>
      </div>
    </div>
  );

  const renderQuestionFilters = () => {
    if (!selectedQuestionId) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">
            Selecione uma questão para configurar o filtro
          </p>
        </div>
      );
    }

    const question = questions.find((q) => q._id === selectedQuestionId);
    if (!question) return null;

    const questionId = question._id || '';
    const currentValue = localFilters.questionFilters[questionId] || 'all';
    const values = questionValues[questionId] || [];
    const inputType = question.inputType || 'text';

    return (
      <div className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <Label className="text-base font-semibold">{question.title}</Label>
          <p className="text-sm text-muted-foreground">
            Configure o filtro para esta questão
          </p>
        </div>

        {inputType === 'select' || inputType === 'radio' ? (
          <div className="space-y-2">
            <Label
              htmlFor={`question-${questionId}`}
              className="text-sm font-medium"
            >
              Selecionar valor
            </Label>
            <Select
              value={currentValue}
              onValueChange={(value) => updateQuestionFilter(questionId, value)}
            >
              <SelectTrigger id={`question-${questionId}`} className="h-10">
                <SelectValue placeholder="Todas as opções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Opções</SelectItem>
                {values
                  .filter((v) => v && v.trim() !== '')
                  .sort()
                  .map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        ) : inputType === 'number' ? (
          <div className="space-y-2">
            <Label
              htmlFor={`question-${questionId}`}
              className="text-sm font-medium"
            >
              Valor
            </Label>
            <Input
              id={`question-${questionId}`}
              type="number"
              placeholder={`Filtrar por ${question.title.toLowerCase()}...`}
              value={currentValue === 'all' ? '' : currentValue}
              onChange={(e) => updateQuestionFilter(questionId, e.target.value)}
              className="h-10"
            />
          </div>
        ) : inputType === 'date' ? (
          <div className="space-y-2">
            <Label
              htmlFor={`question-${questionId}`}
              className="text-sm font-medium"
            >
              Data
            </Label>
            <Input
              id={`question-${questionId}`}
              type="date"
              value={currentValue === 'all' ? '' : currentValue}
              onChange={(e) => updateQuestionFilter(questionId, e.target.value)}
              className="h-10"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label
              htmlFor={`question-${questionId}`}
              className="text-sm font-medium"
            >
              Texto
            </Label>
            <Input
              id={`question-${questionId}`}
              type="text"
              placeholder={`Filtrar por ${question.title.toLowerCase()}...`}
              value={currentValue === 'all' ? '' : currentValue}
              onChange={(e) => updateQuestionFilter(questionId, e.target.value)}
              className="h-10"
            />
          </div>
        )}
      </div>
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Se está fechando sem aplicar, reverter filtros
      setLocalFilters(filters);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[95vw] lg:max-w-7xl xl:max-w-[90vw] 2xl:max-w-[1400px] h-[90vh] lg:h-[85vh] flex flex-col p-0"
        showCloseButton={true}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Filtros para: Todas as consultas
              </DialogTitle>
              <DialogDescription className="mt-1">
                Veja resultados na sua visualização com base nos filtros que
                selecionar aqui.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Painel Esquerdo - Categorias */}
          <div className="w-64 lg:w-80 xl:w-96 border-r bg-muted/30 flex flex-col shrink-0">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Filtros</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFiltersCount} aplicado
                    {activeFiltersCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Categoria: Principal */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('main');
                  setSelectedQuestionId(null);
                }}
                className={`w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors cursor-pointer ${
                  selectedCategory === 'main'
                    ? 'bg-muted border-r-2 border-primary'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      Filtros Principais
                    </div>
                    {getCategoryBadges('main').length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {getCategoryBadges('main')
                          .slice(0, 2)
                          .map((badge, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs px-1.5 py-0 h-5"
                            >
                              {badge.length > 15
                                ? `${badge.substring(0, 15)}...`
                                : badge}
                            </Badge>
                          ))}
                        {getCategoryBadges('main').length > 2 && (
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0 h-5"
                          >
                            +{getCategoryBadges('main').length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-muted-foreground shrink-0 ${
                    selectedCategory === 'main' ? 'text-primary' : ''
                  }`}
                />
              </button>

              <Separator />

              {/* Categoria: Questões */}
              <div className="p-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Questões
                </div>
              </div>

              {questions.map((question) => {
                const questionId = question._id || '';
                const hasFilter =
                  localFilters.questionFilters[questionId] &&
                  localFilters.questionFilters[questionId] !== 'all' &&
                  localFilters.questionFilters[questionId].trim() !== '';
                const isSelected = selectedQuestionId === questionId;

                return (
                  <button
                    key={questionId}
                    type="button"
                    onClick={() => {
                      setSelectedCategory('questions');
                      setSelectedQuestionId(questionId);
                    }}
                    className={`w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-muted border-r-2 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getQuestionIcon(question.inputType)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {question.title}
                        </div>
                        {hasFilter && (
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0 h-5 mt-1"
                          >
                            {localFilters.questionFilters[questionId]}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-muted-foreground shrink-0 ${
                        isSelected ? 'text-primary' : ''
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Contador de resultados (placeholder) */}
            <div className="p-4 border-t bg-muted/30">
              <div className="text-xs text-muted-foreground">
                Resultados serão exibidos após aplicar os filtros
              </div>
            </div>
          </div>

          {/* Painel Direito - Detalhes */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            {selectedCategory === 'main'
              ? renderMainFilters()
              : renderQuestionFilters()}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              onClick={handleApply}
              className="bg-primary hover:bg-primary/90"
            >
              Aplicar filtros
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
