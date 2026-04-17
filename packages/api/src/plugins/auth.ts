import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { config } from '../config.js';
import { Errors } from '../errors.js';
import type { UserRole } from '@mobilny-obhodchik/shared';

export type JwtUserPayload = {
  sub: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
};

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticateRefresh: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (
      roles: UserRole | UserRole[],
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: JwtUserPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtUserPayload;
    user: JwtUserPayload;
  }
}

export async function registerAuth(app: FastifyInstance): Promise<void> {
  // We register two JWT namespaces: access + refresh
  await app.register(fastifyJwt, {
    secret: config.JWT_ACCESS_SECRET,
    sign: { expiresIn: config.JWT_ACCESS_TTL },
    namespace: 'access',
    jwtVerify: 'accessVerify',
    jwtSign: 'accessSign',
  });

  await app.register(fastifyJwt, {
    secret: config.JWT_REFRESH_SECRET,
    sign: { expiresIn: config.JWT_REFRESH_TTL },
    namespace: 'refresh',
    jwtVerify: 'refreshVerify',
    jwtSign: 'refreshSign',
  });

  app.decorate('authenticate', async function (request: FastifyRequest) {
    try {
      // @ts-expect-error namespace-decorated method
      const payload = (await request.accessVerify()) as JwtUserPayload;
      if (payload.type !== 'access') throw Errors.Unauthorized('Неверный тип токена');
      request.user = payload;
    } catch (err) {
      if (err instanceof Error && err.message.includes('expired')) {
        throw Errors.Unauthorized('Срок действия токена истек');
      }
      throw Errors.Unauthorized();
    }
  });

  app.decorate('authenticateRefresh', async function (request: FastifyRequest) {
    try {
      // @ts-expect-error namespace-decorated method
      const payload = (await request.refreshVerify()) as JwtUserPayload;
      if (payload.type !== 'refresh') throw Errors.Unauthorized('Неверный тип токена');
      request.user = payload;
    } catch {
      throw Errors.Unauthorized('Невалидный refresh-токен');
    }
  });

  app.decorate('requireRole', function (roles: UserRole | UserRole[]) {
    const allowed = Array.isArray(roles) ? roles : [roles];
    return async function (request: FastifyRequest) {
      if (!request.user) throw Errors.Unauthorized();
      if (!allowed.includes(request.user.role)) {
        throw Errors.Forbidden(`Доступно только ролям: ${allowed.join(', ')}`);
      }
    };
  });
}
