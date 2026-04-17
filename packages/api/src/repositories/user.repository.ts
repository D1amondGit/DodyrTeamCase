import type { PrismaClient, User, UserRole as PrismaUserRole } from '@prisma/client';

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  list(filter?: { role?: PrismaUserRole; isActive?: boolean }): Promise<User[]> {
    return this.prisma.user.findMany({
      where: filter,
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
  }

  create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role: PrismaUserRole;
    employeeId: string;
    department: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: { ...data, email: data.email.toLowerCase() },
    });
  }

  update(
    id: string,
    data: Partial<{
      email: string;
      name: string;
      passwordHash: string;
      role: PrismaUserRole;
      employeeId: string;
      department: string;
      isActive: boolean;
    }>,
  ): Promise<User> {
    const payload: typeof data = { ...data };
    if (data.email) payload.email = data.email.toLowerCase();
    return this.prisma.user.update({ where: { id }, data: payload });
  }

  deactivate(id: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }
}
