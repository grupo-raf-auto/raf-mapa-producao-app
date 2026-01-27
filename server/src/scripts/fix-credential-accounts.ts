/**
 * Script para criar Account com providerId "credential" em Users que não têm.
 * Necessário se existirem Users criados antes do Better Auth ou sem o linkAccount.
 *
 * Cada utilizador afetado recebe uma password temporária: "Alterar123!"
 * Devem fazer login e alterar a senha (ou usar "Esqueci a minha senha").
 *
 * Uso: cd server && npx tsx src/scripts/fix-credential-accounts.ts
 */

import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import path from "path";
import dotenv from "dotenv";

// Carregar .env (raiz e server)
const root = path.resolve(process.cwd(), "..");
dotenv.config({ path: path.join(root, ".env") });
dotenv.config({ path: path.join(root, ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { prisma } from "../lib/prisma";

// Hash compatível com Better Auth (scrypt: salt:hexKey)
const TEMP_PASSWORD = "Alterar123!";

async function hashLikeBetterAuth(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      64,
      {
        N: 16384,
        r: 16,
        p: 1,
        maxmem: 128 * 16384 * 16 * 2,
      },
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      }
    );
  });
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

async function main() {
  const users = await prisma.user.findMany({
    include: { accounts: { where: { providerId: "credential" } } },
  });

  const withoutCredential = users.filter((u) => u.accounts.length === 0);
  if (withoutCredential.length === 0) {
    console.log('Nenhum utilizador sem Account "credential".');
    return;
  }

  const hash = await hashLikeBetterAuth(TEMP_PASSWORD);

  for (const user of withoutCredential) {
    const id = `c${randomBytes(12).toString("hex")}`;
    await prisma.$executeRaw`
      INSERT INTO account (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
      VALUES (${id}, ${user.id}, ${user.id}, 'credential', ${hash}, NOW(), NOW())
    `;
    console.log(`Account credential criada: ${user.email}`);
  }

  console.log(
    `\n${withoutCredential.length} conta(s) criada(s). Password temporária: "${TEMP_PASSWORD}"`,
  );
  console.log("Peça a estes utilizadores para entrarem e alterarem a senha.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
