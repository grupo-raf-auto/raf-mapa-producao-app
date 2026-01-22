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

export async function seedTemplates() {
  if (!isDatabaseUrlValid(process.env.DATABASE_URL)) {
    console.warn(
      "⚠️  Seed ignorado: defina DATABASE_URL em server/.env ou na raiz do projeto.\n" +
        '   Ex.: DATABASE_URL="postgresql://user:pass@host:5432/nome_db" (Neon, Supabase, etc.)',
    );
    return;
  }

  console.log("🌱 Iniciando seed de templates...");

  const questionIds: Record<string, string> = {};

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

  let t1 = await prisma.template.findFirst({
    where: { title: "Registo de Produção Crédito" },
  });
  if (!t1) {
    await prisma.template.create({
      data: {
        title: "Registo de Produção Crédito",
        description: "Template para registo de produção de crédito",
        questions: t1Questions,
        isDefault: true,
        isPublic: true,
      },
    });
    console.log('  ✓ Template "Registo de Produção Crédito" criado');
  } else {
    await prisma.template.update({
      where: { id: t1.id },
      data: { isDefault: true, isPublic: true, questions: t1Questions },
    });
    console.log('  ✓ Template "Registo de Produção Crédito" atualizado');
  }

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

  let t2 = await prisma.template.findFirst({
    where: { title: "Registo de Produção Seguros" },
  });
  if (!t2) {
    await prisma.template.create({
      data: {
        title: "Registo de Produção Seguros",
        description: "Template para registo de produção de seguros",
        questions: t2Questions,
        isDefault: true,
        isPublic: true,
      },
    });
    console.log('  ✓ Template "Registo de Produção Seguros" criado');
  } else {
    await prisma.template.update({
      where: { id: t2.id },
      data: { isDefault: true, isPublic: true, questions: t2Questions },
    });
    console.log('  ✓ Template "Registo de Produção Seguros" atualizado');
  }

  const t3Questions = t2Questions;

  let t3 = await prisma.template.findFirst({
    where: { title: "Registo de Vendas Imobiliária" },
  });
  if (!t3) {
    await prisma.template.create({
      data: {
        title: "Registo de Vendas Imobiliária",
        description: "Template para registo de vendas imobiliária",
        questions: t3Questions,
        isDefault: true,
        isPublic: true,
      },
    });
    console.log('  ✓ Template "Registo de Vendas Imobiliária" criado');
  } else {
    await prisma.template.update({
      where: { id: t3.id },
      data: { isDefault: true, isPublic: true, questions: t3Questions },
    });
    console.log('  ✓ Template "Registo de Vendas Imobiliária" atualizado');
  }

  console.log("\n✅ Seed concluído com sucesso!");
}
