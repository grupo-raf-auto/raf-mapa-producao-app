"use client";

import { FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import { ChatMessageList } from "@/components/ui/chat-message-list";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface SupportChatProps {
  messages: Message[];
  loading: boolean;
}

export function SupportChat({ messages, loading }: SupportChatProps) {
  return (
    <div className="flex flex-col h-full">
      <ChatMessageList>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
            <p className="text-sm text-muted-foreground">
              Inicia uma conversa para obter ajuda sobre o sistema.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            variant={message.role === "user" ? "sent" : "received"}
          >
            <ChatBubbleAvatar
              variant={message.role === "user" ? "sent" : "received"}
            />
            <ChatBubbleMessage
              variant={message.role === "user" ? "sent" : "received"}
            >
              {message.content}
            </ChatBubbleMessage>
          </ChatBubble>
        ))}

        {loading && (
          <ChatBubble variant="received">
            <ChatBubbleAvatar variant="received" />
            <ChatBubbleMessage isLoading variant="received" />
          </ChatBubble>
        )}
      </ChatMessageList>
    </div>
  );
}

interface SupportChatFooterProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
}

export function SupportChatFooter({
  input,
  setInput,
  onSubmit,
  loading,
}: SupportChatFooterProps) {
  return (
    <form onSubmit={onSubmit} className="relative flex items-center gap-2">
      <ChatInput
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Escreve a tua mensagem..."
        className="flex-1 min-h-10 resize-none rounded-lg bg-muted/50 border border-border px-3 py-2.5 text-sm focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50"
      />
      <Button
        type="submit"
        size="icon"
        className="h-10 w-10 rounded-lg shrink-0"
        disabled={loading || !input.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
