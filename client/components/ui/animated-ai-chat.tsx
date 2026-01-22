"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  FileText,
  HelpCircle,
  Zap,
  MonitorIcon,
  Paperclip,
  SendIcon,
  XIcon,
  LoaderIcon,
  Command,
  Bot,
  User,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";
import { useSession } from "@/lib/auth-client";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY),
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight],
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
  action: string;
}

const COMMAND_SUGGESTIONS: CommandSuggestion[] = [
  {
    icon: <FileText className="w-4 h-4" />,
    label: "CRM e Processos",
    description: "Aprende a usar o sistema",
    prefix: "/crm",
    action: "Como funciona o CRM?",
  },
  {
    icon: <HelpCircle className="w-4 h-4" />,
    label: "Contactos",
    description: "Departamentos e equipas",
    prefix: "/contactos",
    action: "Quais são os contactos da MyCredit?",
  },
  {
    icon: <Zap className="w-4 h-4" />,
    label: "Onboarding",
    description: "Novos clientes e gestores",
    prefix: "/onboarding",
    action: "Como fazer onboarding de um cliente?",
  },
  {
    icon: <MonitorIcon className="w-4 h-4" />,
    label: "Sobre o Website",
    description: "Funcionalidades e navegação",
    prefix: "/website",
    action:
      "Como funciona o website? Quais são as principais funcionalidades disponíveis?",
  },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AnimatedAIChatProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  loading?: boolean;
  messages?: Message[];
  placeholder?: string;
  onQuickAction?: (action: string) => void;
  onClearHistory?: () => void;
}

