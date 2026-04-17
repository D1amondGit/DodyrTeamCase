import type { PrismaClient, Equipment } from '@prisma/client';

export class EquipmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(filter?: { isActive?: boolean; zone?: string }): Promise<Equipment[]> {
    return this.prisma.equipment.findMany({
      where: filter,
      orderBy: { sequenceOrder: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.equipment.findUnique({
      where: { id },
      include: { route: true },
    });
  }

  findByCode(code: string) {
    return this.prisma.equipment.findUnique({
      where: { code },
      include: { route: true },
    });
  }

  findByRoute(routeId: string) {
    return this.prisma.equipment.findMany({
      where: { routeId, isActive: true },
      orderBy: { sequenceOrder: 'asc' },
    });
  }

  historyFor(equipmentId: string, limit = 20) {
    return this.prisma.checkpoint.findMany({
      where: { equipmentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        inspection: { select: { id: true, workerId: true, startedAt: true, status: true } },
      },
    });
  }
}
