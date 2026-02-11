"use client";

import {
  StepsRoot,
  StepsList,
  StepsItem,
  StepsTrigger,
  StepsIndicator,
  StepsSeparator,
  StepsContent,
  StepsCompletedContent,
  StepsPrevTrigger,
  StepsNextTrigger,
} from "@ark-ui/react/steps";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepConfig {
  title: string;
  description?: string;
  content: React.ReactNode;
}

interface StepsWithContentProps {
  steps: StepConfig[];
  defaultStep?: number;
  step?: number;
  className?: string;
  children?: (stepIndex: number) => React.ReactNode;
  completedContent?: React.ReactNode;
  onStepChange?: (e: { step: number }) => void;
  hideFooter?: boolean;
  /** Quando true, só é possível avançar após concluir o passo anterior (não permite saltar passos) */
  linear?: boolean;
}

export function StepsWithContent({
  steps,
  defaultStep = 1,
  step: controlledStep,
  className,
  completedContent,
  onStepChange,
  hideFooter = false,
  linear = true,
}: StepsWithContentProps) {
  // Ark UI / zag-js Steps usa passo 0-based (0, 1, 2…). Exponemos 1-based (1, 2, 3…) ao parent.
  const displayStep = controlledStep ?? defaultStep; // 1-based para UI
  const libraryStep = displayStep - 1; // 0-based para StepsRoot

  return (
    <StepsRoot
      count={steps.length}
      defaultStep={0}
      {...(controlledStep != null && { step: libraryStep })}
      linear={linear}
      className={cn("w-full", className)}
      onStepChange={(e) => onStepChange?.({ step: e.step + 1 })}
    >
      {/* Progress bar no topo — sempre 1-based na UI */}
      <div className="mb-8">
        <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
          <span>
            Passo {displayStep} de {steps.length}
          </span>
          <span>{Math.round((displayStep / steps.length) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{
              width: `${(displayStep / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Lista de passos — indicadores + títulos */}
      <StepsList className="flex items-stretch gap-0 mb-8">
        {steps.map((step, index) => (
          <StepsItem
            key={index}
            index={index}
            className="relative flex flex-1 items-center"
          >
            <StepsTrigger
              className={cn(
                "group flex flex-col items-center gap-2.5 w-full py-0 rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                linear && "cursor-default [&[data-incomplete]]:pointer-events-none [&[data-incomplete]]:opacity-60"
              )}
            >
              <div className="flex items-center w-full">
                <StepsIndicator
                  className={cn(
                    "group/indicator flex shrink-0 items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 border-2",
                    "[&[data-complete]]:bg-primary [&[data-complete]]:text-primary-foreground [&[data-complete]]:border-primary",
                    "[&[data-current]]:bg-primary [&[data-current]]:text-primary-foreground [&[data-current]]:border-primary [&[data-current]]:ring-4 [&[data-current]]:ring-primary/20",
                    "[&[data-incomplete]]:bg-muted/80 [&[data-incomplete]]:text-muted-foreground [&[data-incomplete]]:border-border"
                  )}
                >
                  <span className="group-data-[complete=true]/indicator:hidden">
                    {index + 1}
                  </span>
                  <Check className="w-5 h-5 hidden group-data-[complete=true]/indicator:block shrink-0" />
                </StepsIndicator>
                {index < steps.length - 1 && (
                  <StepsSeparator
                    className="flex-1 h-0.5 mx-2 rounded-full bg-border transition-colors duration-300 [&[data-complete]]:bg-primary"
                  />
                )}
              </div>
              <span className="text-sm font-medium text-center max-w-[120px] leading-tight text-muted-foreground group-data-[complete=true]:text-foreground group-data-[current]:text-foreground">
                {step.title}
              </span>
            </StepsTrigger>
          </StepsItem>
        ))}
      </StepsList>

      {/* Área de conteúdo do passo atual */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 min-h-[200px]">
          {steps.map((step, index) => (
            <StepsItem key={index} index={index}>
              <StepsContent
                index={index}
                className={cn(
                  "text-muted-foreground transition-opacity duration-200",
                  "data-[current]:text-foreground data-[current]:opacity-100",
                  "data-[complete]:opacity-0 data-[complete]:absolute data-[complete]:pointer-events-none",
                  "data-[incomplete]:opacity-0 data-[incomplete]:absolute data-[incomplete]:pointer-events-none"
                )}
              >
                {step.content}
              </StepsContent>
            </StepsItem>
          ))}

          <StepsCompletedContent className="text-center py-8 text-muted-foreground">
            {completedContent ?? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Concluído</h3>
              </div>
            )}
          </StepsCompletedContent>
        </div>
      </div>

      {!hideFooter && (
        <div className="flex justify-between items-center mt-6 gap-4">
          <StepsPrevTrigger
            className={cn(
              "px-5 py-2.5 text-sm font-medium rounded-xl border transition-colors",
              "text-muted-foreground bg-background border-border hover:bg-muted hover:text-foreground",
              "disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            Anterior
          </StepsPrevTrigger>
          <StepsNextTrigger
            className={cn(
              "px-5 py-2.5 text-sm font-medium rounded-xl transition-colors",
              "text-primary-foreground bg-primary border border-primary hover:bg-primary/90",
              "disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            Continuar
          </StepsNextTrigger>
        </div>
      )}
    </StepsRoot>
  );
}

export {
  StepsRoot,
  StepsList,
  StepsItem,
  StepsTrigger,
  StepsIndicator,
  StepsSeparator,
  StepsContent,
  StepsCompletedContent,
  StepsPrevTrigger,
  StepsNextTrigger,
};
