import { useState, FormEvent, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Headphones, Send, X, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient as api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function SidebarSupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get the dashboard container for portal
  useEffect(() => {
    const container = document.getElementById('dashboard-container');
    setPortalContainer(container);
  }, []);

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

  return (
    <>
      {/* Trigger Card */}
      <div className="px-4 pb-6">
        <div
          onClick={() => setOpen(true)}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Suporte</p>
              <p className="text-xs text-white/60">Assistente IA disponível</p>
            </div>
          </div>
          <div className="w-full flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-red-900 text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
            <Sparkles className="w-4 h-4" />
            Iniciar Conversa
          </div>
        </div>
      </div>

      {/* Chat Panel - Rendered via portal inside dashboard container */}
      {open && portalContainer && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 z-40 rounded-[1.25rem]"
            onClick={() => setOpen(false)}
          />

          {/* Chat Panel */}
          <div className="absolute left-[260px] top-0 bottom-0 w-[400px] z-50 flex flex-col bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 shadow-2xl border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left-2 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4 shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/25">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Assistente RAF
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Suporte inteligente 24/7
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-medium text-green-700 dark:text-green-400">Online</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 dark:bg-slate-900/50 relative">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8">
              {/* Decorative background pattern */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-20">
                <div className="absolute top-20 left-10 w-32 h-32 bg-red-100 dark:bg-red-900 rounded-full blur-3xl" />
                <div className="absolute bottom-40 right-10 w-40 h-40 bg-slate-200 dark:bg-slate-800 rounded-full blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-800/30 flex items-center justify-center mb-5 shadow-sm border border-red-100 dark:border-red-800/50">
                  <Sparkles className="w-10 h-10 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Como posso ajudar?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[280px] leading-relaxed">
                  Estou aqui para responder às tuas questões sobre o sistema, processos ou qualquer dúvida que tenhas.
                </p>

                {/* Quick actions */}
                <div className="mt-8 space-y-2.5 w-full max-w-[300px]">
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
                      onClick={() => setInput(suggestion)}
                      className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all cursor-pointer"
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
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm',
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-red-600 to-red-700 text-white rounded-tr-md'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-md',
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">
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
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
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

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escreve a tua mensagem..."
                    rows={1}
                    className="w-full resize-none rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500 transition-all"
                  />
                </div>
                <Button
                  type="submit"
                  size="icon"
                  disabled={loading || !input.trim()}
                  className="h-[46px] w-[46px] rounded-xl bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-600/25 shrink-0 transition-all"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-3">
                Assistente IA do Grupo RAF • Respostas podem conter imprecisões
              </p>
            </div>
          </div>
        </>,
        portalContainer
      )}
    </>
  );
}
