/**
 * Seed de dados dummy (submissions).
 *
 * Apenas via CLI: npm run seed:dummy
 *
 * Requer: templates, questões e pelo menos um utilizador na BD.
 * Usa o primeiro admin como submittedBy; se não houver admin, o primeiro user.
 */

import path from 'path';
import dotenv from 'dotenv';

const root = path.resolve(process.cwd(), '..');
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { prisma } from '../lib/prisma';
import { SEED_SUBMISSIONS } from './seed-submissions-data';

function isDatabaseUrlValid(url: string | undefined): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;
  return /^(postgresql|postgres):\/\//i.test(url.trim());
}

async function seedDummySubmissions(): Promise<number> {
  if (!isDatabaseUrlValid(process.env.DATABASE_URL)) {
    console.warn(
      '⚠️  Seed dummy ignorado: defina DATABASE_URL em backend/.env ou na raiz do projeto.',
    );
    return 0;
  }

  console.log('🌱 Seed de dados dummy (submissions)...\n');

  // Obter utilizador para submittedBy (admin primeiro, senão primeiro user)
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true },
  });
  const user = admin ?? (await prisma.user.findFirst({ select: { id: true } }));

  if (!user) {
    console.error('❌ Nenhum utilizador encontrado. Crie um utilizador primeiro.');
    return 0;
  }

  // Obter templates e questões
  const templates = await prisma.template.findMany({
    include: {
      questions: { include: { question: true }, orderBy: { order: 'asc' } },
    },
  });
  const templateMap = new Map(templates.map((t) => [t.title, t]));

  let created = 0;

  for (const entry of SEED_SUBMISSIONS) {
    const template = templateMap.get(entry.templateTitle);
    if (!template) {
      console.warn(`   ⚠️  Template "${entry.templateTitle}" não encontrado; ignorado.`);
      continue;
    }

    const answers: { questionId: string; answer: string }[] = [];
    for (const tq of template.questions) {
      const answer = entry.answersByQuestionTitle[tq.question.title];
      if (answer !== undefined) {
        answers.push({ questionId: tq.questionId, answer: String(answer) });
      }
    }

    if (answers.length === 0) {
      console.warn(`   ⚠️  Nenhuma resposta válida para "${entry.templateTitle}"; ignorado.`);
      continue;
    }

    await prisma.formSubmission.create({
      data: {
        templateId: template.id,
        submittedBy: user.id,
        answers,
        modelContext: entry.modelContext ?? null,
      },
    });
    created++;
    console.log(`   ✅ Submission criada: ${entry.templateTitle} (${answers.length} respostas)`);
  }

  console.log(`\n📊 Resumo: ${created} submissions criadas.`);
  return created;
}

seedDummySubmissions()
  .then((count) => {
    console.log('\n✅ Seed dummy concluído.');
    process.exit(count >= 0 ? 0 : 1);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
