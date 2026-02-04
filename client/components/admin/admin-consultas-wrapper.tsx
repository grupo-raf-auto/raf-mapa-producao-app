'use client';

import { useState } from 'react';
import { AdminConsultasFilters } from './admin-consultas-filters';
import { AdminConsultasList } from './admin-consultas-list';
import type { AdminConsultasFiltersState } from './admin-consultas-filters';

interface Submission {
  _id?: string;
  templateId: string;
  answers: { questionId: string; answer: string }[];
  submittedAt: Date | string;
  formDate?: string | null;
  submittedBy: string;
}

interface Template {
  _id?: string;
  title: string;
  description?: string;
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

interface AdminConsultasWrapperProps {
  submissions: Submission[];
  templates: Template[];
  questions: Question[];
  users: User[];
  onSubmissionUpdate?: () => void;
}

export function AdminConsultasWrapper({
  submissions,
  templates,
  questions,
  users,
  onSubmissionUpdate,
}: AdminConsultasWrapperProps) {
  const [filters, setFilters] = useState<AdminConsultasFiltersState>({
    templateId: 'all',
    userId: 'all',
    search: '',
    questionFilters: {},
  });
  const [questionValues, setQuestionValues] = useState<
    Record<string, string[]>
  >({});

  return (
    <>
      <AdminConsultasFilters
        templates={templates}
        users={users}
        questions={questions}
        questionValues={questionValues}
        filters={filters}
        onFilterChange={setFilters}
      />
      <AdminConsultasList
        submissions={submissions}
        templates={templates}
        questions={questions}
        users={users}
        filters={filters}
        onSubmissionUpdate={onSubmissionUpdate}
        onQuestionValuesChange={setQuestionValues}
      />
    </>
  );
}
