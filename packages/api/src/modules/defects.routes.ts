import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createDefectInputSchema, updateDefectStatusInputSchema } from '@mobilny-obhodchik/shared';
import { repositories } from '../repositories/index.js';
import { DefectService } from '../services/defect.service.js';

export async function defectRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const defectService = new DefectService(repositories.defects);

  typedApp.addHook('preValidation', app.authenticate);

  typedApp.post(
    '/',
    { schema: { body: createDefectInputSchema } },
    async (request) => {
      const data = await defectService.report(request.user.sub, request.body);
      return { success: true, data };
    },
  );

  typedApp.put(
    '/:id/status',
    { 
      schema: { body: updateDefectStatusInputSchema },
      preValidation: [app.requireRole(['MANAGER', 'ADMIN'])] 
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const data = await defectService.updateStatus(request.user.sub, id, request.body);
      return { success: true, data };
    },
  );
}