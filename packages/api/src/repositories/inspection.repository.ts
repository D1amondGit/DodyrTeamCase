import type { PrismaClient } from '@prisma/client';

export class InspectionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string) {
    return this.prisma.inspection.findUnique({
      where: { id },
      include: {
        checkpoints: { include: { equipment: true }, orderBy: { sequenceOrder: 'asc' } },
        worker: { select: { id: true, name: true, employeeId: true } },
        route: true,
        schedule: true,
        defects: true,
      },
    });
  }

  findByOfflineSyncId(offlineSyncId: string) {
    return this.prisma.inspection.findUnique({ where: { offlineSyncId } });
  }

  listForWorker(workerId: string, take = 20) {
    return this.prisma.inspection.findMany({
      where: { workerId },
      orderBy: { startedAt: 'desc' },
      take,
      include: { route: true },
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
        ...(filter?.workerId ? { workerId: filter.workerId } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.from || filter?.to
          ? { startedAt: { gte: filter?.from, lte: filter?.to } }
          : {}),
      },
      orderBy: { startedAt: 'desc' },
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
        scheduleId: data.scheduleId,
        workerId: data.workerId,
        routeId: data.routeId,
        totalCheckpoints: data.totalCheckpoints,
        offlineSyncId: data.offlineSyncId,
        checkpoints: {
          create: data.checkpointSeeds.map((s) => ({
            equipmentId: s.equipmentId,
            sequenceOrder: s.sequenceOrder,
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
        completedCheckpoints: completedCount,
        hasDefects,
        status: 'IN_PROGRESS',
      },
    });
  }

  markCompleted(id: string, notes: string | undefined, completedAt: Date) {
    return this.prisma.inspection.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt,
        notes: notes ?? undefined,
      },
    });
  }
}
