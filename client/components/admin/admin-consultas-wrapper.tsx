"use client";

import { useState } from "react";
import { AdminConsultasFilters } from "./admin-consultas-filters";
import { AdminConsultasList } from "./admin-consultas-list";
import type { AdminConsultasFiltersState } from "./admin-consultas-filters";

interface Submission {
  _id?: string;
  templateId: string;
  answers: {
    questionId: string;
    answer: string;
  }[];
  submittedAt: Date | string;
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

interface AdminConsultasWrapperProps {
  submissions: Submission[];
  templates: Template[];
  questions: Question[];
  onSubmissionUpdate?: () => void;
}

export function AdminConsultasWrapper({
  submissions,
  templates,
  questions,
  onSubmissionUpdate,
}: AdminConsultasWrapperProps) {
  const [filters, setFilters] = useState<AdminConsultasFiltersState>({
    templateId: "all",
    search: "",
    questionFilters: {},
  });
  const [questionValues, setQuestionValues] = useState<Record<string, string[]>>({});

  return (
    <>
      <AdminConsultasFilters
        templates={templates}
        questions={questions}
        questionValues={questionValues}
        filters={filters}
        onFilterChange={setFilters}
      />
      <AdminConsultasList
        submissions={submissions}
        templates={templates}
        questions={questions}
        filters={filters}
        onSubmissionUpdate={onSubmissionUpdate}
        onQuestionValuesChange={setQuestionValues}
      />
    </>
  );
}
