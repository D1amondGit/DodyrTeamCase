import type { PrismaClient } from '@prisma/client';

export class RouteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list() {
    return this.prisma.route.findMany({
      where: { isActive: true },
      include: { equipment: { orderBy: { sequenceOrder: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.route.findUnique({
      where: { id },
      include: { equipment: { orderBy: { sequenceOrder: 'asc' } } },
    });
  }
}
