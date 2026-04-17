import type { FastifyInstance } from 'fastify';
import type { Repositories } from '../../repositories/index.js';
import { Errors } from '../../errors.js';

export async function registerRoutesModule(app: FastifyInstance, repos: Repositories) {
  app.get('/api/v1/routes', { onRequest: app.authenticate }, async (_request, reply) => {
    const routes = await repos.routes.list();
    return reply.send({ success: true, data: routes });
  });

  app.get<{ Params: { id: string } }>(
    '/api/v1/routes/:id',
    { onRequest: app.authenticate },
    async (request, reply) => {
      const route = await repos.routes.findById(request.params.id);
      if (!route) throw Errors.NotFound('Route');
      return reply.send({ success: true, data: route });
    },
  );
}
