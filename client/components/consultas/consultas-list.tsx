'use client';

import { useMemo } from 'react';
import { ConsultasDataTable } from './consultas-data-table';
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

interface ConsultasListProps {
  templates: Template[];
  allQuestions: Question[];
  filters: ConsultasFiltersState;
}

export function ConsultasList({
  templates,
  allQuestions,
  filters,
}: ConsultasListProps) {
  // Criar lista plana de questões com informações do template
  const questionsWithTemplate = useMemo(() => {
    const questionsList: Array<Question & { templateTitle?: string }> = [];

    templates.forEach((template) => {
      template.questionsData.forEach((question) => {
        questionsList.push({
          ...question,
          templateTitle: template.title,
        });
      });
    });

    return questionsList;
  }, [templates]);

  // Aplicar filtros
  const filteredQuestions = useMemo(() => {
    return questionsWithTemplate.filter((question) => {
      // Filtro de template
      if (filters.templateId !== 'all') {
        const template = templates.find((t) => t._id === filters.templateId);
        if (!template || !template.questionsData.some((q) => q._id === question._id)) {
          return false;
        }
      }

      // Filtro de status
      if (filters.status !== 'all' && question.status !== filters.status) {
        return false;
      }

      // Filtro de tipo de input
      if (filters.inputType !== 'all') {
        if (!question.inputType || question.inputType !== filters.inputType) {
          return false;
        }
      }

      // Filtro de pesquisa
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = question.title.toLowerCase().includes(searchLower);
        const matchesDescription = question.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription) {
          return false;
        }
      }

      return true;
    });
  }, [questionsWithTemplate, filters, templates]);

  return (
    <div className="space-y-8 py-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {filteredQuestions.length}{' '}
            {filteredQuestions.length === 1 ? 'questão encontrada' : 'questões encontradas'}
          </h2>
        </div>
      </div>

      <ConsultasDataTable questions={filteredQuestions} filters={filters} />
    </div>
  );
}
