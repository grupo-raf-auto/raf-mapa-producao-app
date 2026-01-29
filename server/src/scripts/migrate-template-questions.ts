/**
 * Script de migração: Template.questions (String[]) → TemplateQuestion (tabela de junção)
 *
 * Este script migra os dados do campo legado `questions` (array de IDs)
 * para a nova tabela de junção `template_question` com integridade referencial.
 *
 * Execução: npx tsx server/src/scripts/migrate-template-questions.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TemplateWithQuestions {
  id: string;
  title: string;
  questionIds: string[];
}

async function migrateTemplateQuestions() {
  console.log("🚀 Iniciando migração de Template → TemplateQuestion...\n");

  try {
    // 1. Buscar todos os templates com o campo legado questionIds
    const templates = (await prisma.template.findMany({
      select: {
        id: true,
        title: true,
        questionIds: true,
      },
    })) as TemplateWithQuestions[];

    console.log(`📋 Encontrados ${templates.length} templates para migrar.\n`);

    // 2. Buscar todas as questões válidas
    const validQuestions = await prisma.question.findMany({
      select: { id: true },
    });
    const validQuestionIds = new Set(validQuestions.map((q) => q.id));

    console.log(`✅ ${validQuestionIds.size} questões válidas no sistema.\n`);

    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalInvalid = 0;

    // 3. Processar cada template
    for (const template of templates) {
      const questionIds = template.questionIds || [];

      if (questionIds.length === 0) {
        console.log(`⏭️  Template "${template.title}" (${template.id}): sem questões`);
        totalSkipped++;
        continue;
      }

      // Verificar se já existem relações para este template
      const existingRelations = await prisma.templateQuestion.count({
        where: { templateId: template.id },
      });

      if (existingRelations > 0) {
        console.log(
          `⏭️  Template "${template.title}" (${template.id}): já tem ${existingRelations} relações`
        );
        totalSkipped++;
        continue;
      }

      // Filtrar apenas questões válidas
      const validIds = questionIds.filter((qId) => validQuestionIds.has(qId));
      const invalidCount = questionIds.length - validIds.length;

      if (invalidCount > 0) {
        console.warn(
          `⚠️  Template "${template.title}": ${invalidCount} questões inválidas ignoradas`
        );
        totalInvalid += invalidCount;
      }

      if (validIds.length === 0) {
        console.log(
          `⏭️  Template "${template.title}" (${template.id}): todas questões inválidas`
        );
        totalSkipped++;
        continue;
      }

      // Criar relações na tabela de junção
      const relations = validIds.map((questionId, index) => ({
        templateId: template.id,
        questionId,
        order: index,
      }));

      await prisma.templateQuestion.createMany({
        data: relations,
        skipDuplicates: true,
      });

      console.log(
        `✅ Template "${template.title}" (${template.id}): ${validIds.length} questões migradas`
      );
      totalMigrated += validIds.length;
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMO DA MIGRAÇÃO:");
    console.log("=".repeat(60));
    console.log(`   Templates processados: ${templates.length}`);
    console.log(`   Templates ignorados:   ${totalSkipped}`);
    console.log(`   Relações criadas:      ${totalMigrated}`);
    console.log(`   Questões inválidas:    ${totalInvalid}`);
    console.log("=".repeat(60));
    console.log("\n✅ Migração concluída com sucesso!\n");

    // Verificação final
    const totalRelations = await prisma.templateQuestion.count();
    console.log(`📈 Total de relações em template_question: ${totalRelations}\n`);
  } catch (error) {
    console.error("\n❌ Erro durante a migração:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateTemplateQuestions();
