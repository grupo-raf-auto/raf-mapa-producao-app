'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Send,
  Trash2,
  FileText,
  HelpCircle,
  Zap,
  Brain,
  Bot,
  User,
  MonitorIcon,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useSession } from '@/lib/auth-client';

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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
}

interface V0AIChatProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  loading?: boolean;
  messages?: Message[];
  placeholder?: string;
  title?: string;
  onQuickAction?: (action: string) => void;
  onClearHistory?: () => void;
}

const defaultQuickActions: QuickAction[] = [
  {
    icon: <FileText className="w-4 h-4" />,
    title: 'CRM e Processos',
    description: 'Aprende a usar o sistema',
    action: 'Como funciona o CRM?',
  },
  {
    icon: <HelpCircle className="w-4 h-4" />,
    title: 'Contactos',
    description: 'Departamentos e equipas',
    action: 'Quais são os contactos da MyCredit?',
  },
  {
    icon: <Zap className="w-4 h-4" />,
    title: 'Onboarding',
    description: 'Novos clientes e gestores',
    action: 'Como fazer onboarding de um cliente?',
  },
  {
    icon: <MonitorIcon className="w-4 h-4" />,
    title: 'Sobre o Website',
    description: 'Funcionalidades e navegação',
    action:
      'Como funciona o website? Quais são as principais funcionalidades disponíveis?',
  },
];

export function V0AIChat({
  value,
  onChange,
  onSend,
  loading = false,
  messages = [],
  placeholder = 'Pergunta sobre os documentos...',
  title = 'MySabichão',
  onQuickAction,
  onClearHistory,
}: V0AIChatProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 56,
    maxHeight: 200,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const userName =
    session?.user?.name ||
    (session?.user as { firstName?: string })?.firstName ||
    'Utilizador';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !loading) {
        onSend();
        adjustHeight(true);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    adjustHeight();
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto h-full bg-background min-h-0">
      {/* Header - Professional minimal design */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-border/40 shrink-0 px-1">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm sm:text-base text-foreground tracking-tight leading-tight truncate">
              {title}
            </h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Assistente inteligente
            </p>
          </div>
        </div>
        {messages.length > 0 && onClearHistory && (
          <button
            onClick={onClearHistory}
            className="p-1.5 sm:p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground shrink-0"
            title="Limpar histórico"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      {/* Welcome Message (when no messages) */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4 sm:py-8 px-3 sm:px-4 min-h-0 overflow-y-auto">
          <div className="mb-4 sm:mb-8 w-full">
            <h1 className="font-title text-xl sm:text-2xl md:text-3xl font-semibold text-foreground mb-2 sm:mb-2.5">
              Olá, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Como posso ajudar-te hoje?
            </p>
          </div>

          {/* Quick Action Cards - Professional clean style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 w-full max-w-3xl">
            {defaultQuickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => onQuickAction?.(action.action)}
                className="flex flex-col items-start gap-2 sm:gap-2.5 p-3 sm:p-4 rounded-lg border border-border/60 bg-card hover:bg-muted/40 hover:border-primary/40 transition-all text-left group shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-primary/8 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/12 transition-colors">
                  {action.icon}
                </div>
                <div className="min-w-0 w-full">
                  <p className="font-medium text-xs sm:text-sm text-foreground mb-0.5 sm:mb-1">
                    {action.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <p className="text-[10px] sm:text-xs text-muted-foreground/60 max-w-md mt-6 sm:mt-10 px-2">
            Pergunta sobre manuais, procedimentos, contactos e processos
            internos.
          </p>
        </div>
      )}

      {/* Messages Area - Professional clean chat bubbles */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-5 py-3 sm:py-4 px-2 sm:px-1 min-h-0 scroll-smooth">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-2.5 sm:gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 border',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground border-primary/20'
                    : 'bg-muted/80 text-muted-foreground border-border',
                )}
              >
                {message.role === 'user' ? (
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </div>
              {/* Message bubble */}
              <div
                className={cn(
                  'max-w-[80%] sm:max-w-[78%] rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-foreground border border-border/50',
                )}
              >
                <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5 sm:gap-3.5 animate-in fade-in">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted/80 flex items-center justify-center shrink-0 border border-border">
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              </div>
              <div className="bg-muted/60 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 border border-border/50">
                <Spinner
                  variant="bars"
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground"
                />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Area - Professional modern design */}
      <div className="mt-auto pt-3 sm:pt-4 border-t border-border/40 shrink-0 px-1">
        <div className="relative group">
          {/* Input container with professional styling */}
          <div className="relative bg-gradient-to-br from-card to-card/95 rounded-xl border border-border/60 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-lg transition-all duration-200 shadow-md hover:shadow-lg">
            {/* Decorative accent line */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 rounded-t-xl" />

            <Textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={loading}
              className={cn(
                'w-full px-4 sm:px-5 py-3.5 sm:py-4 pr-11 sm:pr-14',
                'resize-none',
                'bg-transparent',
                'border-none',
                'text-foreground text-sm sm:text-base',
                'focus:outline-none',
                'focus-visible:ring-0 focus-visible:ring-offset-0',
                'placeholder:text-muted-foreground/60 placeholder:text-sm sm:placeholder:text-base',
                'min-h-[56px] sm:min-h-[60px] leading-relaxed',
                'transition-all duration-200',
              )}
              style={{
                overflow: 'hidden',
              }}
            />

            {/* Send button with enhanced design */}
            <button
              type="button"
              onClick={onSend}
              disabled={!value.trim() || loading}
              className={cn(
                'absolute right-2 sm:right-3 bottom-2 sm:bottom-3',
                'w-9 h-9 sm:w-10 sm:h-10',
                'rounded-lg transition-all duration-200 cursor-pointer',
                'flex items-center justify-center',
                'shadow-sm',
                value.trim() && !loading
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:scale-105 active:scale-95'
                  : 'bg-muted/60 text-muted-foreground cursor-not-allowed opacity-50',
              )}
              aria-label="Enviar mensagem"
            >
              {loading ? (
                <Spinner variant="bars" className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>
        <p className="text-[10px] sm:text-[11px] text-muted-foreground/50 text-center mt-2 sm:mt-3 px-2">
          Respostas baseadas nos documentos internos. Verifica informação
          crítica.
        </p>
      </div>
    </div>
  );
}
