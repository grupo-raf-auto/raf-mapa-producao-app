/**
 * Carrega server/.env no arranque para que DATABASE_URL e outras variáveis
 * estejam disponíveis no Next.js (Better Auth, Prisma) quando só existe server/.env.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const path = await import("path");
    const dotenv = await import("dotenv");
    const envPath = path.default.join(process.cwd(), "..", "server", ".env");
    dotenv.default.config({ path: envPath });
  }
}
