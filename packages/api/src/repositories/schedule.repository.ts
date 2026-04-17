import type { PrismaClient } from '@prisma/client';

export class ScheduleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string) {
    return this.prisma.schedule.findUnique({
      where: { id },
      include: { route: true, worker: true },
    });
  }

  findByDateRange(from: Date, to: Date, workerId?: string) {
    return this.prisma.schedule.findMany({
      where: {
        scheduled_date: { gte: from, lte: to },
        ...(workerId ? { worker_id: workerId } : {}),
      },
      include: { route: true, worker: true },
      orderBy: [{ scheduled_date: 'asc' }, { shift: 'asc' }],
    });
  }

  findTodayFor(workerId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return this.prisma.schedule.findFirst({
      where: {
        worker_id: workerId,
        scheduled_date: { gte: today, lt: tomorrow },
      },
      include: {
        route: {
          include: {
            equipment: { orderBy: { sequence_order: 'asc' } },
          },
        },
        inspections: { orderBy: { created_at: 'desc' }, take: 1 },
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
        worker_id: workerId,
        scheduled_date: { gte: from, lt: to },
      },
      include: {
        route: {
          include: {
            equipment: { where: { is_active: true }, orderBy: { sequence_order: 'asc' } },
          },
        },
        inspections: { orderBy: { created_at: 'desc' }, take: 1 },
      },
      orderBy: [{ scheduled_date: 'asc' }, { shift: 'asc' }],
    });
  }

  create(data: {
    workerId: string;
    routeId: string;
    scheduledDate: Date;
    shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
    createdById: string;
  }) {
    return this.prisma.schedule.create({
      data: {
        worker_id: data.workerId,
        route_id: data.routeId,
        scheduled_date: data.scheduledDate,
        shift: data.shift,
        created_by: data.createdById,
      },
    });
  }

  updateStatus(
    id: string,
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED',
    extra?: { actualStart?: Date; actualEnd?: Date },
  ) {
    return this.prisma.schedule.update({
      where: { id },
      data: {
        status,
        ...(extra?.actualStart ? { actual_start: extra.actualStart } : {}),
        ...(extra?.actualEnd ? { actual_end: extra.actualEnd } : {}),
      },
    });
  }
}
