import { buildApp } from "./app";
import { env } from "./env";

async function start() {
  const app = await buildApp();

  try {
    const address = await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`Server listening on ${address}`);
    app.log.info(`Swagger Docs available at ${address}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
