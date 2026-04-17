import type { PrismaClient } from '@prisma/client';

export class CheckpointRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByInspectionAndEquipment(inspectionId: string, equipmentId: string) {
    return this.prisma.checkpoint.findFirst({
      where: { inspection_id: inspectionId, equipment_id: equipmentId },
    });
  }

  update(
    id: string,
    data: {
      status: 'OK' | 'WARNING' | 'CRITICAL' | 'SKIPPED';
      measurements: object;
      notes?: string | null;
      photos: unknown[];
      hasDefect: boolean;
      inspectedAt: Date;
      durationSeconds?: number;
    },
  ) {
    return this.prisma.checkpoint.update({
      where: { id },
      data: {
        status: data.status,
        measurements: data.measurements,
        notes: data.notes,
        photos: data.photos,
        has_defect: data.hasDefect,
        inspected_at: data.inspectedAt,
        duration_seconds: data.durationSeconds ?? null,
      },
    });
  }

  countCompleted(inspectionId: string): Promise<number> {
    return this.prisma.checkpoint.count({
      where: {
        inspection_id: inspectionId,
        status: { in: ['OK', 'WARNING', 'CRITICAL', 'SKIPPED'] },
      },
    });
  }

  anyWithDefect(inspectionId: string): Promise<boolean> {
    return this.prisma.checkpoint
      .count({ where: { inspection_id: inspectionId, has_defect: true } })
      .then((c) => c > 0);
  }
}
