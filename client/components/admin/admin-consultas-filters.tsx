"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminConsultasFiltersModal } from "./admin-consultas-filters-modal";

export type TemplateFilter = string;
export interface AdminConsultasFiltersState {
  templateId: TemplateFilter;
  search: string;
  questionFilters: Record<string, string>;
}

interface Question {
  _id?: string;
  title: string;
  inputType?: string;
  options?: string[];
}

interface AdminConsultasFiltersProps {
  templates: Array<{ _id?: string; title: string }>;
  questions: Question[];
  questionValues: Record<string, string[]>;
  filters: AdminConsultasFiltersState;
  onFilterChange?: (filters: AdminConsultasFiltersState) => void;
}

export function AdminConsultasFilters({
  templates,
  questions,
  questionValues,
  filters,
  onFilterChange,
}: AdminConsultasFiltersProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.templateId !== "all") count++;
    if (filters.search.trim()) count++;
    Object.values(filters.questionFilters).forEach((value) => {
      if (value && value !== "all" && value.trim()) count++;
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
    handleSearchChange("");
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Barra de Pesquisa */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar na lista..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10 h-9"
          />
          {filters.search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botão de Filtros */}
        <Button
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className="gap-2 shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      <AdminConsultasFiltersModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        templates={templates}
        questions={questions}
        questionValues={questionValues}
        filters={filters}
        onFiltersChange={(newFilters) => {
          onFilterChange?.(newFilters);
        }}
        onApply={() => {
          // Filtros já foram aplicados no onFiltersChange
        }}
      />
    </>
  );
}
