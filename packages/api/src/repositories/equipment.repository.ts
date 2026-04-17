import type { PrismaClient } from '@prisma/client';

export class EquipmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(filter?: { isActive?: boolean; zone?: string }) {
    return this.prisma.equipment.findMany({
      where: {
        ...(filter?.zone ? { zone: filter.zone } : {}),
        ...(typeof filter?.isActive === 'boolean' ? { is_active: filter.isActive } : {}),
      },
      orderBy: { sequence_order: 'asc' },
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
      where: { route_id: routeId, is_active: true },
      orderBy: { sequence_order: 'asc' },
    });
  }

  historyFor(equipmentId: string, limit = 20) {
    return this.prisma.checkpoint.findMany({
      where: { equipment_id: equipmentId },
      orderBy: { inspected_at: 'desc' },
      take: limit,
      include: {
        inspection: { select: { id: true, worker_id: true, started_at: true, status: true } },
      },
    });
  }
}
