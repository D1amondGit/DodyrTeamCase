import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { config } from './config.js';
import { registerAuth } from './plugins/auth.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerSwagger } from './plugins/swagger.js';
import { registerDefaultSubscribers } from './events/event-bus.js';
import { repositories } from './repositories/index.js';
import { registerAuthRoutes } from './modules/auth/auth.routes.js';
import { registerUsersRoutes } from './modules/users/users.routes.js';
import { registerSchedulesRoutes } from './modules/schedules/schedules.routes.js';
import { registerEquipmentRoutes } from './modules/equipment/equipment.routes.js';
import { registerRoutesModule } from './modules/routes/routes.routes.js';
import { registerInspectionsRoutes } from './modules/inspections/inspections.routes.js';
import { registerDefectsRoutes } from './modules/defects/defects.routes.js';
import { registerAnalyticsRoutes } from './modules/analytics/analytics.routes.js';

export async function createApp() {
  const app = Fastify({
    logger: { transport: { target: 'pino-pretty', options: { colorize: true } } },
  }).withTypeProvider<ZodTypeProvider>();

  await app.register(cors, { origin: config.CORS_ORIGINS });
  await app.register(multipart, { limits: { fileSize: config.MAX_UPLOAD_MB * 1024 * 1024 } });

  registerErrorHandler(app);
  registerDefaultSubscribers(app.log);

  await registerAuth(app);
  await registerSwagger(app);

  await registerAuthRoutes(app, repositories);
  await registerUsersRoutes(app, repositories);
  await registerSchedulesRoutes(app, repositories);
  await registerEquipmentRoutes(app, repositories);
  await registerRoutesModule(app, repositories);
  await registerInspectionsRoutes(app, repositories);
  await registerDefectsRoutes(app, repositories);
  await registerAnalyticsRoutes(app, repositories);

  return app;
}
