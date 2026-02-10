export type MessageChannel = 'email' | 'whatsapp';

export interface MessageGeneratorContext {
  id: string;
  name: string;
  description: string;
  channel: MessageChannel;
}

export interface MessageGeneratorTemplate {
  id: string;
  contextId: string;
  name: string;
  description: string;
  systemPromptAddition: string;
}

export const MESSAGE_CONTEXTS: MessageGeneratorContext[] = [
  {
    id: 'pedido_documentacao',
    name: 'Pedido de documentação',
    description: 'Solicitar documentos em falta ao cliente',
    channel: 'email',
  },
  {
    id: 'esclarecimento_duvida',
    name: 'Esclarecimento de dúvida',
    description: 'Responder a uma dúvida do cliente',
    channel: 'email',
  },
  {
    id: 'follow_up',
    name: 'Follow-up',
    description: 'Acompanhamento de processo ou proposta',
    channel: 'email',
  },
  {
    id: 'confirmacao_rececao',
    name: 'Confirmação de receção',
    description: 'Confirmar que recebeu documentos ou pedido',
    channel: 'email',
  },
  {
    id: 'lembrete_pagamento',
    name: 'Lembrete de pagamento',
    description: 'Lembrete cordial de pagamento em atraso',
    channel: 'email',
  },
  {
    id: 'agradecimento',
    name: 'Agradecimento',
    description: 'Agradecer colaboração ou resposta do cliente',
    channel: 'email',
  },
  {
    id: 'resposta_reclamacao',
    name: 'Resposta a reclamação',
    description: 'Responder a uma reclamação de forma profissional',
    channel: 'email',
  },
  {
    id: 'whatsapp_rapido',
    name: 'Mensagem rápida (WhatsApp)',
    description: 'Mensagem curta e direta para WhatsApp',
    channel: 'whatsapp',
  },
  {
    id: 'whatsapp_documentos',
    name: 'Pedir documentos (WhatsApp)',
    description: 'Pedir documentação por WhatsApp',
    channel: 'whatsapp',
  },
  {
    id: 'whatsapp_lembrete',
    name: 'Lembrete (WhatsApp)',
    description: 'Lembrete breve por WhatsApp',
    channel: 'whatsapp',
  },
];

export const MESSAGE_TEMPLATES: MessageGeneratorTemplate[] = [
  {
    id: 'formal_completo',
    contextId: 'pedido_documentacao',
    name: 'Formal completo',
    description: 'Email formal com saudação e despedida',
    systemPromptAddition:
      'Escreve um email formal, com assunto, saudação (Exmo.(a) Sr.(a)), corpo claro listando os documentos em falta, e despedida profissional (Com os melhores cumprimentos). Inclui um assunto sugerido no início entre parêntesis.',
  },
  {
    id: 'formal_direto',
    contextId: 'pedido_documentacao',
    name: 'Formal direto',
    description: 'Email objetivo, sem rodeios',
    systemPromptAddition:
      'Escreve um email formal mas conciso: saudação breve, lista de documentos em falta, e despedida curta. Sem parágrafos longos.',
  },
  {
    id: 'esclarecimento_detalhado',
    contextId: 'esclarecimento_duvida',
    name: 'Resposta detalhada',
    description: 'Explicação completa e clara',
    systemPromptAddition:
      'Responde à dúvida do cliente de forma clara e completa. Usa parágrafos curtos e, se útil, listas numeradas. Tom profissional e cordial.',
  },
  {
    id: 'esclarecimento_curto',
    contextId: 'esclarecimento_duvida',
    name: 'Resposta curta',
    description: 'Resposta objetiva em poucas linhas',
    systemPromptAddition:
      'Responde à dúvida de forma muito breve e direta. 2-4 frases no máximo. Tom profissional.',
  },
  {
    id: 'follow_up_cordial',
    contextId: 'follow_up',
    name: 'Follow-up cordial',
    description: 'Acompanhamento sem pressionar',
    systemPromptAddition:
      'Escreve um email de follow-up cordial: referir o processo/proposta, perguntar se precisam de algo ou se há novidades, e colocar-te à disposição. Tom amigável mas profissional.',
  },
  {
    id: 'follow_up_urgente',
    contextId: 'follow_up',
    name: 'Follow-up urgente',
    description: 'Acompanhamento com prazo ou urgência',
    systemPromptAddition:
      'Escreve um email de follow-up que transmita gentilmente urgência ou prazo, sem ser agressivo. Inclui data/prazo se o utilizador indicar.',
  },
  {
    id: 'confirmacao_simples',
    contextId: 'confirmacao_rececao',
    name: 'Confirmação simples',
    description: 'Confirmar receção de forma breve',
    systemPromptAddition:
      'Escreve uma confirmação de receção breve e profissional. Indica o que foi recebido e os próximos passos (se aplicável).',
  },
  {
    id: 'lembrete_suave',
    contextId: 'lembrete_pagamento',
    name: 'Lembrete suave',
    description: 'Lembrete cordial de pagamento',
    systemPromptAddition:
      'Escreve um lembrete de pagamento muito cordial e discreto. Assumir que pode ter sido esquecimento. Oferece ajuda para regularizar. Tom profissional e respeitoso.',
  },
  {
    id: 'lembrete_seguido',
    contextId: 'lembrete_pagamento',
    name: 'Segundo lembrete',
    description: 'Segundo aviso, ainda cordial',
    systemPromptAddition:
      'Escreve um segundo lembrete de pagamento. Mantém tom profissional mas um pouco mais firme. Referir que é um segundo contacto e indicar consequências apenas de forma genérica se necessário.',
  },
  {
    id: 'agradecimento_curto',
    contextId: 'agradecimento',
    name: 'Agradecimento breve',
    description: 'Agradecer de forma concisa',
    systemPromptAddition:
      'Escreve um agradecimento breve e genuíno. 2-4 frases. Tom cordial e profissional.',
  },
  {
    id: 'reclamacao_empatia',
    contextId: 'resposta_reclamacao',
    name: 'Resposta com empatia',
    description: 'Reconhecer e responder à reclamação',
    systemPromptAddition:
      'Escreve uma resposta a uma reclamação: reconhece o incómodo do cliente, pede desculpa pelo sucedido (sem admitir culpas legais), explica passos que vão ser dados ou já foram, e oferece um contacto para follow-up. Tom empático e profissional.',
  },
  {
    id: 'whatsapp_geral',
    contextId: 'whatsapp_rapido',
    name: 'Mensagem geral',
    description: 'Texto curto para WhatsApp',
    systemPromptAddition:
      'Escreve uma mensagem curta para WhatsApp: máx. 2-3 frases, tom profissional mas próximo. Sem emojis em excesso. Pode usar um emoji no início ou fim se fizer sentido.',
  },
  {
    id: 'whatsapp_docs',
    contextId: 'whatsapp_documentos',
    name: 'Pedir documentos',
    description: 'Lista de documentos por WhatsApp',
    systemPromptAddition:
      'Escreve uma mensagem para WhatsApp a pedir documentação. Lista os documentos de forma clara (pode usar bullets ou números). Breve e cordial. Adequado ao tamanho de uma mensagem WhatsApp.',
  },
  {
    id: 'whatsapp_lembrete_curto',
    contextId: 'whatsapp_lembrete',
    name: 'Lembrete WhatsApp',
    description: 'Lembrete breve por WhatsApp',
    systemPromptAddition:
      'Escreve um lembrete muito curto para WhatsApp. 1-2 frases. Cordial e profissional.',
  },
];
