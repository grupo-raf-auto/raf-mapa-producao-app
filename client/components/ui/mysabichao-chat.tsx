"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  FileUp,
  MonitorIcon,
  CircleUserRound,
  ArrowUpIcon,
  Paperclip,
  Code2,
  Palette,
  Layers,
  Rocket,
} from "lucide-react";

interface AutoResizeProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`; // reset first
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity),
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight],
  );

  useEffect(() => {
    if (textareaRef.current)
      textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

export default function RuixenMoonChat() {
  const [message, setMessage] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  });

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background via-background to-muted/20 flex flex-col items-center justify-center min-h-[80vh]">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-title font-bold text-foreground mb-2">
          MySabichão
        </h1>
        <p className="text-muted-foreground text-lg">
          Seu assistente IA para desenvolvimento e criatividade
        </p>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl space-y-8">
        {/* Input Section */}
        <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border shadow-lg">
          <div className="p-6">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                adjustHeight();
              }}
              placeholder="Digite sua solicitação ou pergunta..."
              className={cn(
                "w-full resize-none border-0 bg-transparent",
                "text-base text-foreground placeholder:text-muted-foreground",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "min-h-[60px] leading-relaxed",
              )}
              style={{ overflow: "hidden" }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between px-6 pb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Anexar
              </Button>
            </div>

            <Button
              disabled={!message.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <ArrowUpIcon className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction
            icon={<Code2 className="w-5 h-5" />}
            label="Gerar Código"
          />
          <QuickAction
            icon={<Rocket className="w-5 h-5" />}
            label="Lançar App"
          />
          <QuickAction
            icon={<Layers className="w-5 h-5" />}
            label="Componentes UI"
          />
          <QuickAction
            icon={<Palette className="w-5 h-5" />}
            label="Ideias de Tema"
          />
          <QuickAction
            icon={<CircleUserRound className="w-5 h-5" />}
            label="Painel Usuário"
          />
          <QuickAction
            icon={<MonitorIcon className="w-5 h-5" />}
            label="Página Inicial"
          />
          <QuickAction
            icon={<FileUp className="w-5 h-5" />}
            label="Upload Docs"
          />
          <QuickAction
            icon={<ImageIcon className="w-5 h-5" />}
            label="Ativos Imagem"
          />
        </div>

        {/* Footer Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Comece digitando acima ou selecione uma ação rápida para começar
          </p>
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
}

function QuickAction({ icon, label }: QuickActionProps) {
  return (
    <Button
      variant="outline"
      className="h-auto p-4 flex flex-col items-center gap-3 text-center hover:bg-accent hover:border-primary/50 transition-colors"
    >
      <div className="text-primary">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
}
