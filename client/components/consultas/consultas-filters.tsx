'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
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
import { Search, X } from 'lucide-react';

export type TemplateFilter = string; // ID do template ou 'all'
export type StatusFilter = 'all' | 'active' | 'inactive';
export type InputTypeFilter =
  | 'all'
  | 'text'
  | 'date'
  | 'select'
  | 'email'
  | 'tel'
  | 'number'
  | 'radio';

export interface ConsultasFiltersState {
  templateId: TemplateFilter;
  status: StatusFilter; // Mantido para compatibilidade, mas não usado para submissões
  inputType: InputTypeFilter; // Mantido para compatibilidade, mas não usado para submissões
  search: string;
  banco: string;
  seguradora: string;
  valorMin: string;
  valorMax: string;
}

interface ConsultasFiltersProps {
  templates: Array<{ _id?: string; title: string }>;
  bancos?: string[];
  seguradoras?: string[];
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

export function ConsultasFilters({
  templates,
  bancos = [],
  seguradoras = [],
  onFilterChange,
}: ConsultasFiltersProps) {
  const [templateId, setTemplateId] = useState<TemplateFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [inputType, setInputType] = useState<InputTypeFilter>('all');
  const [search, setSearch] = useState('');
  const [banco, setBanco] = useState('');
  const [seguradora, setSeguradora] = useState('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');

  useEffect(() => {
    onFilterChange?.({
      templateId,
      status,
      inputType,
      search,
      banco,
      seguradora,
      valorMin,
      valorMax,
    });
  }, [
    templateId,
    status,
    inputType,
    search,
    banco,
    seguradora,
    valorMin,
    valorMax,
    onFilterChange,
  ]);

  const handleReset = () => {
    setTemplateId('all');
    setStatus('all');
    setInputType('all');
    setSearch('');
    setBanco('');
    setSeguradora('');
    setValorMin('');
    setValorMax('');
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
            className="text-muted-foreground cursor-pointer"
          >
            <X className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Filtro Primário: Template (nome do template do modelo ativo) */}
          <div>
            <Label
              htmlFor="template"
              className="text-xs text-muted-foreground mb-2 block"
            >
              Template
            </Label>
            <Select value="all" onValueChange={() => {}}>
              <SelectTrigger id="template">
                <SelectValue placeholder={templates[0]?.title ?? 'Template'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {templates[0]?.title ?? 'Template'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro: Banco */}
          <div>
            <Label
              htmlFor="banco"
              className="text-xs text-muted-foreground mb-2 block"
            >
              Banco
            </Label>
            <Select
              value={banco || 'all'}
              onValueChange={(value) => setBanco(value === 'all' ? '' : value)}
            >
              <SelectTrigger id="banco">
                <SelectValue placeholder="Todos os bancos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Bancos</SelectItem>
                {bancos
                  .filter((b) => b && b.trim() !== '')
                  .sort()
                  .map((bancoOption) => (
                    <SelectItem key={bancoOption} value={bancoOption}>
                      {bancoOption}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro: Seguradora */}
          <div>
            <Label
              htmlFor="seguradora"
              className="text-xs text-muted-foreground mb-2 block"
            >
              Seguradora
            </Label>
            <Select
              value={seguradora || 'all'}
              onValueChange={(value) =>
                setSeguradora(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger id="seguradora">
                <SelectValue placeholder="Todas as seguradoras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Seguradoras</SelectItem>
                {seguradoras
                  .filter((s) => s && s.trim() !== '')
                  .sort()
                  .map((seguradoraOption) => (
                    <SelectItem key={seguradoraOption} value={seguradoraOption}>
                      {seguradoraOption}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtro de Valor (Range) e Pesquisa */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="w-full md:w-auto md:max-w-[180px]">
            <Label
              htmlFor="valorMin"
              className="text-xs text-muted-foreground mb-2 block"
            >
              Valor Mínimo (€)
            </Label>
            <Input
              id="valorMin"
              type="number"
              placeholder="0.00"
              value={valorMin}
              onChange={(e) => setValorMin(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
          <div className="w-full md:w-auto md:max-w-[180px]">
            <Label
              htmlFor="valorMax"
              className="text-xs text-muted-foreground mb-2 block"
            >
              Valor Máximo (€)
            </Label>
            <Input
              id="valorMax"
              type="number"
              placeholder="999999.99"
              value={valorMax}
              onChange={(e) => setValorMax(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
          <div className="w-full md:w-full md:max-w-[650px] md:ml-24">
            <Label
              htmlFor="search"
              className="text-xs text-muted-foreground mb-2 block"
            >
              Pesquisar
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Pesquisar por template ou conteúdo..."
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
