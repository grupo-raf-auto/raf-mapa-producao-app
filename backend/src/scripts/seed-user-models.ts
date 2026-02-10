import { prisma } from '../lib/prisma';

function isDatabaseUrlValid(url: string | undefined): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;
  return /^(postgresql|postgres):\/\//i.test(url.trim());
}

export async function seedUserModels() {
  if (!isDatabaseUrlValid(process.env.DATABASE_URL)) {
    console.warn(
      '⚠️  Seed ignorado: defina DATABASE_URL em backend/.env ou na raiz do projeto.',
    );
    return;
  }

  console.log('🌱 Iniciando seed de modelos de utilizadores...');

  try {
    // Encontrar utilizadores que não têm modelos
    const usersWithoutModels = await prisma.user.findMany({
      where: {
        userModels: {
          none: {},
        },
      },
    });

    console.log(
      `  📊 Encontrados ${usersWithoutModels.length} utilizadores sem modelos`,
    );

    for (const user of usersWithoutModels) {
      try {
        // Criar profile de Crédito
        const creditoProfile = await prisma.creditoProfile.create({ data: {} });

        // Criar UserModel associado
        await prisma.userModel.create({
          data: {
            userId: user.id,
            modelType: 'credito',
            creditoProfileId: creditoProfile.id,
            isActive: true,
          },
        });

        console.log(
          `  ✓ Modelo de Crédito criado para ${user.email} (${user.id})`,
        );
      } catch (error) {
        console.error(`  ✗ Erro ao criar modelo para ${user.email}:`, error);
      }
    }

    console.log('\n✅ Seed de modelos concluído com sucesso!');
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2021') {
      console.warn(
        '⚠️  Seed de modelos ignorado: tabelas da base de dados não existem.\n   Execute: npx prisma migrate deploy --schema=src/prisma/schema.prisma',
      );
      return;
    }
    console.error('❌ Erro durante seed de modelos:', error);
    throw error;
  }
}
