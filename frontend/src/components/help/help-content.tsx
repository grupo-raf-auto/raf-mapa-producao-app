import { useState } from 'react';
import {
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Plus,
  X,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';

const userFaqs = [
  {
    id: 'faq-1',
    question: 'O que é a plataforma Grupo RAF?',
    answer:
      'A plataforma Grupo RAF é uma solução completa de gestão de produção para mediadores de crédito e seguros. Permite gerir consultas, preencher formulários, acompanhar métricas de desempenho e muito mais, tudo num único local.',
  },
  {
    id: 'faq-2',
    question: 'Como posso criar uma nova consulta?',
    answer:
      'Para criar uma nova consulta, aceda à secção "Formulários" no menu lateral e selecione o template adequado ao tipo de produto (crédito habitação, crédito pessoal, seguros, etc.). Preencha os dados do cliente e submeta o formulário.',
  },
  {
    id: 'faq-3',
    question: 'O que é o MySabichão?',
    answer:
      'O MySabichão é o nosso assistente de inteligência artificial que pode responder a dúvidas sobre produtos, processos e regulamentação. Basta escrever a sua pergunta e obterá uma resposta baseada na documentação interna.',
  },
  {
    id: 'faq-4',
    question: 'Como funciona o MyScanner?',
    answer:
      'O MyScanner é uma ferramenta de análise de documentos com IA que ajuda a verificar a autenticidade e conformidade de documentos submetidos pelos clientes, como comprovativos de rendimentos e identificação.',
  },
  {
    id: 'faq-5',
    question: 'Como posso ver as minhas métricas de produção?',
    answer:
      'No Dashboard principal tem acesso a todas as suas métricas de produção: número de consultas, valores de produção, desempenho por banco/seguradora, e comparação com períodos anteriores. Pode filtrar por diferentes períodos temporais.',
  },
  {
    id: 'faq-6',
    question: 'Posso trabalhar com vários modelos/marcas?',
    answer:
      'Sim! Se tiver acesso a múltiplos modelos, pode alternar entre eles através do seletor no topo da página. Cada modelo tem as suas próprias consultas e configurações.',
  },
];

const adminFaqs = [
  {
    id: 'admin-faq-1',
    question: 'O que é o Painel Admin?',
    answer:
      'O Painel Admin é a área de administração da plataforma Grupo RAF. Permite gerir utilizadores, consultas de toda a equipa, métricas de desempenho, templates de formulários, documentos do MySabichão e tickets de suporte, tudo num único local com acesso completo.',
  },
  {
    id: 'admin-faq-2',
    question: 'Como gerir utilizadores?',
    answer:
      'Na secção "Utilizadores" pode ver a lista de todos os utilizadores, aprovar ou rejeitar pedidos de acesso, alterar roles (admin/user) e aceder aos modelos de cada utilizador. Clique num utilizador para ver detalhes e gerir os modelos de negócio (Crédito, Imobiliária, Seguros) atribuídos.',
  },
  {
    id: 'admin-faq-3',
    question: 'Como ver todas as consultas?',
    answer:
      'Em "Consultas" tem acesso a todas as consultas realizadas na plataforma. Pode filtrar por data, utilizador, status e modelo. Use a tabela para pesquisar, ordenar e exportar dados conforme necessário.',
  },
  {
    id: 'admin-faq-4',
    question: 'Como analisar o desempenho da equipa?',
    answer:
      'A secção "Desempenho" mostra métricas agregadas: produção por utilizador, por período e por banco ou seguradora. Use os gráficos e filtros para acompanhar a produtividade da equipa e comparar períodos.',
  },
  {
    id: 'admin-faq-5',
    question: 'Como gerir templates de formulários?',
    answer:
      'Em "Templates" pode criar, editar e organizar os modelos de formulários usados na plataforma. Defina as questões de cada template, ordene-as e ative ou desative templates. As alterações refletem-se nos formulários disponíveis aos utilizadores.',
  },
  {
    id: 'admin-faq-6',
    question: 'Como gerir os ficheiros do MySabichão?',
    answer:
      'A secção "Ficheiros" permite fazer upload e gerir os documentos que alimentam o assistente MySabichão. Estes ficheiros são usados para que o assistente responda às perguntas dos utilizadores. Organize e atualize a documentação aqui.',
  },
  {
    id: 'admin-faq-7',
    question: 'O que são os Tickets?',
    answer:
      'Os Tickets são o sistema de suporte integrado ao painel admin. Os utilizadores podem abrir pedidos de ajuda que aparecem aqui. Acompanhe e responda aos tickets para dar suporte à equipa. (Funcionalidade em desenvolvimento.)',
  },
  {
    id: 'admin-faq-8',
    question: 'Onde altero as minhas definições de conta?',
    answer:
      'No menu "Geral" clique em "Definições" para aceder às definições da sua conta: perfil, foto, palavra-passe e opções de segurança. Pode também usar o menu do seu perfil no canto superior direito.',
  },
];

interface HelpContentProps {
  variant?: 'user' | 'admin';
}

export function HelpContent({ variant = 'user' }: HelpContentProps) {
  const faqs = variant === 'admin' ? adminFaqs : userFaqs;
  const [openItem, setOpenItem] = useState<string>(faqs[0]?.id ?? '');

  const isAdmin = variant === 'admin';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader
        title="Centro de Ajuda"
        description={
          isAdmin
            ? 'FAQs e contacto com suporte.'
            : 'FAQs e contacto.'
        }
        icon={HelpCircle}
        decoratorIcon={<Sparkles className="w-5 h-5" />}
      />
      {/* Main Content — min-w-0 evita overflow em tablet */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Contact Card - Left Side */}
        <div className="lg:col-span-1 min-w-0">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-red-100 dark:border-red-900/30 min-w-0 overflow-hidden">
            {/* FAQ Badge */}
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-sm font-medium text-red-700 dark:text-red-400">
                FAQs
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8 break-words">
              Perguntas Frequentes
            </h2>

            {/* Avatar & Contact */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                R
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Agendar uma chamada
                </p>
                <p className="text-sm text-muted-foreground">
                  Fale connosco sobre qualquer dúvida
                </p>
              </div>
            </div>

            {/* Contact Button */}
            <Button
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl min-h-[48px] h-12 font-medium shadow-lg shadow-red-500/20 touch-manipulation"
              onClick={() =>
                window.open('mailto:suporte@gruporaf.pt', '_blank')
              }
            >
              <Mail className="w-4 h-4 mr-2" />
              Contactar Suporte
            </Button>

            {/* Additional Contact Options */}
            <div className="mt-6 space-y-3">
              <a
                href="tel:+351123456789"
                className="flex items-center gap-3 p-3 min-h-[44px] rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors group touch-manipulation"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Telefone
                  </p>
                  <p className="text-xs text-muted-foreground">
                    +351 123 456 789
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>

              <a
                href="mailto:suporte@gruporaf.pt"
                className="flex items-center gap-3 p-3 min-h-[44px] rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors group touch-manipulation"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="text-xs text-muted-foreground">
                    suporte@gruporaf.pt
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>
            </div>
          </div>
        </div>

        {/* FAQs - Right Side */}
        <div className="lg:col-span-2 min-w-0">
          <div className="space-y-3 min-w-0">
            {faqs.map((faq) => {
              const isOpen = openItem === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-xl sm:rounded-2xl transition-all duration-300 border min-w-0 ${
                    isOpen
                      ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200 dark:border-red-900/50 shadow-sm'
                      : 'bg-white dark:bg-card border-border hover:border-red-200 dark:hover:border-red-900/30 hover:bg-red-50/30 dark:hover:bg-red-950/10'
                  }`}
                >
                  <button
                    onClick={() => setOpenItem(isOpen ? '' : faq.id)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left min-h-[48px] touch-manipulation rounded-xl sm:rounded-2xl"
                  >
                    <span className="font-medium text-foreground pr-4">
                      {faq.question}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {isOpen ? (
                        <X className="w-5 h-5" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="px-5 pb-5 text-sm text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
