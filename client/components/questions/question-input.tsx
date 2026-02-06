'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale/pt';
import { cn } from '@/lib/utils';

interface QuestionInputProps {
  question: {
    _id?: string;
    title: string;
    description?: string;
    inputType?:
      | 'text'
      | 'date'
      | 'select'
      | 'email'
      | 'tel'
      | 'number'
      | 'radio';
    options?: string[];
  };
  value?: string | Date;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export function QuestionInput({
  question,
  value,
  onChange,
  disabled,
}: QuestionInputProps) {
  const inputType = question.inputType || 'text';
  const hasValue = value && String(value).trim().length > 0;

  if (inputType === 'date') {
    const dateValue =
      value instanceof Date ? value : value ? new Date(value) : undefined;

    return (
      <Popover modal={false}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal text-sm min-h-[40px] h-auto py-3 ml-1',
              !dateValue && 'text-muted-foreground',
              dateValue && 'border-2 border-primary',
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? (
              format(dateValue, 'PPP', { locale: pt })
            ) : (
              <span>Selecione uma data</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[100000]" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => {
              if (date && onChange) {
                onChange(date.toISOString());
              }
            }}
            locale={pt}
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
        <SelectTrigger
          className={cn(
            'text-sm min-h-[40px] ml-1',
            hasValue && 'border-2 border-primary',
          )}
        >
          <SelectValue placeholder="Selecione uma opção" />
        </SelectTrigger>
        <SelectContent>
          {question.options && question.options.filter(opt => opt && opt.trim()).length > 0 ? (
            question.options
              .filter(opt => opt && opt.trim())
              .map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Nenhuma opção disponível
            </div>
          )}
        </SelectContent>
      </Select>
    );
  }

  if (inputType === 'radio') {
    return (
      <RadioGroup
        value={value as string}
        onValueChange={onChange}
        disabled={disabled}
      >
        {question.options && question.options.filter(opt => opt && opt.trim()).length > 0 ? (
          question.options
            .filter(opt => opt && opt.trim())
            .map((option, index) => (
              <div key={index} className="flex items-center space-x-2 ml-1 ">
                <RadioGroupItem value={option} id={`${question._id}-${index}`} />
                <Label
                  htmlFor={`${question._id}-${index}`}
                  className="font-normal cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))
        ) : (
          <div className="text-sm text-muted-foreground">
            Nenhuma opção disponível
          </div>
        )}
      </RadioGroup>
    );
  }

  // Para text, email, tel, number
  // Placeholders específicos apenas quando faz sentido
  const getPlaceholder = () => {
    if (inputType === 'email') return 'exemplo@email.com';
    if (inputType === 'tel') return '912 345 678';
    if (inputType === 'number') return '0';
    // Para text, não colocar placeholder
    return '';
  };

  return (
    <Input
      type={inputType}
      value={(value as string) || ''}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={getPlaceholder()}
      disabled={disabled}
      className={cn(
        'text-sm min-h-[40px] p-3 ml-1 ',
        hasValue && 'border-2 border-primary',
      )}
    />
  );
}
