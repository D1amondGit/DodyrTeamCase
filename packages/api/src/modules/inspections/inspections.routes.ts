import type { FastifyInstance } from 'fastify';
import type { Repositories } from '../../repositories/index.js';
import { InspectionService } from '../../services/inspection.service.js';
import { SyntheticToirAdapter } from '../../adapters/toir/toir-synthetic.adapter.js';
import { startInspectionInputSchema, checkpointInputSchema, completeInspectionInputSchema } from '@mobilny-obhodchik/shared';

export async function registerInspectionsRoutes(app: FastifyInstance, repos: Repositories) {
  const toir = new SyntheticToirAdapter();
  const inspService = new InspectionService(repos.inspections, repos.checkpoints, repos.schedules, repos.equipment, toir);

  app.post<{ Body: typeof startInspectionInputSchema._type }>(
    '/api/v1/inspections/start',
    {
      schema: { body: startInspectionInputSchema },
      onRequest: app.authenticate,
    },
    async (request, reply) => {
      const inspection = await inspService.start(request.user.sub, request.body.scheduleId, request.body.offlineSyncId);
      return reply.code(201).send({ success: true, data: inspection });
    },
  );

  app.get<{ Params: { id: string } }>(
    '/api/v1/inspections/:id',
    { onRequest: app.authenticate },
    async (request, reply) => {
      const insp = await repos.inspections.findById(request.params.id);
      if (!insp) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } });
      if (request.user.role === 'WORKER' && insp.worker_id !== request.user.sub) {
        return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      }
      return reply.send({ success: true, data: insp });
    },
  );

  app.post<{ Params: { id: string }; Body: typeof checkpointInputSchema._type }>(
    '/api/v1/inspections/:id/checkpoint',
    {
      schema: { body: checkpointInputSchema },
      onRequest: app.authenticate,
    },
    async (request, reply) => {
      const checkpoint = await inspService.submitCheckpoint(request.user.sub, request.params.id, request.body);
      return reply.send({ success: true, data: checkpoint });
    },
  );

  app.post<{ Params: { id: string }; Body: typeof completeInspectionInputSchema._type }>(
    '/api/v1/inspections/:id/complete',
    {
      schema: { body: completeInspectionInputSchema },
      onRequest: app.authenticate,
    },
    async (request, reply) => {
      const insp = await inspService.complete(request.user.sub, request.params.id, request.body.notes);
      return reply.send({ success: true, data: insp });
    },
  );
}
