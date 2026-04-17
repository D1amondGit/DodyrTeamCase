import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  startInspectionInputSchema,
  checkpointInputSchema,
  completeInspectionInputSchema,
} from '@mobilny-obhodchik/shared';
import { z } from 'zod';
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

  typedApp.get(
    '/daily-plan',
    {
      schema: {
        querystring: z.object({
          date: z.string().date().optional(),
        }),
      },
    },
    async (request) => {
      const data = await inspectionService.getDailyPlan(request.user.sub, request.query.date);
      return { success: true, data };
    },
  );

  typedApp.get(
    '/routes/:routeId',
    {
      schema: {
        params: z.object({ routeId: z.string() }),
        querystring: z.object({
          date: z.string().date().optional(),
        }),
      },
    },
    async (request) => {
      const data = await inspectionService.getRouteForWorker(
        request.user.sub,
        request.params.routeId,
        request.query.date,
      );
      return { success: true, data };
    },
  );

  typedApp.get(
    '/equipment/by-code/:code',
    {
      schema: {
        params: z.object({ code: z.string().min(1) }),
        querystring: z.object({
          date: z.string().date().optional(),
        }),
      },
    },
    async (request) => {
      const data = await inspectionService.identifyEquipment(
        request.user.sub,
        request.params.code,
        request.query.date,
      );
      return { success: true, data };
    },
  );

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
