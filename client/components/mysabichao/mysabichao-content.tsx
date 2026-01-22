"use client";

import { useState } from "react";
import { AnimatedAIChat } from "@/components/ui/animated-ai-chat";
import { apiClient as api } from "@/lib/api-client";
import { toast } from "sonner";

// Helper para gerar IDs únicos
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function MySabichaoContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = async (customInput?: string) => {
    const messageToSend = customInput || input;
    if (!messageToSend.trim() || loading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customInput) {
      setInput("");
    }
    setLoading(true);

    try {
      // O backend adiciona o prefixo 'sabichao-' automaticamente, então enviamos sem prefixo
      const cleanConvId =
        conversationId?.replace(/^sabichao-/, "") || undefined;
      const response = await api.chat.sendMessage(
        messageToSend,
        cleanConvId,
        "sabichao",
      );

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      // O backend retorna o conversationId com o prefixo 'sabichao-'
      setConversationId(response.conversationId);
    } catch (error: any) {
      toast.error(
        "Erro ao enviar mensagem: " + (error.message || "Erro desconhecido"),
      );
      // Remover mensagem do usuário em caso de erro
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setConversationId(null);
    setInput("");
    toast.success("Histórico limpo");
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)] max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-10rem)] min-h-0"
      style={{ overflow: "hidden" }}
    >
      <div className="mb-3 shrink-0">
        <h1 className="text-2xl font-bold text-foreground mb-1.5">
          MySabichão
        </h1>
        <p className="text-sm text-muted-foreground line-clamp-2">
          Chatbot com IA para responder suas perguntas sobre a empresa usando
          RAG
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <AnimatedAIChat
          value={input}
          onChange={setInput}
          onSend={sendMessage}
          loading={loading}
          messages={messages}
          placeholder="Pergunte ao MySabichão sobre a empresa, templates, relatórios... O sistema buscará informações relevantes dos documentos enviados."
          onClearHistory={clearHistory}
        />
      </div>
    </div>
  );
}
