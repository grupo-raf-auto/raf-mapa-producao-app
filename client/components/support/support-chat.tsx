'use client';

import { FormEvent } from 'react';
import { CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '@/components/ui/chat-bubble';
import { ChatInput } from '@/components/ui/chat-input';
import { ChatMessageList } from '@/components/ui/chat-message-list';

interface Message {
  id: string;
  role: 'user' | 'assistant';
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
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            variant={message.role === 'user' ? 'sent' : 'received'}
          >
            <ChatBubbleAvatar
              className="h-8 w-8 shrink-0"
              src={
                message.role === 'user'
                  ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop'
                  : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop'
              }
              fallback={message.role === 'user' ? 'US' : 'AI'}
            />
            <ChatBubbleMessage
              variant={message.role === 'user' ? 'sent' : 'received'}
            >
              {message.content}
            </ChatBubbleMessage>
          </ChatBubble>
        ))}

        {loading && (
          <ChatBubble variant="received">
            <ChatBubbleAvatar
              className="h-8 w-8 shrink-0"
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
              fallback="AI"
            />
            <ChatBubbleMessage isLoading />
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

export function SupportChatFooter({ input, setInput, onSubmit, loading }: SupportChatFooterProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
    >
      <ChatInput
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Digite sua mensagem..."
        className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center p-3 pt-0 justify-between">
        <div className="flex">
          {/* Espaço para botões futuros se necessário */}
        </div>
        <Button type="submit" size="sm" className="ml-auto gap-1.5" disabled={loading}>
          Enviar
          <CornerDownLeft className="size-3.5" />
        </Button>
      </div>
    </form>
  );
}
