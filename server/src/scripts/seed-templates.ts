import { getDatabase } from '../config/database';
import { Question, Template } from '../types';
import { ObjectId } from 'mongodb';

const agentes = [
  'Andreia Freitas',
  'Ricardo Freitas',
  'Carina Pereira',
  'Daniela Martins',
  'Isabel Ribeiro',
  'Monica Martins',
  'Maria Patricia',
  'Sara Oliveira',
  'Maria João',
  'Daniel Matos',
  'Marisa Guimaraes',
  'Sara da Costa',
  'Sara Costa',
  'Ana Claudia',
  'Anabela Ataíde',
  'Patricia Gonçalves',
  'Patricia Viana',
  'Tiago Nascimento',
  'Vera Sá',
];

const seguradoras = [
  'Prevoir',
  'Prevoir DOMUS',
  'Liberty',
  'Zurich',
  'Asisa',
  'Ageas',
  'Generali Tranquilidade',
  'Fidelidade',
  'Metlife',
  'Una',
  'AdvanceCare',
  'Real',
  'AIG',
  'Caravela',
  'Allianz',
  'Vitoria',
  'Mgen',
];

const bancos = [
  'BPI',
  'Santander',
  'NovoBanco',
  'CGD',
  'Bankinter',
  'Abanca',
  'AbancaSerfin',
  'Montepio',
  'TD Credito',
  'Credibom',
  'CTT',
  'Chance Plus',
  'Caixa Crédito Agricola',
];

const questionsData = [
  {
    title: 'Data',
    description: 'Data do registo',
    status: 'active' as const,
    inputType: 'date' as const,
  },
  {
    title: 'Apontador',
    description: 'Nome do apontador',
    status: 'active' as const,
    inputType: 'text' as const,
  },
  {
    title: 'Agente',
    description: 'Nome do agente',
    status: 'active' as const,
    inputType: 'select' as const,
    options: agentes,
  },
  {
    title: 'Nome do Cliente',
    description: 'Nome completo do cliente',
    status: 'active' as const,
    inputType: 'text' as const,
  },
  {
    title: 'Data nascimento',
    description: 'Data de nascimento do cliente',
    status: 'active' as const,
    inputType: 'date' as const,
  },
  {
    title: 'Email cliente',
    description: 'Endereço de email do cliente',
    status: 'active' as const,
    inputType: 'email' as const,
  },
  {
    title: 'Telefone cliente',
    description: 'Telefone do cliente (sem indicativo)',
    status: 'active' as const,
    inputType: 'tel' as const,
  },
  {
    title: 'Distrito cliente',
    description: 'Distrito de residência do cliente',
    status: 'active' as const,
    inputType: 'text' as const,
  },
  {
    title: 'Rating cliente',
    description: 'Rating/classificação do cliente',
    status: 'active' as const,
    inputType: 'text' as const,
  },
  {
    title: 'Seguradora',
    description: 'Nome da seguradora',
    status: 'active' as const,
    inputType: 'select' as const,
    options: seguradoras,
  },
  {
    title: 'Banco',
    description: 'Nome do banco',
    status: 'active' as const,
    inputType: 'select' as const,
    options: bancos,
  },
  {
    title: 'Valor',
    description: 'Valor total do financiamento (crédito)',
    status: 'active' as const,
    inputType: 'number' as const,
  },
  {
    title: 'Fracionamento',
    description: 'Fracionamento',
    status: 'active' as const,
    inputType: 'radio' as const,
    options: [
      'Mensal',
      'Trimestral',
      'Semestral',
      'Anual',
      'Não aplicável (para crédito)',
    ],
  },
];