export function AnimatedAIChat({
  value,
  onChange,
  onSend,
  loading = false,
  messages = [],
  placeholder = "Pergunta sobre os documentos...",
  onQuickAction,
  onClearHistory,
}: AnimatedAIChatProps) {
  const [attachments, setAttachments] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 56,
    maxHeight: 200,
  });
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const userName =
    session?.user?.name ||
    (session?.user as { firstName?: string })?.firstName ||
    "Utilizador";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Command palette logic
  useEffect(() => {
    if (value.startsWith("/") && !value.includes(" ")) {
      setShowCommandPalette(true);
      const matchingIndex = COMMAND_SUGGESTIONS.findIndex((cmd) =>
        cmd.prefix.startsWith(value),
      );
      setActiveSuggestion(matchingIndex >= 0 ? matchingIndex : -1);
    } else {
      setShowCommandPalette(false);
    }
  }, [value]);

  // Click outside to close command palette
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const commandButton = document.querySelector("[data-command-button]");

      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !commandButton?.contains(target)
      ) {
        setShowCommandPalette(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevenir scroll ao focar - Solução simplificada e eficaz
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let savedScrollY = 0;

    const preventScroll = () => {
      savedScrollY = window.scrollY;
      // Usar requestAnimationFrame para garantir que o scroll seja prevenido
      requestAnimationFrame(() => {
        if (Math.abs(window.scrollY - savedScrollY) > 1) {
          window.scrollTo({ top: savedScrollY, behavior: "instant" });
        }
      });
    };

    const handleFocus = () => {
      savedScrollY = window.scrollY;
      // Prevenir scroll após focus
      setTimeout(preventScroll, 0);
      setTimeout(preventScroll, 10);
    };

    const handleMouseDown = () => {
      savedScrollY = window.scrollY;
    };

    textarea.addEventListener("focus", handleFocus);
    textarea.addEventListener("mousedown", handleMouseDown);

    return () => {
      textarea.removeEventListener("focus", handleFocus);
      textarea.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev < COMMAND_SUGGESTIONS.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev > 0 ? prev - 1 : COMMAND_SUGGESTIONS.length - 1,
        );
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        if (activeSuggestion >= 0) {
          const selected = COMMAND_SUGGESTIONS[activeSuggestion];
          onChange(selected.prefix + " ");
          setShowCommandPalette(false);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowCommandPalette(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !loading) {
        onSend();
        adjustHeight(true);
      }
    }
  };

  const handleSendMessage = () => {
    if (value.trim() && !loading) {
      onSend();
      adjustHeight(true);
    }
  };

  const handleAttachFile = () => {
    const mockFileName = `file-${Math.floor(Math.random() * 1000)}.pdf`;
    setAttachments((prev) => [...prev, mockFileName]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const selectCommandSuggestion = (index: number) => {
    const selected = COMMAND_SUGGESTIONS[index];
    onChange(selected.prefix + " ");
    setShowCommandPalette(false);
  };

  const handleQuickAction = (action: string) => {
    // Preencher o input com a ação ao invés de enviar automaticamente
    onChange(action);
    // Focar no textarea para que o usuário possa editar
    setTimeout(() => {
      textareaRef.current?.focus();
      adjustHeight();
    }, 0);
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 relative">
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 min-h-0"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                Olá, {userName}
              </h2>
              <p className="text-sm text-muted-foreground">
                Como posso ajudar-te hoje?
              </p>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
              {COMMAND_SUGGESTIONS.map((suggestion, index) => (
                <motion.button
                  key={suggestion.prefix}
                  onClick={() => handleQuickAction(suggestion.action)}
                  className="flex flex-col items-start gap-2 p-4 rounded-lg border border-border/60 bg-card hover:bg-muted/40 hover:border-primary/40 transition-all text-left group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="w-10 h-10 rounded-md bg-primary/8 flex items-center justify-center text-primary group-hover:bg-primary/12 transition-colors">
                    {suggestion.icon}
                  </div>
                  <div className="w-full">
                    <p className="font-medium text-sm text-foreground mb-1">
                      {suggestion.label}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {suggestion.description}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Clear Button - Inline with messages */}
            {onClearHistory && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                  title="Limpar histórico"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground border-primary/20"
                      : "bg-muted text-muted-foreground border-border/50",
                  )}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message */}
                <div
                  className={cn(
                    "max-w-[80%] sm:max-w-[75%] rounded-lg px-4 py-2.5",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-foreground border border-border/50",
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div
                className="flex gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50">
                  <Bot className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="bg-muted/60 rounded-lg px-4 py-2.5 border border-border/50">
                  <TypingDots />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Clean Professional Design */}
      <div className="shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="relative">
            {/* Command Palette */}
            <AnimatePresence>
              {showCommandPalette && (
                <motion.div
                  ref={commandPaletteRef}
                  className="absolute left-0 right-0 bottom-full mb-2 bg-card rounded-lg z-50 shadow-lg border border-border overflow-hidden"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="py-1">
                    {COMMAND_SUGGESTIONS.map((suggestion, index) => (
                      <div
                        key={suggestion.prefix}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                          activeSuggestion === index
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:bg-muted/50",
                        )}
                        onClick={() => selectCommandSuggestion(index)}
                      >
                        <div className="w-5 h-5 flex items-center justify-center text-muted-foreground">
                          {suggestion.icon}
                        </div>
                        <div className="font-medium">{suggestion.label}</div>
                        <div className="text-muted-foreground/60 text-xs ml-auto">
                          {suggestion.prefix}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Container */}
            <div className="relative bg-card rounded-lg border border-border/60 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/10 transition-all shadow-sm">
              {/* Textarea */}
              <div className="p-4">
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => {
                    onChange(e.target.value);
                    adjustHeight();
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={(e) => {
                    // Prevenir scroll de forma simples
                    const scrollY = window.scrollY;
                    e.target.focus({ preventScroll: true });
                    requestAnimationFrame(() => {
                      if (window.scrollY !== scrollY) {
                        window.scrollTo({ top: scrollY, behavior: "instant" });
                      }
                    });
                  }}
                  placeholder={placeholder}
                  disabled={loading}
                  className={cn(
                    "w-full px-0 py-0",
                    "resize-none",
                    "bg-transparent",
                    "border-none",
                    "text-foreground text-sm",
                    "focus:outline-none",
                    "focus-visible:ring-0",
                    "placeholder:text-muted-foreground/60",
                    "min-h-[56px] leading-relaxed",
                  )}
                  style={{
                    overflow: "hidden",
                    scrollMargin: 0,
                  }}
                />
              </div>

              {/* Attachments */}
              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div
                    className="px-4 pb-3 flex gap-2 flex-wrap"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {attachments.map((file, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-2 text-xs bg-muted/50 py-1.5 px-3 rounded-md text-muted-foreground"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <span>{file}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-muted-foreground/60 hover:text-foreground transition-colors"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions Bar */}
              <div className="px-4 py-3 border-t border-border/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAttachFile}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                    title="Anexar ficheiro"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    data-command-button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCommandPalette((prev) => !prev);
                    }}
                    className={cn(
                      "p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors",
                      showCommandPalette && "bg-primary/10 text-foreground",
                    )}
                    title="Comandos"
                  >
                    <Command className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={loading || !value.trim()}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all",
                    "flex items-center gap-2",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    value.trim() && !loading
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {loading ? (
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <SendIcon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((dot) => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: dot * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
