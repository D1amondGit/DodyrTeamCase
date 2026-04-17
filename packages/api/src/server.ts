import { createApp } from './app.js';
import { config } from './config.js';

async function main() {
  const app = await createApp();
  try {
    await app.listen({ host: config.API_HOST, port: config.API_PORT });
    app.log.info(`🚀 API running at http://${config.API_HOST}:${config.API_PORT}`);
    app.log.info(`📚 Docs at http://${config.API_HOST}:${config.API_PORT}/api/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
