import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { config } from './config.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerSwagger } from './plugins/swagger.js';
import { registerAuth } from './plugins/auth.js';
import { authRoutes } from './modules/auth.routes.js';
import { inspectionRoutes } from './modules/inspections.routes.js';
import { defectRoutes } from './modules/defects.routes.js';
import { API_PREFIX } from '@mobilny-obhodchik/shared';

const app = Fastify({
  logger: { transport: { target: 'pino-pretty' } },
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

async function buildServer() {
  // Плагины
  await app.register(cors, { origin: config.CORS_ORIGINS });
  await app.register(multipart, { limits: { fileSize: config.MAX_UPLOAD_MB * 1024 * 1024 } });
  
  registerErrorHandler(app);
  await registerSwagger(app);
  await registerAuth(app);

  // Роуты
  await app.register(authRoutes, { prefix: `${API_PREFIX}/auth` });
  await app.register(inspectionRoutes, { prefix: `${API_PREFIX}/inspections` });
  await app.register(defectRoutes, { prefix: `${API_PREFIX}/defects` });

  app.get('/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

  return app;
}

buildServer()
  .then((server) => server.listen({ port: config.API_PORT, host: config.API_HOST }))
  .then(() => {
    app.log.info(`🚀 Server running at http://${config.API_HOST}:${config.API_PORT}`);
    app.log.info(`📚 Swagger docs at http://${config.API_HOST}:${config.API_PORT}/api/docs`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });