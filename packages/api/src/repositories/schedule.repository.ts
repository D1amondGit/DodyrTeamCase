import type { PrismaClient, Schedule } from '@prisma/client';

export class ScheduleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string) {
    return this.prisma.schedule.findUnique({
      where: { id },
      include: { route: true, worker: true },
    });
  }

  findByDateRange(from: Date, to: Date, workerId?: string): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: {
        scheduledDate: { gte: from, lte: to },
        ...(workerId ? { workerId } : {}),
      },
      include: { route: true, worker: true },
      orderBy: [{ scheduledDate: 'asc' }, { shift: 'asc' }],
    }) as unknown as Promise<Schedule[]>;
  }

  findTodayFor(workerId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return this.prisma.schedule.findFirst({
      where: {
        workerId,
        scheduledDate: { gte: today, lt: tomorrow },
      },
      include: {
        route: {
          include: {
            equipment: { orderBy: { sequenceOrder: 'asc' } },
          },
        },
        inspections: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  findDayPlanForWorker(workerId: string, day: Date) {
    const from = new Date(day);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(from.getDate() + 1);

    return this.prisma.schedule.findMany({
      where: {
        workerId,
        scheduledDate: { gte: from, lt: to },
      },
      include: {
        route: {
          include: {
            equipment: { where: { isActive: true }, orderBy: { sequenceOrder: 'asc' } },
          },
        },
        inspections: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: [{ scheduledDate: 'asc' }, { shift: 'asc' }],
    });
  }

  create(data: {
    workerId: string;
    routeId: string;
    scheduledDate: Date;
    shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
    createdById: string;
  }) {
    return this.prisma.schedule.create({ data });
  }

  updateStatus(
    id: string,
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED',
    extra?: { actualStart?: Date; actualEnd?: Date },
  ) {
    return this.prisma.schedule.update({
      where: { id },
      data: { status, ...extra },
    });
  }
}
