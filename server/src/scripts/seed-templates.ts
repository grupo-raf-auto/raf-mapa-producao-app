import { getDatabase } from '../config/database';
import { Question, Template } from '../types';
import { ObjectId } from 'mongodb';

const questionsData = [
  { title: 'Data', description: 'Data do registo', category: 'Custom' as const, status: 'active' as const },
  { title: 'Apontador', description: 'Nome do apontador', category: 'Custom' as const, status: 'active' as const },
  { title: 'Agente', description: 'Nome do agente', category: 'Custom' as const, status: 'active' as const },
  { title: 'Nome do cliente', description: 'Nome completo do cliente', category: 'Custom' as const, status: 'active' as const },
  { title: 'Data nascimento', description: 'Data de nascimento do cliente', category: 'Custom' as const, status: 'active' as const },
  { title: 'Email cliente', description: 'Endereço de email do cliente', category: 'Custom' as const, status: 'active' as const },
  { title: 'Telefone cliente', description: 'Telefone do cliente (sem indicativo)', category: 'Custom' as const, status: 'active' as const },
  { title: 'Distrito do cliente', description: 'Distrito de residência do cliente', category: 'Custom' as const, status: 'active' as const },
  { title: 'Rating cliente', description: 'Rating/classificação do cliente', category: 'Custom' as const, status: 'active' as const },
  { title: 'Seguradora', description: 'Nome da seguradora', category: 'Custom' as const, status: 'active' as const },
  { title: 'Banco', description: 'Nome do banco', category: 'Custom' as const, status: 'active' as const },
  { title: 'Valor', description: 'Valor total do financiamento (crédito)', category: 'Custom' as const, status: 'active' as const },
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
      category: qData.category
    });

    if (existing) {
      questionIds[qData.title] = existing._id?.toString() || '';
      console.log(`  ✓ Questão "${qData.title}" já existe`);
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

  // Template 1: Registo de Produção Crédito
  const template1Questions = [
    questionIds['Data'],
    questionIds['Apontador'],
    questionIds['Agente'],
    questionIds['Nome do cliente'],
    questionIds['Data nascimento'],
    questionIds['Email cliente'],
    questionIds['Telefone cliente'],
    questionIds['Distrito do cliente'],
    questionIds['Rating cliente'],
    questionIds['Banco'],
    questionIds['Valor'],
  ].filter(Boolean);

  const template1 = await templatesCollection.findOne({ title: 'Registo de Produção Crédito' });
  if (!template1) {
    const now = new Date();
    await templatesCollection.insertOne({
      title: 'Registo de Produção Crédito',
      description: 'Template para registo de produção de crédito',
      questions: template1Questions,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log('  ✓ Template "Registo de Produção Crédito" criado');
  } else {
    // Atualizar se já existe para garantir que tem isDefault
    await templatesCollection.updateOne(
      { title: 'Registo de Produção Crédito' },
      { $set: { isDefault: true, questions: template1Questions } }
    );
    console.log('  ✓ Template "Registo de Produção Crédito" atualizado');
  }

  // Template 2: Registo de Produção Seguros
  const template2Questions = [
    questionIds['Data'],
    questionIds['Apontador'],
    questionIds['Agente'],
    questionIds['Nome do cliente'],
    questionIds['Data nascimento'],
    questionIds['Email cliente'],
    questionIds['Telefone cliente'],
    questionIds['Distrito do cliente'],
    questionIds['Rating cliente'],
    questionIds['Seguradora'],
  ].filter(Boolean);

  const template2 = await templatesCollection.findOne({ title: 'Registo de Produção Seguros' });
  if (!template2) {
    const now = new Date();
    await templatesCollection.insertOne({
      title: 'Registo de Produção Seguros',
      description: 'Template para registo de produção de seguros',
      questions: template2Questions,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log('  ✓ Template "Registo de Produção Seguros" criado');
  } else {
    // Atualizar se já existe para garantir que tem isDefault
    await templatesCollection.updateOne(
      { title: 'Registo de Produção Seguros' },
      { $set: { isDefault: true, questions: template2Questions } }
    );
    console.log('  ✓ Template "Registo de Produção Seguros" atualizado');
  }

  // Template 3: Registo de Vendas Imobiliária
  const template3Questions = [
    questionIds['Data'],
    questionIds['Apontador'],
    questionIds['Agente'],
    questionIds['Nome do cliente'],
    questionIds['Data nascimento'],
    questionIds['Email cliente'],
    questionIds['Telefone cliente'],
    questionIds['Distrito do cliente'],
    questionIds['Rating cliente'],
    questionIds['Seguradora'],
    questionIds['Banco'],
    questionIds['Valor'],
  ].filter(Boolean);

  const template3 = await templatesCollection.findOne({ title: 'Registo de Vendas Imobiliária' });
  if (!template3) {
    const now = new Date();
    await templatesCollection.insertOne({
      title: 'Registo de Vendas Imobiliária',
      description: 'Template para registo de vendas imobiliária',
      questions: template3Questions,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log('  ✓ Template "Registo de Vendas Imobiliária" criado');
  } else {
    // Atualizar se já existe para garantir que tem isDefault
    await templatesCollection.updateOne(
      { title: 'Registo de Vendas Imobiliária' },
      { $set: { isDefault: true, questions: template3Questions } }
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
