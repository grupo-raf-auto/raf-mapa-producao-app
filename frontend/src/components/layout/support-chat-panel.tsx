import { useState, FormEvent, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Send, X, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient as api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSupportChat } from '@/contexts/support-chat-context';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function SupportChatPanel() {
  const ctx = useSupportChat();
  const open = ctx?.open ?? false;
  const closeChat = ctx?.closeChat ?? (() => {});
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const messageToSend = input.trim();
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const cleanConvId = conversationId?.replace(/^support-/, '') || undefined;
      const response = await api.chat.sendMessage(
        messageToSend,
        cleanConvId,
        'support',
      );

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(response.conversationId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao enviar mensagem: ' + errorMessage);
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  if (!open) return null;

  const panelContent = (
    <>
      {/* Backdrop apenas em mobile — desktop: painel fixo ao lado, sem modal */}
      <div
        className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-[2px] md:hidden"
        onClick={closeChat}
        aria-hidden
      />

      {/* Panel — full screen mobile; no desktop altura do container (não full screen) */}
      <div
        className={cn(
          'fixed z-[101] flex flex-col bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 shadow-2xl',
          'inset-0 md:inset-auto md:left-[calc(220px+1rem)] lg:left-[calc(260px+1rem)] md:right-5 lg:right-6 xl:right-8 md:top-5 lg:top-6 xl:top-8 md:h-[calc(100vh-2.5rem)] lg:h-[calc(100vh-3rem)] xl:h-[calc(100vh-4rem)] md:w-[min(400px,calc(100vw-220px-2.25rem))] lg:w-[min(400px,calc(100vw-260px-2.5rem))] xl:w-[min(400px,calc(100vw-260px-3rem))]',
          'rounded-none md:rounded-2xl border-0 md:border border-slate-200 dark:border-slate-800',
          'animate-in slide-in-from-right-4 md:slide-in-from-left-2 duration-200',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Assistente IA de suporte"
      >
        {/* Header — safe area on mobile */}
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 md:gap-4 shrink-0 min-h-[56px]">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/25 shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">
              Assistente RAF
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Suporte inteligente 24/7
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-medium text-green-700 dark:text-green-400">Online</span>
          </div>
          <button
            type="button"
            onClick={closeChat}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            aria-label="Fechar assistente"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-5 space-y-4 bg-slate-50 dark:bg-slate-900/50 relative min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[280px] text-center px-4 md:px-6 py-6 md:py-8">
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-20">
                <div className="absolute top-20 left-10 w-32 h-32 bg-red-100 dark:bg-red-900 rounded-full blur-3xl" />
                <div className="absolute bottom-40 right-10 w-40 h-40 bg-slate-200 dark:bg-slate-800 rounded-full blur-3xl" />
              </div>
              <div className="relative z-10 w-full max-w-[320px]">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-800/30 flex items-center justify-center mx-auto mb-4 md:mb-5 shadow-sm border border-red-100 dark:border-red-800/50">
                  <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Como posso ajudar?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Estou aqui para responder às tuas questões sobre o sistema, processos ou qualquer dúvida que tenhas.
                </p>
                <div className="mt-6 md:mt-8 space-y-2.5 w-full">
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                    Sugestões rápidas
                  </p>
                  {[
                    'Como submeter um formulário?',
                    'Como funciona o scanner?',
                    'Onde vejo as minhas consultas?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setInput(suggestion)}
                      className="w-full text-left px-4 py-3 min-h-[44px] text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all cursor-pointer touch-manipulation"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-red-600 to-red-700 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
                )}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                )}
              </div>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm',
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-red-600 to-red-700 text-white rounded-tr-md'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-md',
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed break-words">
                  {message.content}
                </p>
                <p
                  className={cn(
                    'text-[10px] mt-1.5',
                    message.role === 'user'
                      ? 'text-white/70'
                      : 'text-slate-400 dark:text-slate-500',
                  )}
                >
                  {message.timestamp.toLocaleTimeString('pt-PT', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm shrink-0">
                <Bot className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input — safe area bottom on mobile */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 min-w-0">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escreve a tua mensagem..."
                rows={1}
                className="w-full resize-none rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500 transition-all min-h-[44px]"
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="h-[46px] w-[46px] rounded-xl bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-600/25 shrink-0 transition-all touch-manipulation"
              aria-label="Enviar mensagem"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-3">
            Assistente IA do Grupo RAF • Respostas podem conter imprecisões
          </p>
        </div>
      </div>
    </>
  );

  return createPortal(panelContent, document.body);
}
