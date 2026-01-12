'use client';

import { useState } from 'react';
import { V0AIChat } from '@/components/ui/v0-ai-chat';
import { apiClient as api } from '@/lib/api-client';
import { toast } from 'sonner';

// Helper para gerar IDs únicos
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function MySabichaoContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = async (customInput?: string) => {
    const messageToSend = customInput || input;
    if (!messageToSend.trim() || loading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customInput) {
      setInput('');
    }
    setLoading(true);

    try {
      // O backend adiciona o prefixo 'sabichao-' automaticamente, então enviamos sem prefixo
      const cleanConvId = conversationId?.replace(/^sabichao-/, '') || undefined;
      const response = await api.chat.sendMessage(messageToSend, cleanConvId, 'sabichao');
      
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      // O backend retorna o conversationId com o prefixo 'sabichao-'
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
    <div className="flex flex-col min-h-[600px]">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Chatbot com IA para responder suas perguntas sobre a empresa
        </p>
      </div>
      <div className="flex-1">
        <V0AIChat
          value={input}
          onChange={setInput}
          onSend={sendMessage}
          loading={loading}
          messages={messages}
          placeholder="Pergunte ao MySabichão sobre a empresa, templates, relatórios..."
          title="MySabichão"
          onQuickAction={(action) => {
            sendMessage(action);
          }}
        />
      </div>
    </div>
  );
}
