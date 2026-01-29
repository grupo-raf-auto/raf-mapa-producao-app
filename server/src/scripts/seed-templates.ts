import { prisma } from "../lib/prisma";

const agentes = [
  "Andreia Freitas",
  "Ricardo Freitas",
  "Carina Pereira",
  "Daniela Martins",
  "Isabel Ribeiro",
  "Monica Martins",
  "Maria Patricia",
  "Sara Oliveira",
  "Maria João",
  "Daniel Matos",
  "Marisa Guimaraes",
  "Sara da Costa",
  "Sara Costa",
  "Ana Claudia",
  "Anabela Ataíde",
  "Patricia Gonçalves",
  "Patricia Viana",
  "Tiago Nascimento",
  "Vera Sá",
];

const seguradoras = [
  "Prevoir",
  "Prevoir DOMUS",
  "Liberty",
  "Zurich",
  "Asisa",
  "Ageas",
  "Generali Tranquilidade",
  "Fidelidade",
  "Metlife",
  "Una",
  "AdvanceCare",
  "Real",
  "AIG",
  "Caravela",
  "Allianz",
  "Vitoria",
  "Mgen",
];

const bancos = [
  "BPI",
  "Santander",
  "NovoBanco",
  "CGD",
  "Bankinter",
  "Abanca",
  "AbancaSerfin",
  "Montepio",
  "TD Credito",
  "Credibom",
  "CTT",
  "Chance Plus",
  "Caixa Crédito Agricola",
];

const questionsData = [
  {
    title: "Data",
    description: "Data do registo",
    status: "active" as const,
    inputType: "date" as const,
  },
  {
    title: "Apontador",
    description: "Nome do apontador",
    status: "active" as const,
    inputType: "text" as const,
  },
  {
    title: "Agente",
    description: "Nome do agente",
    status: "active" as const,
    inputType: "select" as const,
    options: agentes,
  },
  {
    title: "Nome do Cliente",
    description: "Nome completo do cliente",
    status: "active" as const,
    inputType: "text" as const,
  },
  {
    title: "Data nascimento",
    description: "Data de nascimento do cliente",
    status: "active" as const,
    inputType: "date" as const,
  },
  {
    title: "Email cliente",
    description: "Endereço de email do cliente",
    status: "active" as const,
    inputType: "email" as const,
  },
  {
    title: "Telefone cliente",
    description: "Telefone do cliente (sem indicativo)",
    status: "active" as const,
    inputType: "tel" as const,
  },
  {
    title: "Distrito cliente",
    description: "Distrito de residência do cliente",
    status: "active" as const,
    inputType: "text" as const,
  },
  {
    title: "Rating cliente",
    description: "Rating/classificação do cliente",
    status: "active" as const,
    inputType: "text" as const,
  },
  {
    title: "Seguradora",
    description: "Nome da seguradora",
    status: "active" as const,
    inputType: "select" as const,
    options: seguradoras,
  },
  {
    title: "Banco",
    description: "Nome do banco",
    status: "active" as const,
    inputType: "select" as const,
    options: bancos,
  },
  {
    title: "Valor",
    description: "Valor total do financiamento (crédito)",
    status: "active" as const,
    inputType: "number" as const,
  },
  {
    title: "Fracionamento",
    description: "Fracionamento",
    status: "active" as const,
    inputType: "radio" as const,
    options: [
      "Mensal",
      "Trimestral",
      "Semestral",
      "Anual",
      "Não aplicável (para crédito)",
    ],
  },
];

function isDatabaseUrlValid(url: string | undefined): boolean {
  if (!url || typeof url !== "string" || url.trim() === "") return false;
  return /^(postgresql|postgres):\/\//i.test(url.trim());
}

/**
 * Cria ou atualiza um template com suas relações de questões
 */
