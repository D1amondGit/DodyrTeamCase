import type { PrismaClient } from '@prisma/client';
import type { UserRole } from '@mobilny-obhodchik/shared';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  employeeId: string;
  department: string;
  isActive: boolean;
  createdAt: Date;
}

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toUserRecord(user: {
    id: string;
    email: string;
    name: string;
    password_hash: string;
    role: string;
    employee_id: string;
    department: string | null;
    is_active: boolean;
    created_at: Date;
  }): UserRecord {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.password_hash,
      role: user.role as UserRole,
      employeeId: user.employee_id,
      department: user.department ?? '',
      isActive: user.is_active,
      createdAt: user.created_at,
    };
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toUserRecord(user) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return user ? this.toUserRecord(user) : null;
  }

  list(filter?: { role?: UserRole; is_active?: boolean }) {
    return this.prisma.user.findMany({
      where: {
        ...(filter?.role ? { role: filter.role } : {}),
        ...(typeof filter?.is_active === 'boolean' ? { is_active: filter.is_active } : {}),
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
  }

  create(data: {
    email: string;
    name: string;
    password_hash: string;
    role: UserRole;
    employee_id: string;
    department: string;
  }) {
    return this.prisma.user.create({
      data: { ...data, email: data.email.toLowerCase() },
    });
  }

  update(
    id: string,
    data: Partial<{
      email: string;
      name: string;
      password_hash: string;
      role: UserRole;
      employee_id: string;
      department: string;
      is_active: boolean;
    }>,
  ) {
    const payload = { ...data };
    if (data.email) payload.email = data.email.toLowerCase();
    return this.prisma.user.update({ where: { id }, data: payload });
  }

  deactivate(id: string) {
    return this.prisma.user.update({ where: { id }, data: { is_active: false } });
  }
}
