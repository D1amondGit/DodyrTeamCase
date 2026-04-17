import type { PrismaClient } from '@prisma/client';

export class InspectionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string) {
    return this.prisma.inspection.findUnique({
      where: { id },
      include: {
        checkpoints: { include: { equipment: true }, orderBy: { sequence_order: 'asc' } },
        worker: { select: { id: true, name: true, employee_id: true } },
        route: true,
        schedule: true,
        defects: true,
      },
    });
  }

  findByOfflineSyncId(offlineSyncId: string) {
    return this.prisma.inspection.findUnique({ where: { offline_sync_id: offlineSyncId } });
  }

  listForWorker(workerId: string, take = 20) {
    return this.prisma.inspection.findMany({
      where: { worker_id: workerId },
      orderBy: { started_at: 'desc' },
      take,
      include: { route: { select: { id: true, name: true } } },
    });
  }

  listAll(filter?: {
    workerId?: string;
    status?: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'INTERRUPTED';
    from?: Date;
    to?: Date;
  }) {
    return this.prisma.inspection.findMany({
      where: {
        ...(filter?.workerId ? { worker_id: filter.workerId } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.from || filter?.to
          ? { started_at: { gte: filter?.from, lte: filter?.to } }
          : {}),
      },
      orderBy: { started_at: 'desc' },
      include: {
        worker: { select: { id: true, name: true } },
        route: { select: { id: true, name: true } },
      },
    });
  }

  create(data: {
    scheduleId: string;
    workerId: string;
    routeId: string;
    totalCheckpoints: number;
    offlineSyncId?: string;
    checkpointSeeds: Array<{ equipmentId: string; sequenceOrder: number }>;
  }) {
    return this.prisma.inspection.create({
      data: {
        schedule_id: data.scheduleId,
        worker_id: data.workerId,
        route_id: data.routeId,
        total_checkpoints: data.totalCheckpoints,
        offline_sync_id: data.offlineSyncId ?? null,
        checkpoints: {
          create: data.checkpointSeeds.map((s) => ({
            equipment_id: s.equipmentId,
            sequence_order: s.sequenceOrder,
          })),
        },
      },
      include: { checkpoints: true },
    });
  }

  updateProgress(id: string, completedCount: number, hasDefects: boolean) {
    return this.prisma.inspection.update({
      where: { id },
      data: {
        completed_checkpoints: completedCount,
        has_defects: hasDefects,
        status: 'IN_PROGRESS',
      },
    });
  }

  markCompleted(id: string, notes: string | undefined, completedAt: Date) {
    return this.prisma.inspection.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completed_at: completedAt,
        notes: notes ?? null,
      },
    });
  }
}
