import { useState } from 'react';
import {
  AnimatedAIChat,
  CommandSuggestion,
} from '@/components/ui/animated-ai-chat';
import { apiClient as api } from '@/lib/api-client';
import { toast } from 'sonner';
import { FileText, HelpCircle, Zap, BookOpen, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Image } from '@/lib/router-compat';

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
    icon: <BookOpen className="w-4 h-4" />,
    label: 'Como funciona o CRM?',
    description: 'Aprende a usar o sistema de gestão de clientes',
    prefix: '/crm',
    action: 'Como funciona o CRM?',
  },
  {
    icon: <HelpCircle className="w-4 h-4" />,
    label: 'Quais são as comissões dos bancos?',
    description: 'Consulta tabelas e condições de comissão',
    prefix: '/comissoes',
    action: 'Quais são as comissões dos bancos?',
  },
  {
    icon: <Zap className="w-4 h-4" />,
    label: 'Como fazer onboarding de um cliente?',
    description: 'Procedimentos para novos gestores',
    prefix: '/onboarding',
    action: 'Como fazer onboarding de um cliente?',
  },
  {
    icon: <FileText className="w-4 h-4" />,
    label: 'Quais os contactos da administração?',
    description: 'Encontra os contactos dos departamentos',
    prefix: '/contactos',
    action: 'Quais os contactos da administração?',
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
        title="MySabichao"
        description="Assistente sobre os documentos carregados. Pesquisa, resume e extrai informação dos PDFs."
        customIcon={
          <div className="w-full h-full flex items-center justify-center p-1.5">
            <Image
              src="/LogoMySabischao.png"
              alt="MySabichao"
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          </div>
        }
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
            placeholder="Pergunte sobre o conteúdo dos documentos carregados. O sistema pesquisa nos PDFs extraídos e responde com base no que encontrou."
            onClearHistory={clearHistory}
            suggestions={MYSABICHAO_SUGGESTIONS}
          />
        </div>
      </div>
    </div>
  );
}
