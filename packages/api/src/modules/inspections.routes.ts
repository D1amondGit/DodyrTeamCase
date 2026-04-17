import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  startInspectionInputSchema,
  checkpointInputSchema,
  completeInspectionInputSchema,
} from '@mobilny-obhodchik/shared';
import { repositories } from '../repositories/index.js';
import { InspectionService } from '../services/inspection.service.js';
import { SyntheticToirAdapter } from '../adapters/toir/toir-synthetic.adapter.js';

export async function inspectionRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const toirAdapter = new SyntheticToirAdapter();
  const inspectionService = new InspectionService(
    repositories.inspections,
    repositories.checkpoints,
    repositories.schedules,
    repositories.equipment,
    toirAdapter,
  );

  // Все роуты обходов требуют авторизации рабочего
  typedApp.addHook('preValidation', app.authenticate);
  typedApp.addHook('preValidation', app.requireRole('WORKER'));

  typedApp.post(
    '/start',
    { schema: { body: startInspectionInputSchema } },
    async (request) => {
      const { scheduleId, offlineSyncId } = request.body;
      const data = await inspectionService.start(request.user.sub, scheduleId, offlineSyncId);
      return { success: true, data };
    },
  );

  typedApp.post(
    '/:id/checkpoint',
    { schema: { body: checkpointInputSchema } },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await inspectionService.submitCheckpoint(request.user.sub, id, request.body);
      return { success: true, data };
    },
  );

  typedApp.post(
    '/:id/complete',
    { schema: { body: completeInspectionInputSchema } },
    async (request) => {
      const { id } = request.params as { id: string };
      const { notes, completedAt } = request.body;
      const data = await inspectionService.complete(request.user.sub, id, notes, completedAt);
      return { success: true, data };
    },
  );
}