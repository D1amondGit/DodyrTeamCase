import type { PrismaClient } from '@prisma/client';

export class RouteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list() {
    return this.prisma.route.findMany({
      where: { is_active: true },
      include: { equipment: { orderBy: { sequence_order: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.route.findUnique({
      where: { id },
      include: { equipment: { orderBy: { sequence_order: 'asc' } } },
    });
  }
}
