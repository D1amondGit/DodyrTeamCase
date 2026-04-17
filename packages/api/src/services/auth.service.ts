import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import type { UserRepository } from '../repositories/user.repository.js';
import { Errors } from '../errors.js';
import type { JwtUserPayload } from '../plugins/auth.js';
import type { UserRole } from '@mobilny-obhodchik/shared';

export class AuthService {
  constructor(
    private readonly app: FastifyInstance,
    private readonly users: UserRepository,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !user.isActive) throw Errors.Unauthorized('Неверный email или пароль');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw Errors.Unauthorized('Неверный email или пароль');

    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        employeeId: user.employeeId,
        department: user.department,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async issueTokens(payload: { sub: string; email: string; role: UserRole }) {
    const accessPayload: JwtUserPayload = { ...payload, type: 'access' };
    const refreshPayload: JwtUserPayload = { ...payload, type: 'refresh' };

    // @ts-expect-error namespaced sign
    const accessToken: string = await this.app.jwt.access.sign(accessPayload);
    // @ts-expect-error namespaced sign
    const refreshToken: string = await this.app.jwt.refresh.sign(refreshPayload);

    // Approximate expirations for client UX (exact values encoded in JWT).
    const now = Date.now();
    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: new Date(now + 15 * 60 * 1000).toISOString(),
      refreshTokenExpiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async refresh(userId: string) {
    const user = await this.users.findById(userId);
    if (!user || !user.isActive) throw Errors.Unauthorized();
    return this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    });
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
