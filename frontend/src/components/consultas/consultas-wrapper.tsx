'use client';

import { useState } from 'react';
import { ConsultasFilters } from './consultas-filters';
import { ConsultasList } from './consultas-list';
import type { ConsultasFiltersState } from './consultas-filters';

interface Submission {
  _id?: string;
  templateId: string;
  answers: {
    questionId: string;
    answer: string;
  }[];
  submittedAt: Date | string;
  formDate?: string | null;
  submittedBy: string;
}

interface Template {
  _id?: string;
  title: string;
  description?: string;
}

interface ConsultasWrapperProps {
  submissions: Submission[];
  templates: Template[];
  onSubmissionUpdate?: () => void;
}

export function ConsultasWrapper({
  submissions,
  templates,
  onSubmissionUpdate,
}: ConsultasWrapperProps) {
  const [filters, setFilters] = useState<ConsultasFiltersState>({
    templateId: 'all',
    status: 'all',
    inputType: 'all',
    search: '',
    banco: '',
    seguradora: '',
    valorMin: '',
    valorMax: '',
  });
  const [bancos, setBancos] = useState<string[]>([]);
  const [seguradoras, setSeguradoras] = useState<string[]>([]);

  return (
    <>
      <ConsultasFilters
        templates={templates}
        bancos={bancos}
        seguradoras={seguradoras}
        onFilterChange={setFilters}
      />
      <ConsultasList
        submissions={submissions}
        templates={templates}
        filters={filters}
        onSubmissionUpdate={onSubmissionUpdate}
        onBancosChange={setBancos}
        onSeguradorasChange={setSeguradoras}
      />
    </>
  );
}
