/**
 * Seed de templates com questões.
 *
 * Via painel admin: botão "Restaurar templates iniciais" (POST /api/admin/seed)
 * Via CLI: npm run seed:templates
 *
 * 1. Cria questões em falta (seed-questions-data.ts)
 * 2. Cria templates com questões associadas (seed-templates-data.ts)
 * Templates já existentes (mesmo título) são ignorados.
 */

import path from 'path';
import dotenv from 'dotenv';

const root = path.resolve(process.cwd(), '..');
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { prisma } from '../lib/prisma';
import { seedQuestions } from './seed-questions';
import { SEED_TEMPLATES } from './seed-templates-data';

function isDatabaseUrlValid(url: string | undefined): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;
  return /^(postgresql|postgres):\/\//i.test(url.trim());
}

export interface SeedTemplatesResult {
  questions: { created: number; skipped: number };
  templates: { created: number; skipped: number };
}

/** Seed de templates e questões. disconnect: false quando chamado da API. */
export async function seedTemplatesAndQuestions(options?: {
  disconnect?: boolean;
  silent?: boolean;
}): Promise<SeedTemplatesResult> {
  const disconnect = options?.disconnect ?? true;
  const silent = options?.silent ?? false;

  if (!isDatabaseUrlValid(process.env.DATABASE_URL)) {
    if (!silent) {
      console.warn(
        '⚠️  Seed ignorado: defina DATABASE_URL em backend/.env ou na raiz do projeto.',
      );
    }
    return {
      questions: { created: 0, skipped: 0 },
      templates: { created: 0, skipped: 0 },
    };
  }

  if (!silent) {
    console.log('🌱 Seed de templates e questões...\n');
  }

  // 1. Seed questões
  const questionsResult = await seedQuestions({
    disconnect: false,
    silent,
  });

  // 2. Obter todas as questões por título
  const allQuestions = await prisma.question.findMany({
    select: { id: true, title: true },
  });
  const questionMap = new Map(allQuestions.map((q) => [q.title, q.id]));

  let templatesCreated = 0;
  let templatesSkipped = 0;

  for (const t of SEED_TEMPLATES) {
    const existing = await prisma.template.findFirst({
      where: { title: t.title },
    });

    if (existing) {
      templatesSkipped++;
      if (!silent) console.log(`   ⏭️  Template "${t.title}" já existe (ignorado).`);
      continue;
    }

    // Resolver IDs das questões
    const questionIds: string[] = [];
    for (const title of t.questionTitles) {
      const id = questionMap.get(title);
      if (id) {
        questionIds.push(id);
      } else if (!silent) {
        console.warn(`   ⚠️  Questão "${title}" não encontrada; omitida do template "${t.title}".`);
      }
    }

    if (questionIds.length === 0) {
      if (!silent) {
        console.warn(`   ⚠️  Template "${t.title}" sem questões válidas; não criado.`);
      }
      continue;
    }

    await prisma.template.create({
      data: {
        title: t.title,
        description: t.description ?? null,
        isPublic: t.isPublic ?? true,
        modelType: t.modelType ?? null,
        createdBy: null,
        questionIds,
        questions: {
          create: questionIds.map((questionId, index) => ({
            questionId,
            order: index,
          })),
        },
      },
    });
    templatesCreated++;
    if (!silent) console.log(`   ✅ Template "${t.title}" criado com ${questionIds.length} questões.`);
  }

  if (!silent) {
    console.log('\n📊 Resumo templates:');
    console.log(`   Criados: ${templatesCreated}`);
    console.log(`   Já existentes: ${templatesSkipped}`);
  }

  if (disconnect) {
    await prisma.$disconnect();
  }

  return {
    questions: questionsResult,
    templates: { created: templatesCreated, skipped: templatesSkipped },
  };
}

// Executar se chamado diretamente (npm run seed:templates)
const isMain = process.argv[1]?.includes('seed-templates');
if (isMain) {
  seedTemplatesAndQuestions({ disconnect: true })
    .then(() => {
      console.log('\n✅ Seed de templates concluído.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
