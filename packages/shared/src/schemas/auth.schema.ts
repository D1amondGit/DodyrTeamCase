import { z } from 'zod';
import { UserRole } from '../enums.js';

export const loginInputSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const refreshInputSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshInputSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  accessTokenExpiresAt: z.string().datetime(),
  refreshTokenExpiresAt: z.string().datetime(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

export const userPublicSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum([UserRole.WORKER, UserRole.MANAGER, UserRole.ADMIN]),
  employeeId: z.string(),
  department: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});
export type UserPublic = z.infer<typeof userPublicSchema>;

export const loginResponseSchema = z.object({
  user: userPublicSchema,
  tokens: authTokensSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;
