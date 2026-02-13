/**
* Seed de questões a partir de backend/src/scripts/seed-questions-data.ts
 * 
 * Uso (no diretório backend):
 *   npm run seed:questions
 *
 * Questões já existentes (mesmo título) são ignoradas. Para alterar a lista,
 * edita SEED_QUESTIONS em seed-questions-data.ts.
 */

import path from 'path';
import dotenv from 'dotenv';

const root = path.resolve(process.cwd(), '..');
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { prisma } from '../lib/prisma';
import { SEED_QUESTIONS } from './seed-questions-data';

function isDatabaseUrlValid(url: string | undefined): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;
  return /^(postgresql|postgres):\/\//i.test(url.trim());
}

export interface SeedQuestionsResult {
  created: number;
  skipped: number;
}

/** Seed de questões. Passar disconnect: false quando chamado a partir da API. */
export async function seedQuestions(options?: {
  disconnect?: boolean;
  silent?: boolean;
}): Promise<SeedQuestionsResult> {
  const disconnect = options?.disconnect ?? true;
  const silent = options?.silent ?? false;

  if (!isDatabaseUrlValid(process.env.DATABASE_URL)) {
    if (!silent) {
      console.warn(
        '⚠️  Seed de questões ignorado: defina DATABASE_URL em backend/.env ou na raiz do projeto.',
      );
    }
    return { created: 0, skipped: 0 };
  }

  if (!silent) {
    console.log('🌱 Seed de questões...');
    console.log(
      `   Fonte: ${SEED_QUESTIONS.length} questões em seed-questions-data.ts\n`,
    );
  }

  let created = 0;
  let skipped = 0;

  try {
    for (const q of SEED_QUESTIONS) {
      const existing = await prisma.question.findFirst({
        where: { title: q.title },
      });

      if (existing) {
        skipped++;
        if (!silent) console.log(`   ⏭️  "${q.title}" já existe (ignorado).`);
        continue;
      }

      await prisma.question.create({
        data: {
          title: q.title,
          description: q.description ?? null,
          status: 'active',
          inputType: q.inputType,
          options: q.options ?? [],
        },
      });
      created++;
      if (!silent) console.log(`   ✅ "${q.title}" criada.`);
    }

    if (!silent) {
      console.log('\n📊 Resumo:');
      console.log(`   Criadas: ${created}`);
      console.log(`   Já existentes: ${skipped}`);
    }
    return { created, skipped };
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError?.code === 'P2021') {
      if (!silent) {
        console.warn(
          '⚠️  Seed de questões ignorado: tabelas da base de dados não existem.\n   Execute: npx prisma migrate deploy --schema=src/prisma/schema.prisma',
        );
      }
      return { created: 0, skipped: 0 };
    }
    console.error('❌ Erro durante seed de questões:', error);
    throw error;
  } finally {
    if (disconnect) {
      await prisma.$disconnect();
    }
  }
}

// Executar se chamado diretamente (npm run seed:questions)
const isMain = process.argv[1]?.includes('seed-questions');
if (isMain) {
  seedQuestions({ disconnect: true })
    .then(() => {
      console.log('\n✅ Seed de questões concluído.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
