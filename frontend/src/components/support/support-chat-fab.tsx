"use client";

import { useState, FormEvent } from "react";
import { MessageCircle } from "lucide-react";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat";
import { SupportChat, SupportChatFooter } from "./support-chat";
import { apiClient as api } from "@/lib/api-client";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function SupportChatFab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const messageToSend = input.trim();
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // O backend adiciona o prefixo 'support-' automaticamente, então enviamos sem prefixo
      const cleanConvId = conversationId?.replace(/^support-/, "") || undefined;
      const response = await api.chat.sendMessage(
        messageToSend,
        cleanConvId,
        "support",
      );

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      // O backend retorna o conversationId com o prefixo 'support-'
      setConversationId(response.conversationId);
    } catch (error: any) {
      toast.error("Erro ao enviar mensagem: " + error.message);
      // Remover mensagem do utilizador em caso de erro
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExpandableChat
      size="md"
      position="bottom-right"
      icon={<MessageCircle className="h-5 w-5" />}
    >
      <ExpandableChatHeader className="gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Ajuda</h1>
            <p className="text-xs text-muted-foreground">Suporte do sistema</p>
          </div>
        </div>
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
