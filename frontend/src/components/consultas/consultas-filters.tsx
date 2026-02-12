import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { BorderRotate } from '@/components/ui/animated-gradient-border';
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

  const hasActiveFilters =
    templateId !== 'all' ||
    status !== 'all' ||
    inputType !== 'all' ||
    search.trim() !== '' ||
    banco !== '' ||
    seguradora !== '' ||
    valorMin !== '' ||
    valorMax !== '';

  return (
    <BorderRotate
      gradientColors={{ primary: '#5c1a1a', secondary: '#ef4444', accent: '#fca5a5' }}
      backgroundColor="var(--card)"
      borderRadius={16}
      borderWidth={2}
    >
    <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 md:p-6 space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Filtros</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className="text-muted-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 touch-manipulation shrink-0"
          >
            <X className="w-4 h-4 mr-2 shrink-0" />
            Limpar
          </Button>
        </div>

        {/* Pesquisa em destaque no mobile */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-xs font-medium text-muted-foreground">
            Pesquisar
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              id="search"
              placeholder="Template ou conteúdo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl min-h-[44px] border-border"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="space-y-2">
            <Label htmlFor="template" className="text-xs font-medium text-muted-foreground">
              Template
            </Label>
            <Select value="all" onValueChange={() => {}}>
              <SelectTrigger id="template" className="rounded-xl min-h-[44px]">
                <SelectValue placeholder={templates[0]?.title ?? 'Template'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{templates[0]?.title ?? 'Template'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="banco" className="text-xs font-medium text-muted-foreground">
              Banco
            </Label>
            <Select value={banco || 'all'} onValueChange={(value) => setBanco(value === 'all' ? '' : value)}>
              <SelectTrigger id="banco" className="rounded-xl min-h-[44px]">
                <SelectValue placeholder="Todos os bancos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os bancos</SelectItem>
                {bancos.filter((b) => b?.trim()).sort().map((bancoOption) => (
                  <SelectItem key={bancoOption} value={bancoOption}>{bancoOption}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2 md:col-span-2 lg:col-span-1">
            <Label htmlFor="seguradora" className="text-xs font-medium text-muted-foreground">
              Seguradora
            </Label>
            <Select value={seguradora || 'all'} onValueChange={(value) => setSeguradora(value === 'all' ? '' : value)}>
              <SelectTrigger id="seguradora" className="rounded-xl min-h-[44px]">
                <SelectValue placeholder="Todas as seguradoras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as seguradoras</SelectItem>
                {seguradoras.filter((s) => s?.trim()).sort().map((seguradoraOption) => (
                  <SelectItem key={seguradoraOption} value={seguradoraOption}>{seguradoraOption}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valorMin" className="text-xs font-medium text-muted-foreground">
              Valor mínimo (€)
            </Label>
            <Input
              id="valorMin"
              type="number"
              placeholder="0"
              value={valorMin}
              onChange={(e) => setValorMin(e.target.value)}
              step="0.01"
              min="0"
              className="rounded-xl min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valorMax" className="text-xs font-medium text-muted-foreground">
              Valor máximo (€)
            </Label>
            <Input
              id="valorMax"
              type="number"
              placeholder="999999.99"
              value={valorMax}
              onChange={(e) => setValorMax(e.target.value)}
              step="0.01"
              min="0"
              className="rounded-xl min-h-[44px]"
            />
          </div>
        </div>
      </div>
    </Card>
    </BorderRotate>
  );
}
