'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AdminConsultasFiltersModal } from './admin-consultas-filters-modal';

export type TemplateFilter = string;
export type UserFilter = string;
export interface AdminConsultasFiltersState {
  templateId: TemplateFilter;
  userId: UserFilter;
  search: string;
  questionFilters: Record<string, string>;
}

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

interface AdminConsultasFiltersProps {
  templates: Array<{ _id?: string; title: string }>;
  users: User[];
  questions: Question[];
  questionValues: Record<string, string[]>;
  filters: AdminConsultasFiltersState;
  onFilterChange?: (filters: AdminConsultasFiltersState) => void;
}

export function AdminConsultasFilters({
  templates,
  users,
  questions,
  questionValues,
  filters,
  onFilterChange,
}: AdminConsultasFiltersProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Contar filtros ativos (apenas os do modal: questões)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.templateId !== 'all') count++;
    if (filters.userId !== 'all') count++;
    if (filters.search.trim()) count++;
    Object.values(filters.questionFilters).forEach((value) => {
      if (value && value !== 'all' && value.trim()) count++;
    });
    return count;
  }, [filters]);

  const handleSearchChange = (value: string) => {
    onFilterChange?.({
      ...filters,
      search: value,
    });
  };

  const clearSearch = () => {
    handleSearchChange('');
  };

  const hasActiveFilters = activeFiltersCount > 0;

  const handleClearAll = () => {
    onFilterChange?.({
      templateId: 'all',
      userId: 'all',
      search: '',
      questionFilters: {},
    });
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-semibold">Filtros</h2>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Template */}
            <div className="space-y-2">
              <Label htmlFor="filter-template" className="text-sm font-medium">
                Template
              </Label>
              <Select
                value={filters.templateId}
                onValueChange={(value) =>
                  onFilterChange?.({ ...filters, templateId: value })
                }
              >
                <SelectTrigger id="filter-template" className="w-full h-9">
                  <SelectValue placeholder="Todos os templates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os templates</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t._id} value={t._id ?? ''}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Utilizador */}
            <div className="space-y-2">
              <Label htmlFor="filter-user" className="text-sm font-medium">
                Utilizador
              </Label>
              <Select
                value={filters.userId}
                onValueChange={(value) =>
                  onFilterChange?.({ ...filters, userId: value })
                }
              >
                <SelectTrigger id="filter-user" className="w-full h-9">
                  <SelectValue placeholder="Todos os utilizadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os utilizadores</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u._id ?? u.id} value={u._id ?? u.id}>
                      {u.firstName || u.lastName || u.name || u.email}
                      {u.email ? ` (${u.email})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pesquisa */}
            <div className="space-y-2 lg:col-span-1">
              <Label htmlFor="filter-search" className="text-sm font-medium">
                Pesquisar
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="filter-search"
                  placeholder="Na lista..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 pr-9 h-9"
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Botão Filtros avançados */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(true)}
                className="gap-2 w-full sm:w-auto h-9"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros avançados
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdminConsultasFiltersModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        templates={templates}
        users={users}
        questions={questions}
        questionValues={questionValues}
        filters={filters}
        onFiltersChange={(newFilters) => {
          onFilterChange?.(newFilters);
        }}
        onApply={() => {}}
      />
    </>
  );
}
