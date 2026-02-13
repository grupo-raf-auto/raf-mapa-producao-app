import { useEffect, useRef, useCallback } from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  FileText,
  HelpCircle,
  Zap,
  MonitorIcon,
  Paperclip,
  SendIcon,
  XIcon,
  Command,
  User,
  Trash2,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';
import * as React from 'react';
import { useSession } from '@/lib/auth-client';
import { Image } from '@/lib/router-compat';

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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

export interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
  action: string;
}

// Helper function to format message content with better styling
function formatMessageContent(content: string, role: 'user' | 'assistant') {
  if (role === 'user') {
    return content;
  }

  // Split by newlines
  const lines = content.split('\n');
  const result: JSX.Element[] = [];
  let currentListItems: {
    type: 'bullet' | 'numbered';
    text: JSX.Element[];
    key: number;
  }[] = [];
  let listKeyCounter = 0;

  const flushList = () => {
    if (currentListItems.length > 0) {
      const isNumbered = currentListItems[0].type === 'numbered';
      result.push(
        <ul
          key={`list-${listKeyCounter++}`}
          className={cn(
            'my-3 space-y-2',
            isNumbered ? 'list-decimal list-inside' : 'list-none space-y-1.5',
          )}
        >
          {currentListItems.map((item, idx) => (
            <li
              key={item.key}
              className={cn(
                'text-[15px] leading-relaxed pl-0.5',
                isNumbered ? 'ml-0 pl-1' : 'ml-2 flex gap-2 items-baseline',
              )}
            >
              {!isNumbered && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0 mt-[0.4em]" aria-hidden />
              )}
              <span className="min-w-0">{item.text}</span>
            </li>
          ))}
        </ul>,
      );
      currentListItems = [];
    }
  };

  lines.forEach((line, index) => {
    // Check for headers (# Header)
    if (line.startsWith('### ')) {
      flushList();
      result.push(
        <h3
          key={index}
          className="font-semibold text-[15px] mt-4 mb-1.5 text-foreground leading-tight"
        >
          {line.replace('### ', '')}
        </h3>,
      );
      return;
    }
    if (line.startsWith('## ')) {
      flushList();
      result.push(
        <h2 key={index} className="font-bold text-base mt-4 mb-1.5 text-foreground leading-tight">
          {line.replace('## ', '')}
        </h2>,
      );
      return;
    }
    if (line.startsWith('# ')) {
      flushList();
      result.push(
        <h1 key={index} className="font-bold text-lg mt-4 mb-1.5 text-foreground leading-tight">
          {line.replace('# ', '')}
        </h1>,
      );
      return;
    }

    // Check for bullet points (- item or * item)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const textParts = parseInlineFormatting(line.substring(2));
      currentListItems.push({
        type: 'bullet',
        text: textParts,
        key: index,
      });
      return;
    }

    // Check for numbered lists (1. item)
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      const textParts = parseInlineFormatting(numberedMatch[2]);
      currentListItems.push({
        type: 'numbered',
        text: textParts,
        key: index,
      });
      return;
    }

    // Check for horizontal rule (---)
    if (line.match(/^[-*_]{3,}$/)) {
      flushList();
      result.push(<hr key={index} className="my-4 border-border/50" />);
      return;
    }

    // Check for blockquotes (> text)
    if (line.startsWith('> ')) {
      flushList();
      result.push(
        <blockquote
          key={index}
          className="border-l-2 border-primary/50 pl-4 my-3 text-[15px] text-muted-foreground italic leading-relaxed"
        >
          {line.substring(2)}
        </blockquote>,
      );
      return;
    }

    // Check for multi-line code block start
    if (line.startsWith('```')) {
      flushList();
      const codeContent = line.slice(3);
      if (codeContent && codeContent.endsWith('```')) {
        result.push(
          <pre
            key={index}
            className="my-3 p-4 bg-muted/60 rounded-xl overflow-x-auto border border-border/50 text-[13px] font-mono leading-relaxed"
          >
            <code className="text-foreground/90 break-words">
              {codeContent.slice(0, -3)}
            </code>
          </pre>,
        );
      }
      return;
    }

    // Regular paragraph
    flushList();
    if (line.trim() === '') {
      result.push(<br key={index} />);
    } else {
      const textParts = parseInlineFormatting(line);
      result.push(
        <p
          key={index}
          className="my-2 text-[15px] leading-relaxed text-foreground/90 break-words"
        >
          {textParts}
        </p>,
      );
    }
  });

  flushList();
  return result;
}

