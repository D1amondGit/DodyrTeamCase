import type { FastifyInstance } from 'fastify';
import type { Repositories } from '../../repositories/index.js';
import { AuthService } from '../../services/auth.service.js';
import { loginInputSchema, loginResponseSchema, refreshInputSchema, authTokensSchema } from '@mobilny-obhodchik/shared';

export async function registerAuthRoutes(app: FastifyInstance, repos: Repositories) {
  const authService = new AuthService(app, repos.users);

  app.post<{ Body: typeof loginInputSchema._type; Reply: typeof loginResponseSchema._type }>(
    '/api/v1/auth/login',
    { schema: { body: loginInputSchema, response: { 200: loginResponseSchema } } },
    async (request, reply) => {
      const result = await authService.login(request.body.email, request.body.password);
      return reply.send(result);
    },
  );

  app.post<{ Body: typeof refreshInputSchema._type; Reply: typeof authTokensSchema._type }>(
    '/api/v1/auth/refresh',
    {
      schema: { body: refreshInputSchema, response: { 200: authTokensSchema } },
      onRequest: app.authenticateRefresh,
    },
    async (request, reply) => {
      const tokens = await authService.refresh(request.user.sub);
      return reply.send(tokens);
    },
  );

  app.get('/api/v1/auth/me', { onRequest: app.authenticate }, async (request, reply) => {
    const user = await repos.users.findById(request.user.sub);
    if (!user) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    return reply.send({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  });
}
