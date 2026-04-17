import Fastify from 'fastify';
import cors from '@fastify/cors';
<<<<<<< HEAD
=======
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { config } from './config.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerSwagger } from './plugins/swagger.js';
import { registerAuth } from './plugins/auth.js';
import { authRoutes } from './modules/auth.routes.js';
import { inspectionRoutes } from './modules/inspections.routes.js';
import { defectRoutes } from './modules/defects.routes.js';
import { API_PREFIX } from '@mobilny-obhodchik/shared';
import { fileRoutes } from './modules/files.routes.js';
>>>>>>> 3ab6cfc72bd1b9dfd83a6e82578e8a95325bfd1c

const server = Fastify({
  logger: true
});

server.register(cors, { origin: true });

<<<<<<< HEAD
server.get('/api/health', async (request, reply) => {
  return { 
    success: true, 
    message: 'Мобильный Обходчик API is running!',
    timestamp: new Date().toISOString()
  };
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Server is running on http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
=======
async function buildServer() {
  // Плагины
  await app.register(cors, { origin: config.CORS_ORIGINS });
  await app.register(multipart, { limits: { fileSize: config.MAX_UPLOAD_MB * 1024 * 1024 } });
  await app.register(fastifyStatic, {
    root: path.resolve(config.STORAGE_LOCAL_PATH),
    prefix: `${API_PREFIX}/files/`,
    decorateReply: false,
  });
  
  registerErrorHandler(app);
  await registerSwagger(app);
  await registerAuth(app);

  // Роуты
  await app.register(authRoutes, { prefix: `${API_PREFIX}/auth` });
  await app.register(inspectionRoutes, { prefix: `${API_PREFIX}/inspections` });
  await app.register(defectRoutes, { prefix: `${API_PREFIX}/defects` });
  await app.register(fileRoutes, { prefix: `${API_PREFIX}/files` });

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
>>>>>>> 3ab6cfc72bd1b9dfd83a6e82578e8a95325bfd1c
