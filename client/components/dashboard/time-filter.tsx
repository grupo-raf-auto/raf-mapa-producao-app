"use client";

import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TimeFilterType = "monthly" | "quarterly" | "yearly" | "last12months";

interface TimeFilterProps {
  value: TimeFilterType;
  onChange: (value: TimeFilterType) => void;
  className?: string;
}

export function TimeFilter({ value, onChange, className }: TimeFilterProps) {
  const options: { value: TimeFilterType; label: string }[] = [
    { value: "monthly", label: "Mensal" },
    { value: "quarterly", label: "Trimestral" },
    { value: "yearly", label: "Anual" },
    { value: "last12months", label: "Últimos 12 meses" },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border border-border/50">
        {options.map((option) => (
          <Button
            key={option.value}
            variant={value === option.value ? "default" : "ghost"}
            size="sm"
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 px-3 text-xs font-medium transition-all",
              value === option.value
                ? "bg-background shadow-sm border border-border/70 text-foreground"
                : "hover:bg-background/50 hover:text-foreground dark:hover:text-foreground",
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
