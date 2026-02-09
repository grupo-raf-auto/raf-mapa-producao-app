import { useState } from 'react';
import {
  AnimatedAIChat,
  CommandSuggestion,
} from '@/components/ui/animated-ai-chat';
import { apiClient as api } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  FileText,
  Layers,
  FileUp,
  Search,
  Sparkles,
  Brain,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

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

const MYSABICHAO_SUGGESTIONS: CommandSuggestion[] = [
  {
    icon: <FileText className="w-4 h-4" />,
    label: 'Templates',
    description: 'Minutas e modelos de documentos',
    prefix: '/templates',
    action: 'Quais são os templates e minutas disponíveis?',
  },
  {
    icon: <Layers className="w-4 h-4" />,
    label: 'Procedimentos',
    description: 'Fluxos de trabalho e normas',
    prefix: '/procedimentos',
    action: 'Como funcionam os procedimentos de crédito e análise?',
  },
  {
    icon: <FileUp className="w-4 h-4" />,
    label: 'Documentação',
    description: 'Guias e manuais internos',
    prefix: '/docs',
    action: 'Onde encontro a documentação interna e manuais?',
  },
  {
    icon: <Search className="w-4 h-4" />,
    label: 'Análise',
    description: 'Critérios de análise de risco',
    prefix: '/analise',
    action: 'Quais são os critérios para análise de risco?',
  },
];

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
      const cleanConvId =
        conversationId?.replace(/^sabichao-/, '') || undefined;
      const response = await api.chat.sendMessage(
        messageToSend,
        cleanConvId,
        'sabichao',
      );

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
      toast.error(
        'Erro ao enviar mensagem: ' + (error.message || 'Erro desconhecido'),
      );
      // Remover mensagem do utilizador em caso de erro
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setConversationId(null);
    setInput('');
    toast.success('Histórico limpo');
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Professional Header */}
      <PageHeader
        title="MySabichão"
        description="Assistente para templates, documentação e análise. Perguntas em linguagem natural."
        icon={Brain}
        iconGradient="from-red-600 via-red-500 to-red-700"
        decoratorIcon={<Sparkles className="w-5 h-5" />}
        decoratorColor="text-red-500"
      />
      {/* Chat Interface */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-sm">
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <AnimatedAIChat
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            loading={loading}
            messages={messages}
            placeholder="Pergunte ao MySabichão sobre a empresa, templates, relatórios... O sistema buscará informações relevantes dos documentos enviados."
            onClearHistory={clearHistory}
            suggestions={MYSABICHAO_SUGGESTIONS}
          />
        </div>
      </div>
    </div>
  );
}
