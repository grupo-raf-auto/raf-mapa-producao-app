import { createRequire } from "module";
const require = createRequire(import.meta.url);
try {
  const path = require.resolve("@prisma/client");
  console.log("Resolved path:", path);
  const pkg = require(path.replace("index.js", "package.json"));
  console.log("Version:", pkg.version);
} catch (e) {
  console.error(e);
}
