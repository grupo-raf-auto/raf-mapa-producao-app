'use client';

import { useState } from 'react';
import { ConsultasFilters } from './consultas-filters';
import { ConsultasList } from './consultas-list';
import type { FilterType, CategoryFilter, StatusFilter } from './consultas-filters';

interface Question {
  _id?: string;
  title: string;
  description?: string;
  category: string;
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

interface ConsultasWrapperProps {
  questions: Question[];
  categories: Category[];
}

export function ConsultasWrapper({ questions, categories }: ConsultasWrapperProps) {
  const [filters, setFilters] = useState({
    type: 'all' as FilterType,
    category: 'all' as CategoryFilter,
    status: 'all' as StatusFilter,
    search: '',
  });

  return (
    <>
      <ConsultasFilters onFilterChange={setFilters} />
      <ConsultasList
        questions={questions}
        categories={categories}
        filters={filters}
      />
    </>
  );
}
