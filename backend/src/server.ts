import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) loadEnvFile(envPath);

const [{ buildApp }, { env }] = await Promise.all([
  import("./app.js"),
  import("./env.js")
]);

const app = await buildApp(env);
const shutdown = async () => { await app.close(); process.exit(0); };
process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown);
await app.listen({ host: env.API_HOST, port: env.API_PORT });