async function seedTemplates() {
  const db = await getDatabase();
  const questionsCollection = db.collection<Question>('questions');
  const templatesCollection = db.collection<Template>('templates');

  console.log('🌱 Iniciando seed de templates...');

  // 1. Criar questões
  console.log('📝 Criando questões...');
  const questionIds: Record<string, string> = {};

  for (const qData of questionsData) {
    // Verificar se a questão já existe
    const existing = await questionsCollection.findOne({
      title: qData.title,
    });

    if (existing) {
      questionIds[qData.title] = existing._id?.toString() || '';
      // Sempre atualizar questão existente para garantir que tem inputType e options corretos
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (qData.inputType) {
        updateData.inputType = qData.inputType;
      }

      if (qData.inputType === 'select' && qData.options) {
        updateData.options = qData.options;
      }

      await questionsCollection.updateOne(
        { _id: existing._id },
        { $set: updateData }
      );
      console.log(`  ✓ Questão "${qData.title}" atualizada`);
    } else {
      const now = new Date();
      const question: Question = {
        ...qData,
        createdAt: now,
        updatedAt: now,
      };

      const result = await questionsCollection.insertOne(question);
      questionIds[qData.title] = result.insertedId.toString();
      console.log(`  ✓ Questão "${qData.title}" criada`);
    }
  }

  // 2. Criar templates
  console.log('\n📋 Criando templates...');

  // Template 1: Registo de Produção Crédito (TODAS EXCETO Seguradora)
  const template1Questions = [
    questionIds['Data'],
    questionIds['Apontador'],
    questionIds['Agente'],
    questionIds['Nome do Cliente'],
    questionIds['Data nascimento'],
    questionIds['Email cliente'],
    questionIds['Telefone cliente'],
    questionIds['Distrito cliente'],
    questionIds['Rating cliente'],
    questionIds['Banco'],
    questionIds['Valor'],
    questionIds['Fracionamento'],
    // Seguradora NÃO incluída (única que não fica marcada por padrão)
  ].filter(Boolean);

  const template1 = await templatesCollection.findOne({
    title: 'Registo de Produção Crédito',
  });
  if (!template1) {
    const now = new Date();
    await templatesCollection.insertOne({
      title: 'Registo de Produção Crédito',
      description: 'Template para registo de produção de crédito',
      questions: template1Questions,
      isDefault: true,
      isPublic: true, // Templates padrão são públicos
      createdAt: now,
      updatedAt: now,
    });
    console.log('  ✓ Template "Registo de Produção Crédito" criado');
  } else {
    // Atualizar se já existe para garantir que tem isDefault e isPublic
    await templatesCollection.updateOne(
      { title: 'Registo de Produção Crédito' },
      { $set: { isDefault: true, isPublic: true, questions: template1Questions } }
    );
    console.log('  ✓ Template "Registo de Produção Crédito" atualizado');
  }

  // Template 2: Registo de Produção Seguros (TODAS as questões)
  const template2Questions = [
    questionIds['Data'],
    questionIds['Apontador'],
    questionIds['Agente'],
    questionIds['Nome do Cliente'],
    questionIds['Data nascimento'],
    questionIds['Email cliente'],
    questionIds['Telefone cliente'],
    questionIds['Distrito cliente'],
    questionIds['Rating cliente'],
    questionIds['Seguradora'],
    questionIds['Banco'],
    questionIds['Valor'],
    questionIds['Fracionamento'],
  ].filter(Boolean);

  const template2 = await templatesCollection.findOne({
    title: 'Registo de Produção Seguros',
  });
  if (!template2) {
    const now = new Date();
    await templatesCollection.insertOne({
      title: 'Registo de Produção Seguros',
      description: 'Template para registo de produção de seguros',
      questions: template2Questions,
      isDefault: true,
      isPublic: true, // Templates padrão são públicos
      createdAt: now,
      updatedAt: now,
    });
    console.log('  ✓ Template "Registo de Produção Seguros" criado');
  } else {
    // Atualizar se já existe para garantir que tem isDefault e isPublic
    await templatesCollection.updateOne(
      { title: 'Registo de Produção Seguros' },
      { $set: { isDefault: true, isPublic: true, questions: template2Questions } }
    );
    console.log('  ✓ Template "Registo de Produção Seguros" atualizado');
  }

  // Template 3: Registo de Vendas Imobiliária (TODAS as questões)
  const template3Questions = [
    questionIds['Data'],
    questionIds['Apontador'],
    questionIds['Agente'],
    questionIds['Nome do Cliente'],
    questionIds['Data nascimento'],
    questionIds['Email cliente'],
    questionIds['Telefone cliente'],
    questionIds['Distrito cliente'],
    questionIds['Rating cliente'],
    questionIds['Seguradora'],
    questionIds['Banco'],
    questionIds['Valor'],
    questionIds['Fracionamento'],
  ].filter(Boolean);

  const template3 = await templatesCollection.findOne({
    title: 'Registo de Vendas Imobiliária',
  });
  if (!template3) {
    const now = new Date();
    await templatesCollection.insertOne({
      title: 'Registo de Vendas Imobiliária',
      description: 'Template para registo de vendas imobiliária',
      questions: template3Questions,
      isDefault: true,
      isPublic: true, // Templates padrão são públicos
      createdAt: now,
      updatedAt: now,
    });
    console.log('  ✓ Template "Registo de Vendas Imobiliária" criado');
  } else {
    // Atualizar se já existe para garantir que tem isDefault e isPublic
    await templatesCollection.updateOne(
      { title: 'Registo de Vendas Imobiliária' },
      { $set: { isDefault: true, isPublic: true, questions: template3Questions } }
    );
    console.log('  ✓ Template "Registo de Vendas Imobiliária" atualizado');
  }

  console.log('\n✅ Seed concluído com sucesso!');
}

// Executar se chamado diretamente
if (require.main === module) {
  seedTemplates()
    .then(() => {
      console.log('Processo finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro ao executar seed:', error);
      process.exit(1);
    });
}

export { seedTemplates };
