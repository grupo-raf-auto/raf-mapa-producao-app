import { prisma } from "../lib/prisma";

async function setAdminByEmail(email: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.log(`❌ Utilizador com email ${email} não encontrado.`);
      console.log(
        "💡 Crie uma conta em /sign-up e volte a executar este script.",
      );
      return false;
    }

    if (user.role === "admin") {
      console.log(`ℹ️  ${email} já é admin.`);
      return true;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role: "admin" },
    });

    console.log(`✅ ${email} configurado como admin.`);
    return true;
  } catch (error) {
    console.error("❌ Erro:", error);
    return false;
  } finally {
    process.exit(0);
  }
}

const email = process.argv[2] || "admin@gruporaf.pt";
console.log(`🔧 A configurar ${email} como admin...`);
setAdminByEmail(email);
