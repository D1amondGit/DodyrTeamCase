import type { FastifyInstance } from 'fastify';
import type { Repositories } from '../../repositories/index.js';
import { Errors } from '../../errors.js';
import { createUserInputSchema } from '@mobilny-obhodchik/shared';
import bcrypt from 'bcryptjs';

export async function registerUsersRoutes(app: FastifyInstance, repos: Repositories) {
  app.get(
    '/api/v1/users',
    { onRequest: [app.authenticate, app.requireRole(['MANAGER', 'ADMIN'])] },
    async (_request, reply) => {
      const users = await repos.users.list({ is_active: true });
      return reply.send({ success: true, data: users });
    },
  );

  app.post<{ Body: typeof createUserInputSchema._type }>(
    '/api/v1/users',
    {
      schema: { body: createUserInputSchema },
      onRequest: [app.authenticate, app.requireRole(['ADMIN'])],
    },
    async (request, reply) => {
      const existing = await repos.users.findByEmail(request.body.email);
      if (existing) throw Errors.Conflict('Email already registered');
      const hash = await bcrypt.hash(request.body.password, 10);
      const user = await repos.users.create({
        email: request.body.email,
        name: request.body.name,
        password_hash: hash,
        role: request.body.role as any,
        employee_id: request.body.employeeId,
        department: request.body.department,
      });
      return reply.code(201).send({ success: true, data: user });
    },
  );
}
