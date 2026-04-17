import { z } from 'zod';
import { UserRole } from '../enums.js';

export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120),
  password: z.string().min(6).max(128),
  role: z.enum([UserRole.WORKER, UserRole.MANAGER, UserRole.ADMIN]),
  employeeId: z.string().min(1).max(32),
  department: z.string().min(1).max(80),
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = createUserInputSchema.partial().extend({
  isActive: z.boolean().optional(),
  password: z.string().min(6).max(128).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
