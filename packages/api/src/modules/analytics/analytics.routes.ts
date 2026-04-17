import type { FastifyInstance } from 'fastify';
import type { Repositories } from '../../repositories/index.js';
import { AnalyticsService } from '../../services/analytics.service.js';
import { prisma } from '../../prisma.js';

export async function registerAnalyticsRoutes(app: FastifyInstance, _repos: Repositories) {
  const analytics = new AnalyticsService(prisma);

  app.get(
    '/api/v1/analytics/overview',
    { onRequest: [app.authenticate, app.requireRole(['MANAGER', 'ADMIN'])] },
    async (_request, reply) => {
      const data = await analytics.overview();
      return reply.send({ success: true, data });
    },
  );

  app.get(
    '/api/v1/analytics/completion-trend',
    { onRequest: [app.authenticate, app.requireRole(['MANAGER', 'ADMIN'])] },
    async (_request, reply) => {
      const data = await analytics.completionTrend();
      return reply.send({ success: true, data });
    },
  );

  app.get(
    '/api/v1/analytics/equipment-health',
    { onRequest: [app.authenticate, app.requireRole(['MANAGER', 'ADMIN'])] },
    async (_request, reply) => {
      const data = await analytics.equipmentHealth();
      return reply.send({ success: true, data });
    },
  );

  app.get(
    '/api/v1/analytics/worker-stats',
    { onRequest: [app.authenticate, app.requireRole(['MANAGER', 'ADMIN'])] },
    async (_request, reply) => {
      const data = await analytics.workerStats();
      return reply.send({ success: true, data });
    },
  );
}
