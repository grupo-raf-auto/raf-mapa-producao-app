"use client";

import { useEffect, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    Send,
    Trash2,
    FileText,
    HelpCircle,
    Zap,
    Brain,
    Bot,
    User,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
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
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
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
        title: "CRM e Processos",
        description: "Aprende a usar o sistema",
        action: "Como funciona o CRM?",
    },
    {
        icon: <HelpCircle className="w-4 h-4" />,
        title: "Contactos",
        description: "Departamentos e equipas",
        action: "Quais são os contactos da MyCredit?",
    },
    {
        icon: <Zap className="w-4 h-4" />,
        title: "Onboarding",
        description: "Novos clientes e gestores",
        action: "Como fazer onboarding de um cliente?",
    },
];

export function V0AIChat({
    value,
    onChange,
    onSend,
    loading = false,
    messages = [],
    placeholder = "Pergunta sobre os documentos...",
    title = "MySabichão",
    onQuickAction,
    onClearHistory,
}: V0AIChatProps) {
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 52,
        maxHeight: 200,
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();
    const userName = session?.user?.name || (session?.user as { firstName?: string })?.firstName || "Utilizador";

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
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
        <div className="flex flex-col w-full max-w-4xl mx-auto h-full">
            {/* Header - Clean minimal design */}
            <div className="flex items-center justify-between pb-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                        <Brain className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-foreground tracking-tight">{title}</h2>
                        <p className="text-xs text-muted-foreground">Base de conhecimento interna</p>
                    </div>
                </div>
                {messages.length > 0 && onClearHistory && (
                    <button
                        onClick={onClearHistory}
                        className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors text-muted-foreground"
                        title="Limpar histórico"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Welcome Message (when no messages) */}
            {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <div className="mb-6">
                        <h1 className="font-title text-3xl md:text-4xl font-semibold text-foreground mb-2">
                            Olá, {userName}
                        </h1>
                        <p className="text-muted-foreground">
                            Como posso ajudar-te hoje?
                        </p>
                    </div>

                    {/* Quick Action Cards - Compact professional style */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-xl">
                        {defaultQuickActions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => onQuickAction?.(action.action)}
                                className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-left group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    {action.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-foreground text-sm truncate">{action.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <p className="text-xs text-muted-foreground/70 max-w-md mt-8">
                        Pergunta sobre manuais, procedimentos, contactos e processos internos.
                    </p>
                </div>
            )}

            {/* Messages Area - Professional chat bubbles with avatars */}
            {messages.length > 0 && (
                <div className="flex-1 overflow-y-auto space-y-4 py-6 max-h-[500px] min-h-[200px]">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "flex gap-3",
                                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            )}
                        >
                            {/* Avatar */}
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                message.role === 'user'
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                            )}>
                                {message.role === 'user' ? (
                                    <User className="w-4 h-4" />
                                ) : (
                                    <Bot className="w-4 h-4" />
                                )}
                            </div>
                            {/* Message bubble */}
                            <div
                                className={cn(
                                    "max-w-[75%] rounded-xl px-4 py-3",
                                    message.role === 'user'
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground"
                                )}
                            >
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="bg-muted rounded-xl px-4 py-3">
                                <Spinner variant="bars" className="w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Input Area - Clean with subtle styling */}
            <div className="mt-auto pt-4 border-t border-border/50">
                <div className="relative bg-muted/30 rounded-xl border border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={loading}
                        className={cn(
                            "w-full px-4 py-3.5 pr-14",
                            "resize-none",
                            "bg-transparent",
                            "border-none",
                            "text-foreground text-sm",
                            "focus:outline-none",
                            "focus-visible:ring-0 focus-visible:ring-offset-0",
                            "placeholder:text-muted-foreground placeholder:text-sm",
                            "min-h-[52px]"
                        )}
                        style={{
                            overflow: "hidden",
                        }}
                    />
                    <button
                        type="button"
                        onClick={onSend}
                        disabled={!value.trim() || loading}
                        className={cn(
                            "absolute right-3 bottom-3 p-2 rounded-lg transition-all",
                            value.trim() && !loading
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                    >
                        {loading ? (
                            <Spinner variant="bars" className="w-4 h-4" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>
                <p className="text-[11px] text-muted-foreground/60 text-center mt-2">
                    Respostas baseadas nos documentos internos. Verifica informação crítica.
                </p>
            </div>
        </div>
    );
}
