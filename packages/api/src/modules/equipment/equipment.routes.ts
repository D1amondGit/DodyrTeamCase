import type { FastifyInstance } from 'fastify';
import type { Repositories } from '../../repositories/index.js';
import { Errors } from '../../errors.js';

export async function registerEquipmentRoutes(app: FastifyInstance, repos: Repositories) {
  app.get('/api/v1/equipment', { onRequest: app.authenticate }, async (_request, reply) => {
    const equipment = await repos.equipment.list({ isActive: true });
    return reply.send({ success: true, data: equipment });
  });

  app.get<{ Params: { id: string } }>(
    '/api/v1/equipment/:id',
    { onRequest: app.authenticate },
    async (request, reply) => {
      const eq = await repos.equipment.findById(request.params.id);
      if (!eq) throw Errors.NotFound('Equipment');
      return reply.send({ success: true, data: eq });
    },
  );

  app.get<{ Params: { id: string } }>(
    '/api/v1/equipment/:id/history',
    { onRequest: app.authenticate },
    async (request, reply) => {
      const history = await repos.equipment.historyFor(request.params.id);
      return reply.send({ success: true, data: history });
    },
  );
}
