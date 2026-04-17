import type { PrismaClient } from '@prisma/client';

export class AnalyticsService {
  constructor(private readonly prisma: PrismaClient) {}

  async overview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [
      inspectionsToday,
      inspectionsCompletedToday,
      activeDefects,
      criticalDefects,
      workersOnShift,
      totalEquipment,
    ] = await Promise.all([
      this.prisma.inspection.count({ where: { started_at: { gte: today, lt: tomorrow } } }),
      this.prisma.inspection.count({
        where: { started_at: { gte: today, lt: tomorrow }, status: 'COMPLETED' },
      }),
      this.prisma.defect.count({ where: { status: { not: 'RESOLVED' } } }),
      this.prisma.defect.count({
        where: { status: { not: 'RESOLVED' }, severity: 'CRITICAL' },
      }),
      this.prisma.schedule.count({
        where: { scheduled_date: { gte: today, lt: tomorrow } },
      }),
      this.prisma.equipment.count({ where: { is_active: true } }),
    ]);

    const recent = await this.prisma.checkpoint.findMany({
      where: { inspected_at: { not: null } },
      take: 50,
      orderBy: { inspected_at: 'desc' },
      select: { status: true },
    });
    const healthy = recent.filter((c: { status: string }) => c.status === 'OK').length;
    const equipmentHealthScore =
      recent.length === 0 ? 100 : Math.round((healthy / recent.length) * 100);

    return {
      inspectionsToday,
      inspectionsCompletedToday,
      activeDefects,
      criticalDefects,
      workersOnShift,
      totalEquipment,
      equipmentHealthScore,
    };
  }

  async completionTrend(days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    const inspections = await this.prisma.inspection.findMany({
      where: { started_at: { gte: from } },
      select: { started_at: true, status: true },
    });

    const bucket = new Map<string, { planned: number; completed: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      bucket.set(key, { planned: 0, completed: 0 });
    }
    for (const ins of inspections) {
      const key = ins.started_at.toISOString().slice(0, 10);
      const entry = bucket.get(key);
      if (!entry) continue;
      entry.planned += 1;
      if (ins.status === 'COMPLETED') entry.completed += 1;
    }
    return Array.from(bucket.entries()).map(([date, v]) => ({ date, ...v }));
  }

  async defectSeverityBreakdown() {
    const groups = await this.prisma.defect.groupBy({
      by: ['severity'],
      _count: true,
      where: { status: { not: 'RESOLVED' } },
    });
    return groups.map((g: { severity: string; _count: number }) => ({ severity: g.severity, count: g._count }));
  }

  async equipmentHealth() {
    const equipment = await this.prisma.equipment.findMany({
      where: { is_active: true },
      orderBy: { sequence_order: 'asc' },
    });
    const result: Array<{
      equipmentId: string;
      code: string;
      name: string;
      status: 'OK' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
      lastInspectedAt: string | null;
      activeDefects: number;
    }> = [];
    for (const eq of equipment) {
      const last = await this.prisma.checkpoint.findFirst({
        where: { equipment_id: eq.id, inspected_at: { not: null } },
        orderBy: { inspected_at: 'desc' },
        select: { status: true, inspected_at: true },
      });
      const activeDefects = await this.prisma.defect.count({
        where: { equipment_id: eq.id, status: { not: 'RESOLVED' } },
      });
      const status: 'OK' | 'WARNING' | 'CRITICAL' | 'UNKNOWN' =
        !last || !last.inspected_at
          ? 'UNKNOWN'
          : last.status === 'CRITICAL'
            ? 'CRITICAL'
            : last.status === 'WARNING'
              ? 'WARNING'
              : 'OK';
      result.push({
        equipmentId: eq.id,
        code: eq.code,
        name: eq.name,
        status,
        lastInspectedAt: last?.inspected_at ? last.inspected_at.toISOString() : null,
        activeDefects,
      });
    }
    return result;
  }

  async workerStats() {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const workers = await this.prisma.user.findMany({
      where: { role: 'WORKER', is_active: true },
      orderBy: { name: 'asc' },
    });
    const result = [];
    for (const w of workers) {
      const inspections = await this.prisma.inspection.findMany({
        where: { worker_id: w.id, started_at: { gte: since } },
      });
      const completed = inspections.filter((i: { status: string }) => i.status === 'COMPLETED');
      const defects = await this.prisma.defect.count({
        where: { reported_by: w.id, created_at: { gte: since } },
      });
      const avgMinutes =
        completed.length === 0
          ? 0
          : Math.round(
              completed.reduce(
                (acc: number, i: { completed_at: Date | null; started_at: Date }) =>
                  acc +
                  (i.completed_at ? (i.completed_at.getTime() - i.started_at.getTime()) / 60000 : 0),
                0,
              ) / completed.length,
            );
      result.push({
        workerId: w.id,
        name: w.name,
        inspections: inspections.length,
        completed: completed.length,
        avgMinutes,
        defects,
      });
    }
    return result;
  }

  async defectTrends() {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const defects = await this.prisma.defect.findMany({
      where: { created_at: { gte: since } },
      include: { equipment: { select: { name: true, code: true, zone: true } } },
    });
    const byEquipment = new Map<string, { name: string; code: string; count: number }>();
    const byZone = new Map<string, number>();
    for (const d of defects) {
      const key = d.equipment.code;
      const cur = byEquipment.get(key) ?? { name: d.equipment.name, code: d.equipment.code, count: 0 };
      cur.count += 1;
      byEquipment.set(key, cur);
      byZone.set(d.equipment.zone, (byZone.get(d.equipment.zone) ?? 0) + 1);
    }
    return {
      byEquipment: Array.from(byEquipment.values()).sort((a, b) => b.count - a.count),
      byZone: Array.from(byZone.entries()).map(([zone, count]) => ({ zone, count })),
    };
  }

  async scheduleCompliance() {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const schedules = await this.prisma.schedule.findMany({
      where: { scheduled_date: { gte: since } },
      select: { id: true, scheduled_date: true, status: true },
    });
    const bucket = new Map<string, { planned: number; completed: number; missed: number }>();
    for (const s of schedules) {
      const key = s.scheduled_date.toISOString().slice(0, 10);
      const entry = bucket.get(key) ?? { planned: 0, completed: 0, missed: 0 };
      entry.planned += 1;
      if (s.status === 'COMPLETED') entry.completed += 1;
      else if (s.status === 'MISSED') entry.missed += 1;
      bucket.set(key, entry);
    }
    return Array.from(bucket.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
