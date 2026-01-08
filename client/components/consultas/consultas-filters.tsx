'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

export type TemplateFilter = string; // ID do template ou 'all'
export type StatusFilter = 'all' | 'active' | 'inactive';
export type InputTypeFilter = 'all' | 'text' | 'date' | 'select' | 'email' | 'tel' | 'number' | 'radio';

export interface ConsultasFiltersState {
  templateId: TemplateFilter;
  status: StatusFilter;
  inputType: InputTypeFilter;
  search: string;
}

interface ConsultasFiltersProps {
  templates: Array<{ _id?: string; title: string }>;
  onFilterChange?: (filters: ConsultasFiltersState) => void;
}

const inputTypeLabels: Record<string, string> = {
  text: 'Texto',
  date: 'Data',
  select: 'Seleção',
  email: 'Email',
  tel: 'Telefone',
  number: 'Número',
  radio: 'Radio',
};

export function ConsultasFilters({ templates, onFilterChange }: ConsultasFiltersProps) {
  const [templateId, setTemplateId] = useState<TemplateFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [inputType, setInputType] = useState<InputTypeFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    onFilterChange?.({
      templateId,
      status,
      inputType,
      search,
    });
  }, [templateId, status, inputType, search, onFilterChange]);

  const handleReset = () => {
    setTemplateId('all');
    setStatus('all');
    setInputType('all');
    setSearch('');
  };

  return (
    <Card className="p-7 shadow-sm">
      <div className="space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Filtro Primário: Template */}
          <div>
            <Label htmlFor="template" className="text-xs text-muted-foreground mb-2 block">
              Template
            </Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="template">
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

          {/* Status */}
          <div>
            <Label htmlFor="status" className="text-xs text-muted-foreground mb-2 block">
              Status
            </Label>
            <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
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

          {/* Tipo de Input */}
          <div>
            <Label htmlFor="inputType" className="text-xs text-muted-foreground mb-2 block">
              Tipo de Input
            </Label>
            <Select value={inputType} onValueChange={(value) => setInputType(value as InputTypeFilter)}>
              <SelectTrigger id="inputType">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="select">Seleção</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="tel">Telefone</SelectItem>
                <SelectItem value="number">Número</SelectItem>
                <SelectItem value="radio">Radio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pesquisa */}
          <div>
            <Label htmlFor="search" className="text-xs text-muted-foreground mb-2 block">
              Pesquisar
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Título ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
