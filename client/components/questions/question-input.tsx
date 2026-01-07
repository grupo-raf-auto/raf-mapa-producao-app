'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { cn } from '@/lib/utils';

interface QuestionInputProps {
  question: {
    _id?: string;
    title: string;
    description?: string;
    inputType?: 'text' | 'date' | 'select' | 'email' | 'tel' | 'number';
    options?: string[];
  };
  value?: string | Date;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export function QuestionInput({ question, value, onChange, disabled }: QuestionInputProps) {
  const inputType = question.inputType || 'text';

  if (inputType === 'date') {
    const dateValue = value instanceof Date ? value : value ? new Date(value) : undefined;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !dateValue && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? (
              format(dateValue, 'PPP', { locale: ptBR })
            ) : (
              <span>Selecione uma data</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => {
              if (date && onChange) {
                onChange(date.toISOString());
              }
            }}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    );
  }

  if (inputType === 'select') {
    return (
      <Select
        value={value as string}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione uma opção" />
        </SelectTrigger>
        <SelectContent>
          {question.options && question.options.length > 0 ? (
            question.options.map((option, index) => (
              <SelectItem key={index} value={option}>
                {option}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="" disabled>
              Nenhuma opção disponível
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    );
  }

  // Para text, email, tel, number
  return (
    <Input
      type={inputType}
      value={value as string || ''}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={question.description || `Digite ${question.title.toLowerCase()}`}
      disabled={disabled}
    />
  );
}
