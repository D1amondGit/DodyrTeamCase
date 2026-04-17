import type { PrismaClient, DefectStatus, DefectSeverity, Prisma } from '@prisma/client';

export class DefectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(filter?: { status?: DefectStatus; severity?: DefectSeverity; workerId?: string }) {
    return this.prisma.defect.findMany({
      where: {
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.severity ? { severity: filter.severity } : {}),
        ...(filter?.workerId ? { reportedById: filter.workerId } : {}),
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      include: {
        equipment: { select: { id: true, name: true, code: true, zone: true } },
        reportedBy: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
    });
  }

  findById(id: string) {
    return this.prisma.defect.findUnique({
      where: { id },
      include: {
        equipment: true,
        reportedBy: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
        checkpoint: true,
      },
    });
  }

  create(data: {
    checkpointId?: string | null;
    equipmentId: string;
    inspectionId?: string | null;
    reportedById: string;
    severity: DefectSeverity;
    description?: string | null;
    photos: Prisma.InputJsonValue;
  }) {
    return this.prisma.defect.create({ data });
  }

  updateStatus(
    id: string,
    status: DefectStatus,
    resolverId: string,
    resolutionNotes?: string,
  ) {
    return this.prisma.defect.update({
      where: { id },
      data: {
        status,
        resolutionNotes: resolutionNotes ?? undefined,
        resolvedById: status === 'RESOLVED' ? resolverId : undefined,
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
      },
    });
  }
}
