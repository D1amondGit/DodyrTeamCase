import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loginInputSchema, loginResponseSchema } from '@mobilny-obhodchik/shared';
import { repositories } from '../repositories/index.js';
import { AuthService } from '../services/auth.service.js';

export async function authRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const authService = new AuthService(app, repositories.users);

  typedApp.post(
    '/login',
    { schema: { body: loginInputSchema, response: { 200: loginResponseSchema } } },
    async (request) => {
      const { email, password } = request.body;
      const result = await authService.login(email, password);
      return result; // Swagger и ZodProvider сами завернут это, если нужно, но по ТЗ возвращаем просто data
    },
  );

  typedApp.get('/me', { preValidation: [app.authenticate] }, async (request) => {
    const user = await repositories.users.findById(request.user.sub);
    return { success: true, data: user };
  });
}