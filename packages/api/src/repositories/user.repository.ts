import type { PrismaClient, User, Role } from '@prisma/client';

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  list(filter?: { role?: Role; is_active?: boolean }): Promise<User[]> {
    return this.prisma.user.findMany({
      where: filter,
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
  }

  create(data: {
    email: string;
    name: string;
    password_hash: string;
    role: Role;
    employee_id: string;
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
      password_hash: string;
      role: Role;
      employee_id: string;
      department: string;
      is_active: boolean;
    }>,
  ): Promise<User> {
    const payload = { ...data };
    if (data.email) payload.email = data.email.toLowerCase();
    return this.prisma.user.update({ where: { id }, data: payload });
  }

  deactivate(id: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { is_active: false } });
  }
}
