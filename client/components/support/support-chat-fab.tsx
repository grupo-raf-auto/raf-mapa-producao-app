'use client';

import { useState, FormEvent } from 'react';
import { MessageCircle } from 'lucide-react';
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from '@/components/ui/expandable-chat';
import { SupportChat, SupportChatFooter } from './support-chat';
import { apiClient as api } from '@/lib/api-client';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function SupportChatFab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

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
      // O backend adiciona o prefixo 'support-' automaticamente, então enviamos sem prefixo
      const cleanConvId = conversationId?.replace(/^support-/, '') || undefined;
      const response = await api.chat.sendMessage(messageToSend, cleanConvId, 'support');

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      // O backend retorna o conversationId com o prefixo 'support-'
      setConversationId(response.conversationId);
    } catch (error: any) {
      toast.error('Erro ao enviar mensagem: ' + error.message);
      // Remover mensagem do usuário em caso de erro
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExpandableChat
      size="md"
      position="bottom-right"
      icon={<MessageCircle className="h-6 w-6" />}
    >
      <ExpandableChatHeader className="flex-col text-center justify-center">
        <div className="flex items-center gap-3 justify-center mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Ajuda</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Precisa de ajuda? Pergunte sobre processos e funcionalidades do sistema.
        </p>
      </ExpandableChatHeader>

      <ExpandableChatBody>
        <SupportChat messages={messages} loading={loading} />
      </ExpandableChatBody>

      <ExpandableChatFooter>
        <SupportChatFooter
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </ExpandableChatFooter>
    </ExpandableChat>
  );
}
