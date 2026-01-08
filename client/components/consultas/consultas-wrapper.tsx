'use client';

import { useState } from 'react';
import { ConsultasFilters } from './consultas-filters';
import { ConsultasList } from './consultas-list';
import type { ConsultasFiltersState } from './consultas-filters';

interface Question {
  _id?: string;
  title: string;
  description?: string;
  status: string;
  inputType?: 'text' | 'date' | 'select' | 'email' | 'tel' | 'number' | 'radio';
  options?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface Template {
  _id?: string;
  title: string;
  description?: string;
  questions: string[];
  questionsData: Question[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface ConsultasWrapperProps {
  templates: Template[];
  allQuestions: Question[];
}

export function ConsultasWrapper({ templates, allQuestions }: ConsultasWrapperProps) {
  const [filters, setFilters] = useState<ConsultasFiltersState>({
    templateId: 'all',
    status: 'all',
    inputType: 'all',
    search: '',
  });

  return (
    <>
      <ConsultasFilters templates={templates} onFilterChange={setFilters} />
      <ConsultasList
        templates={templates}
        allQuestions={allQuestions}
        filters={filters}
      />
    </>
  );
}
