import type { FastifyInstance } from 'fastify';
import type { Repositories } from '../../repositories/index.js';
import { DefectService } from '../../services/defect.service.js';
import { createDefectInputSchema, updateDefectStatusInputSchema } from '@mobilny-obhodchik/shared';

export async function registerDefectsRoutes(app: FastifyInstance, repos: Repositories) {
  const defectService = new DefectService(repos.defects);

  app.post<{ Body: typeof createDefectInputSchema._type }>(
    '/api/v1/defects',
    {
      schema: { body: createDefectInputSchema },
      onRequest: app.authenticate,
    },
    async (request, reply) => {
      const defect = await defectService.report(request.user.sub, request.body);
      return reply.code(201).send({ success: true, data: defect });
    },
  );

  app.get(
    '/api/v1/defects',
    { onRequest: [app.authenticate, app.requireRole(['MANAGER', 'ADMIN'])] },
    async (_request, reply) => {
      const defects = await repos.defects.list();
      return reply.send({ success: true, data: defects });
    },
  );

  app.put<{ Params: { id: string }; Body: typeof updateDefectStatusInputSchema._type }>(
    '/api/v1/defects/:id/status',
    {
      schema: { body: updateDefectStatusInputSchema },
      onRequest: [app.authenticate, app.requireRole(['MANAGER', 'ADMIN'])],
    },
    async (request, reply) => {
      const defect = await defectService.updateStatus(request.user.sub, request.params.id, request.body);
      return reply.send({ success: true, data: defect });
    },
  );
}
