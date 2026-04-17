import type { FastifyInstance } from 'fastify';
import type { Repositories } from '../../repositories/index.js';

export async function registerSchedulesRoutes(app: FastifyInstance, repos: Repositories) {
  app.get(
    '/api/v1/schedules/today',
    { onRequest: app.authenticate },
    async (request, reply) => {
      const schedule = await repos.schedules.findTodayFor(request.user.sub);
      return reply.send({ success: true, data: schedule ?? null });
    },
  );

  app.get(
    '/api/v1/schedules/:workerId',
    { onRequest: app.authenticate },
    async (request, reply) => {
      const { workerId } = request.params as { workerId: string };
      if (request.user.role === 'WORKER' && request.user.sub !== workerId) {
        return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      }
      const schedules = await repos.schedules.findByDateRange(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date(),
        workerId,
      );
      return reply.send({ success: true, data: schedules });
    },
  );
}
