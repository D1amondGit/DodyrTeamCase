import type { PrismaClient, DefectStatus, Severity } from '@prisma/client';

export class DefectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(filter?: { status?: DefectStatus; severity?: Severity; workerId?: string }) {
    return this.prisma.defect.findMany({
      where: {
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.severity ? { severity: filter.severity } : {}),
        ...(filter?.workerId ? { reported_by: filter.workerId } : {}),
      },
      orderBy: [{ severity: 'desc' }, { created_at: 'desc' }],
      include: {
        equipment: { select: { id: true, name: true, code: true, zone: true } },
        reporter: { select: { id: true, name: true } },
        resolver: { select: { id: true, name: true } },
      },
    });
  }

  findById(id: string) {
    return this.prisma.defect.findUnique({
      where: { id },
      include: {
        equipment: true,
        reporter: { select: { id: true, name: true } },
        resolver: { select: { id: true, name: true } },
        checkpoint: true,
      },
    });
  }

  create(data: {
    checkpoint_id?: string | null;
    equipment_id: string;
    inspection_id?: string | null;
    reported_by: string;
    severity: Severity;
    description: string;
    photos?: unknown[];
  }) {
    return this.prisma.defect.create({
      data: {
        checkpoint_id: data.checkpoint_id ?? null,
        equipment_id: data.equipment_id,
        inspection_id: data.inspection_id ?? null,
        reported_by: data.reported_by,
        severity: data.severity,
        description: data.description,
        photos: data.photos ?? [],
      },
    });
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
        resolution_notes: resolutionNotes ?? null,
        resolved_by: status === 'RESOLVED' ? resolverId : null,
        resolved_at: status === 'RESOLVED' ? new Date() : null,
      },
    });
  }
}