// Helper to parse inline formatting (bold, code, links)
function parseInlineFormatting(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const regex = /(\*\*.+?\*\*|`[^`]+`|\[.+?\]\(.+?\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matched = match[0];

    if (matched.startsWith('**') && matched.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {matched.slice(2, -2)}
        </strong>,
      );
    } else if (matched.startsWith('`') && matched.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 bg-muted/80 rounded text-[13px] font-mono text-foreground"
        >
          {matched.slice(1, -1)}
        </code>,
      );
    } else if (matched.startsWith('[') && matched.includes('](')) {
      const linkMatch = matched.match(/\[(.+?)\]\((.+?)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {linkMatch[1]}
          </a>,
        );
      }
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

const DEFAULT_COMMAND_SUGGESTIONS: CommandSuggestion[] = [
  {
    icon: <FileText className="w-4 h-4" />,
    label: 'Sistema RAF',
    description: 'Como usar o sistema',
    prefix: '/sistema',
    action: 'Como funciona o sistema RAF Mapa Produção?',
  },
  {
    icon: <HelpCircle className="w-4 h-4" />,
    label: 'Formulários',
    description: 'Submeter e consultar',
    prefix: '/formularios',
    action: 'Como submeto e consulto os meus formulários?',
  },
  {
    icon: <Zap className="w-4 h-4" />,
    label: 'Ferramentas IA',
    description: 'Scanner, Texto e Sabichão',
    prefix: '/ferramentas',
    action: 'Quais são as ferramentas de IA disponíveis?',
  },
  {
    icon: <MonitorIcon className="w-4 h-4" />,
    label: 'Equipas e Métricas',
    description: 'Ver desempenho',
    prefix: '/equipas',
    action: 'Como vejo as métricas da minha equipa?',
  },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
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
  suggestions?: CommandSuggestion[];
}

export function AnimatedAIChat({
  value,
  onChange,
  onSend,
  loading = false,
  messages = [],
  placeholder = 'Pergunta sobre os documentos...',
  onQuickAction,
  onClearHistory,
  suggestions = DEFAULT_COMMAND_SUGGESTIONS,
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
    'Utilizador';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Command palette logic
  useEffect(() => {
    if (value.startsWith('/') && !value.includes(' ')) {
      setShowCommandPalette(true);
      const matchingIndex = suggestions.findIndex((cmd) =>
        cmd.prefix.startsWith(value),
      );
      setActiveSuggestion(matchingIndex >= 0 ? matchingIndex : -1);
    } else {
      setShowCommandPalette(false);
    }
  }, [value, suggestions]);

  // Click outside to close command palette
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const commandButton = document.querySelector('[data-command-button]');

      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !commandButton?.contains(target)
      ) {
        setShowCommandPalette(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
          window.scrollTo({ top: savedScrollY, behavior: 'instant' });
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

    textarea.addEventListener('focus', handleFocus);
    textarea.addEventListener('mousedown', handleMouseDown);

    return () => {
      textarea.removeEventListener('focus', handleFocus);
      textarea.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestion >= 0) {
          const selected = suggestions[activeSuggestion];
          onChange(selected.prefix + ' ');
          setShowCommandPalette(false);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandPalette(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
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
    const selected = suggestions[index];
    onChange(selected.prefix + ' ');
    setShowCommandPalette(false);
  };

  const handleQuickAction = (action: string) => {
    // Preencher o input com a ação ao invés de enviar automaticamente
    onChange(action);
    // Focar no textarea para que o utilizador possa editar
    setTimeout(() => {
      textareaRef.current?.focus();
      adjustHeight();
    }, 0);
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 relative">
      {/* Messages Area - scroll interno, input fixo abaixo */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 sm:px-6 py-8 min-h-0 bg-gradient-to-b from-background via-background to-background/80 scroll-smooth"
        style={{ touchAction: 'pan-y' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8 max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="space-y-4"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-black flex items-center justify-center shadow-lg shadow-black/25 border border-slate-800 p-3">
                <Image
                  src="/LogoMySabischao.png"
                  alt="MySabichão"
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                Olá,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500">
                  {userName}
                </span>
              </h2>
              <p className="text-base text-muted-foreground/80 font-medium max-w-md mx-auto">
                Como posso ajudar-te hoje?
              </p>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full pt-6">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion.prefix}
                  onClick={() => handleQuickAction(suggestion.action)}
                  className="flex flex-col items-start gap-3 p-4 rounded-2xl border border-border/40 bg-gradient-to-br from-white to-slate-50/50 backdrop-blur-sm hover:from-red-50/50 hover:to-slate-50 hover:border-red-400/50 transition-all duration-300 text-left group shadow-sm hover:shadow-md cursor-pointer"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, ease: 'easeOut' }}
                  whileHover={{ y: -2 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/15 to-red-400/10 flex items-center justify-center text-red-600 group-hover:from-red-500/25 group-hover:to-red-400/15 transition-all duration-300">
                    {suggestion.icon}
                  </div>
                  <div className="w-full">
                    <p className="font-semibold text-sm text-foreground">
                      {suggestion.label}
                    </p>
                    <p className="text-xs text-muted-foreground/70 leading-relaxed mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Clear Button - Inline with messages */}
            {onClearHistory && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
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
                  'flex gap-3 sm:gap-4',
                  message.role === 'user'
                    ? 'flex-row-reverse items-end'
                    : 'flex-row items-start',
                )}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.04,
                  ease: 'easeOut',
                }}
              >
                {/* Avatar - 40px, consistent with chat UI standards */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border',
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white border-red-500/30 shadow-sm'
                      : 'bg-black border-slate-800 shadow-sm p-1.5',
                  )}
                  aria-hidden
                >
                  {message.role === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Image
                      src="/LogoMySabischao.png"
                      alt="MySabichão"
                      width={40}
                      height={40}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                {/* Message bubble - max-width for readability, consistent padding */}
                <div
                  className={cn(
                    'flex flex-col gap-1 min-w-0',
                    message.role === 'user' ? 'items-end' : 'items-start',
                  )}
                >
                  {message.role === 'assistant' && (
                    <span className="text-xs text-muted-foreground font-medium px-0.5">
                      Assistente RAF
                    </span>
                  )}
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4',
                      'max-w-[min(90%,22rem)] sm:max-w-[min(85%,26rem)]',
                      'shadow-sm',
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-red-600 to-red-700 text-white'
                        : 'bg-white dark:bg-card text-foreground border border-border/60',
                    )}
                  >
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {formatMessageContent(message.content, message.role)}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-[11px] text-muted-foreground/60 px-0.5',
                      message.role === 'user' ? 'text-right' : 'text-left',
                    )}
                  >
                    {message.timestamp.toLocaleTimeString('pt-PT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div
                className="flex gap-3 sm:gap-4 items-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-10 h-10 rounded-xl bg-black border border-slate-800 shadow-sm flex items-center justify-center shrink-0 p-1.5">
                  <Image
                    src="/LogoMySabischao.png"
                    alt="MySabichão"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-xs text-muted-foreground font-medium px-0.5">
                    Assistente RAF
                  </span>
                  <div className="rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 max-w-[min(90%,22rem)] sm:max-w-[min(85%,26rem)] bg-white dark:bg-card border border-border/60 shadow-sm min-h-14 flex items-center">
                    <TypingDots />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - fixo na base, separado da área de scroll */}
      <div className="shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
          <div className="relative">
            {/* Command Palette */}
            <AnimatePresence>
              {showCommandPalette && (
                <motion.div
                  ref={commandPaletteRef}
                  className="absolute left-0 right-0 bottom-full mb-3 bg-white dark:bg-card rounded-2xl z-50 shadow-xl border border-border/60 overflow-hidden"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="py-1">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.prefix}
                        className={cn(
                          'flex items-center gap-2 px-4 py-3 text-xs transition-colors cursor-pointer',
                          activeSuggestion === index
                            ? 'bg-primary/10 text-foreground'
                            : 'text-muted-foreground hover:bg-muted/50',
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
            <div className="relative bg-white dark:bg-card rounded-2xl border border-border/60 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm">
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
                        window.scrollTo({ top: scrollY, behavior: 'instant' });
                      }
                    });
                  }}
                  placeholder={placeholder}
                  disabled={loading}
                  className={cn(
                    'w-full px-0 py-0',
                    'resize-none',
                    'bg-transparent',
                    'border-none',
                    'text-foreground text-sm',
                    'focus:outline-none',
                    'focus-visible:ring-0',
                    'placeholder:text-muted-foreground/60',
                    'min-h-[56px] leading-relaxed',
                  )}
                  style={{
                    overflowY: 'auto',
                    scrollMargin: 0,
                    touchAction: 'pan-y',
                  }}
                />
              </div>

              {/* Attachments */}
              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div
                    className="px-4 pb-3 flex gap-2 flex-wrap"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
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
                          className="text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
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
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all cursor-pointer"
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
                      'p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all cursor-pointer',
                      showCommandPalette && 'bg-primary/10 text-foreground',
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
                    'px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer',
                    'flex items-center gap-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    value.trim() && !loading
                      ? 'bg-gradient-to-r from-primary to-red-600 text-white hover:shadow-md'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {loading ? (
                    <Spinner variant="bars" className="w-4 h-4" />
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
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((dot) => (
        <motion.div
          key={dot}
          className="w-2 h-2 bg-primary/60 rounded-full"
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: dot * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
