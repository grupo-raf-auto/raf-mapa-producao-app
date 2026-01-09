"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

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

            // Temporarily shrink to get the right scrollHeight
            textarea.style.height = `${minHeight}px`;

            // Calculate new height
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
        // Set initial height
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    // Adjust height on window resize
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

interface V0AIChatProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    loading?: boolean;
    messages?: Message[];
    placeholder?: string;
    title?: string;
    onQuickAction?: (action: string) => void;
}

export function V0AIChat({
    value,
    onChange,
    onSend,
    loading = false,
    messages = [],
    placeholder = "Pergunte ao MySabichão...",
    title = "MySabichão",
    onQuickAction,
}: V0AIChatProps) {
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

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
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-6 h-full">
            <h1 className="text-4xl font-bold text-foreground">
                {title}
            </h1>

            {/* Messages Area */}
            {messages.length > 0 && (
                <div className="w-full flex-1 overflow-y-auto space-y-4 pb-4 max-h-[500px] min-h-[200px]">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "flex",
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-lg p-4",
                                    message.role === 'user'
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground"
                                )}
                            >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-muted rounded-lg p-4">
                                <Spinner variant="bars" className="w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Input Area */}
            <div className="w-full mt-auto">
                <div className="relative bg-background rounded-xl border border-border shadow-sm">
                    <div className="overflow-y-auto">
                        <Textarea
                            ref={textareaRef}
                            value={value}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            disabled={loading}
                            className={cn(
                                "w-full px-4 py-3",
                                "resize-none",
                                "bg-transparent",
                                "border-none",
                                "text-foreground text-sm",
                                "focus:outline-none",
                                "focus-visible:ring-0 focus-visible:ring-offset-0",
                                "placeholder:text-muted-foreground placeholder:text-sm",
                                "min-h-[60px]"
                            )}
                            style={{
                                overflow: "hidden",
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 border-t border-border">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="group p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-1"
                                disabled={loading}
                            >
                                <Paperclip className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground hidden group-hover:inline transition-opacity">
                                    Anexar
                                </span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onSend}
                                disabled={!value.trim() || loading}
                                className={cn(
                                    "px-1.5 py-1.5 rounded-lg text-sm transition-colors border flex items-center justify-between gap-1",
                                    value.trim() && !loading
                                        ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                                        : "text-muted-foreground border-border hover:bg-muted cursor-not-allowed"
                                )}
                            >
                                {loading ? (
                                    <Spinner variant="bars" className="w-4 h-4" />
                                ) : (
                                    <ArrowUpIcon className="w-4 h-4" />
                                )}
                                <span className="sr-only">Enviar</span>
                            </button>
                        </div>
                    </div>
                </div>

                {messages.length === 0 && (
                    <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                        <ActionButton
                            icon="💡"
                            label="Perguntas Frequentes"
                            onClick={() => onQuickAction?.("Quais são as perguntas frequentes?")}
                        />
                        <ActionButton
                            icon="📊"
                            label="Relatórios"
                            onClick={() => onQuickAction?.("Como gerar relatórios?")}
                        />
                        <ActionButton
                            icon="📝"
                            label="Templates"
                            onClick={() => onQuickAction?.("Como usar templates?")}
                        />
                        <ActionButton
                            icon="📈"
                            label="Estatísticas"
                            onClick={() => onQuickAction?.("Mostre-me as estatísticas")}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

interface ActionButtonProps {
    icon: string;
    label: string;
    onClick?: () => void;
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
            <span>{icon}</span>
            <span className="text-xs">{label}</span>
        </button>
    );
}
