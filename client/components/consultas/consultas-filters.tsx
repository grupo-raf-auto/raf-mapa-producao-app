'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

export type FilterType = 'all' | 'questions' | 'categories' | 'forms';
export type CategoryFilter = 'all' | 'Finance' | 'Marketing' | 'HR' | 'Tech' | 'Custom';
export type StatusFilter = 'all' | 'active' | 'inactive';

interface ConsultasFiltersProps {
  onFilterChange?: (filters: {
    type: FilterType;
    category: CategoryFilter;
    status: StatusFilter;
    search: string;
  }) => void;
}

export function ConsultasFilters({ onFilterChange }: ConsultasFiltersProps) {
  const [type, setType] = useState<FilterType>('all');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const updateFilters = (updates: Partial<{ type: FilterType; category: CategoryFilter; status: StatusFilter; search: string }>) => {
    const newType = updates.type ?? type;
    const newCategory = updates.category ?? category;
    const newStatus = updates.status ?? status;
    const newSearch = updates.search ?? search;

    if (updates.type !== undefined) setType(newType);
    if (updates.category !== undefined) setCategory(newCategory);
    if (updates.status !== undefined) setStatus(newStatus);
    if (updates.search !== undefined) setSearch(newSearch);

    onFilterChange?.({
      type: newType,
      category: newCategory,
      status: newStatus,
      search: newSearch,
    });
  };

  const handleReset = () => {
    updateFilters({
      type: 'all',
      category: 'all',
      status: 'all',
      search: '',
    });
  };

  return (
    <Card className="p-5 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Filtros</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search" className="text-xs text-muted-foreground mb-2 block">
              Pesquisar
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => {
                  updateFilters({ search: e.target.value });
                }}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="type" className="text-xs text-muted-foreground mb-2 block">
              Tipo
            </Label>
            <Select
              value={type}
              onValueChange={(value) => {
                updateFilters({ type: value as FilterType });
              }}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="questions">Questões</SelectItem>
                <SelectItem value="categories">Categorias</SelectItem>
                <SelectItem value="forms">Formulários</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category" className="text-xs text-muted-foreground mb-2 block">
              Categoria
            </Label>
            <Select
              value={category}
              onValueChange={(value) => {
                updateFilters({ category: value as CategoryFilter });
              }}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Tech">Tech</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status" className="text-xs text-muted-foreground mb-2 block">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(value) => {
                updateFilters({ status: value as StatusFilter });
              }}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
}