async function upsertTemplate(
  title: string,
  description: string,
  questionIds: string[]
) {
  const existing = await prisma.template.findFirst({ where: { title } });

  if (!existing) {
    // Criar novo template com relações
    await prisma.template.create({
      data: {
        title,
        description,
        isDefault: true,
        isPublic: true,
        questionIds, // Campo legado para compatibilidade
        questions: {
          create: questionIds.map((questionId, index) => ({
            questionId,
            order: index,
          })),
        },
      },
    });
    console.log(`  ✓ Template "${title}" criado`);
  } else {
    // Atualizar template existente
    await prisma.$transaction(async (tx) => {
      // Atualizar campos básicos
      await tx.template.update({
        where: { id: existing.id },
        data: {
          isDefault: true,
          isPublic: true,
          questionIds, // Campo legado
        },
      });

      // Deletar relações antigas
      await tx.templateQuestion.deleteMany({
        where: { templateId: existing.id },
      });

      // Criar novas relações
      if (questionIds.length > 0) {
        await tx.templateQuestion.createMany({
          data: questionIds.map((questionId, index) => ({
            templateId: existing.id,
            questionId,
            order: index,
          })),
        });
      }
    });
    console.log(`  ✓ Template "${title}" atualizado`);
  }
}

export async function seedTemplates() {
  if (!isDatabaseUrlValid(process.env.DATABASE_URL)) {
    console.warn(
      "⚠️  Seed ignorado: defina DATABASE_URL em server/.env ou na raiz do projeto.\n" +
        '   Ex.: DATABASE_URL="postgresql://user:pass@host:5432/nome_db" (Neon, Supabase, etc.)'
    );
    return;
  }

  console.log("🌱 Iniciando seed de templates...");

  const questionIds: Record<string, string> = {};

  // Criar/atualizar questões
  for (const qData of questionsData) {
    let q = await prisma.question.findFirst({ where: { title: qData.title } });
    if (q) {
      questionIds[qData.title] = q.id;
      await prisma.question.update({
        where: { id: q.id },
        data: {
          inputType: qData.inputType,
          options: ("options" in qData ? qData.options : undefined) || [],
          updatedAt: new Date(),
        },
      });
      console.log(`  ✓ Questão "${qData.title}" atualizada`);
    } else {
      q = await prisma.question.create({
        data: {
          title: qData.title,
          description: qData.description,
          status: qData.status,
          inputType: qData.inputType,
          options: ("options" in qData ? qData.options : []) || [],
        },
      });
      questionIds[qData.title] = q.id;
      console.log(`  ✓ Questão "${qData.title}" criada`);
    }
  }

  // Template 1: Registo de Produção Crédito
  const t1Questions = [
    questionIds["Data"],
    questionIds["Apontador"],
    questionIds["Agente"],
    questionIds["Nome do Cliente"],
    questionIds["Data nascimento"],
    questionIds["Email cliente"],
    questionIds["Telefone cliente"],
    questionIds["Distrito cliente"],
    questionIds["Rating cliente"],
    questionIds["Banco"],
    questionIds["Valor"],
    questionIds["Fracionamento"],
  ].filter(Boolean);

  await upsertTemplate(
    "Registo de Produção Crédito",
    "Template para registo de produção de crédito",
    t1Questions
  );

  // Template 2: Registo de Produção Seguros
  const t2Questions = [
    questionIds["Data"],
    questionIds["Apontador"],
    questionIds["Agente"],
    questionIds["Nome do Cliente"],
    questionIds["Data nascimento"],
    questionIds["Email cliente"],
    questionIds["Telefone cliente"],
    questionIds["Distrito cliente"],
    questionIds["Rating cliente"],
    questionIds["Seguradora"],
    questionIds["Banco"],
    questionIds["Valor"],
    questionIds["Fracionamento"],
  ].filter(Boolean);

  await upsertTemplate(
    "Registo de Produção Seguros",
    "Template para registo de produção de seguros",
    t2Questions
  );

  // Template 3: Registo de Vendas Imobiliária
  await upsertTemplate(
    "Registo de Vendas Imobiliária",
    "Template para registo de vendas imobiliária",
    t2Questions
  );

  console.log("\n✅ Seed concluído com sucesso!");
}
