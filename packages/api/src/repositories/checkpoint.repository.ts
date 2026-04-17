import type { PrismaClient, Prisma } from '@prisma/client';

export class CheckpointRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByOfflineSyncId(offlineSyncId: string) {
    return this.prisma.checkpoint.findUnique({ where: { offlineSyncId } });
  }

  findByInspectionAndEquipment(inspectionId: string, equipmentId: string) {
    return this.prisma.checkpoint.findUnique({
      where: { inspectionId_equipmentId: { inspectionId, equipmentId } },
    });
  }

  update(
    id: string,
    data: {
      status: 'OK' | 'WARNING' | 'CRITICAL' | 'SKIPPED';
      measurements: Prisma.InputJsonValue;
      notes?: string | null;
      photos: Prisma.InputJsonValue;
      hasDefect: boolean;
      inspectedAt: Date;
      durationSeconds?: number;
      offlineSyncId?: string;
    },
  ) {
    return this.prisma.checkpoint.update({
      where: { id },
      data,
    });
  }

  countCompleted(inspectionId: string): Promise<number> {
    return this.prisma.checkpoint.count({
      where: {
        inspectionId,
        status: { in: ['OK', 'WARNING', 'CRITICAL', 'SKIPPED'] },
      },
    });
  }

  anyWithDefect(inspectionId: string): Promise<boolean> {
    return this.prisma.checkpoint
      .count({ where: { inspectionId, hasDefect: true } })
      .then((c) => c > 0);
  }
}
