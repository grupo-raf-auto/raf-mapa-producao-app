'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
  templateTitle?: string;
}

interface ConsultasDataTableProps {
  questions: Question[];
  filters: ConsultasFiltersState;
}

type SortField = 'title' | 'status' | 'inputType' | 'createdAt' | 'updatedAt' | 'templateTitle';
type SortDirection = 'asc' | 'desc' | null;

const inputTypeLabels: Record<string, string> = {
  text: 'Texto',
  date: 'Data',
  select: 'Seleção',
  email: 'Email',
  tel: 'Telefone',
  number: 'Número',
  radio: 'Radio',
};

export function ConsultasDataTable({
  questions,
  filters,
}: ConsultasDataTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Ciclar: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedQuestions = useMemo(() => {
    if (!sortField || !sortDirection) {
      return questions;
    }

    return [...questions].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'inputType':
          aValue = a.inputType || '';
          bValue = b.inputType || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'templateTitle':
          aValue = a.templateTitle?.toLowerCase() || '';
          bValue = b.templateTitle?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [questions, sortField, sortDirection]);

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field;
    const currentDirection = isActive ? sortDirection : null;

    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 lg:px-3 -ml-3 hover:bg-transparent"
        onClick={() => handleSort(field)}
      >
        {children}
        {currentDirection === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : currentDirection === 'desc' ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
      </Button>
    );
  };

  return (
    <Card className="shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px] px-6 py-4">
              <SortButton field="title">Título</SortButton>
            </TableHead>
            <TableHead className="w-[150px] px-6 py-4">
              <SortButton field="templateTitle">Template</SortButton>
            </TableHead>
            <TableHead className="w-[120px] px-6 py-4">
              <SortButton field="status">Status</SortButton>
            </TableHead>
            <TableHead className="w-[120px] px-6 py-4">
              <SortButton field="inputType">Tipo de Input</SortButton>
            </TableHead>
            <TableHead className="w-[300px] px-6 py-4">Descrição</TableHead>
            <TableHead className="w-[150px] px-6 py-4">
              <SortButton field="createdAt">Criado em</SortButton>
            </TableHead>
            <TableHead className="w-[150px] px-6 py-4">
              <SortButton field="updatedAt">Atualizado em</SortButton>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedQuestions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center px-6 py-12 text-muted-foreground">
                Nenhuma questão encontrada com os filtros aplicados
              </TableCell>
            </TableRow>
          ) : (
            sortedQuestions.map((question) => (
              <TableRow key={question._id} className="hover:bg-muted/50">
                <TableCell className="font-medium px-6 py-4">{question.title}</TableCell>
                <TableCell className="px-6 py-4">
                  {question.templateTitle ? (
                    <Badge variant="outline">{question.templateTitle}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge
                    variant={question.status === 'active' ? 'default' : 'secondary'}
                  >
                    {question.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4">
                  {question.inputType ? (
                    <Badge variant="outline">
                      {inputTypeLabels[question.inputType] || question.inputType}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm px-6 py-4">
                  {question.description || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm px-6 py-4">
                  {format(new Date(question.createdAt), "dd MMM yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm px-6 py-4">
                  {question.updatedAt &&
                  new Date(question.updatedAt).getTime() !==
                    new Date(question.createdAt).getTime()
                    ? format(new Date(question.updatedAt), "dd MMM yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })
                    : '-'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
