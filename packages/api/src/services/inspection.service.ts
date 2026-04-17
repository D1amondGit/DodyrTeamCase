import type { Prisma } from '@prisma/client';
import type { InspectionRepository } from '../repositories/inspection.repository.js';
import type { CheckpointRepository } from '../repositories/checkpoint.repository.js';
import type { ScheduleRepository } from '../repositories/schedule.repository.js';
import type { EquipmentRepository } from '../repositories/equipment.repository.js';
import type { IToirAdapter } from '../adapters/toir/toir-adapter.interface.js';
import { Errors } from '../errors.js';
import { eventBus } from '../events/event-bus.js';
import { CheckpointStatus } from '@mobilny-obhodchik/shared';
import type { CheckpointInput } from '@mobilny-obhodchik/shared';

export class InspectionService {
  constructor(
    private readonly inspections: InspectionRepository,
    private readonly checkpoints: CheckpointRepository,
    private readonly schedules: ScheduleRepository,
    private readonly equipment: EquipmentRepository,
    private readonly toir: IToirAdapter,
  ) {}

  async getDailyPlan(workerId: string, date?: string) {
    const day = date ? new Date(date) : new Date();
    if (Number.isNaN(day.getTime())) {
      throw Errors.Validation('Некорректная дата');
    }

    return this.schedules.findDayPlanForWorker(workerId, day);
  }

  async getRouteForWorker(workerId: string, routeId: string, date?: string) {
    const dayPlan = await this.getDailyPlan(workerId, date);
    const assigned = dayPlan.find((schedule) => schedule.route_id === routeId);
    if (!assigned) {
      throw Errors.Forbidden('Маршрут не назначен сотруднику на выбранную дату');
    }
    return assigned.route;
  }

  async identifyEquipment(workerId: string, code: string, date?: string) {
    const equipment = await this.equipment.findByCode(code);
    if (!equipment || !equipment.route_id) {
      throw Errors.NotFound('Оборудование');
    }

    const dayPlan = await this.getDailyPlan(workerId, date);
    const isAssigned = dayPlan.some((schedule) => schedule.route_id === equipment.route_id);
    if (!isAssigned) {
      throw Errors.Forbidden('Оборудование не входит в маршрут сотрудника');
    }

    return equipment;
  }

  async start(workerId: string, scheduleId: string, offlineSyncId?: string) {
    // Idempotency via offline_sync_id - the source of truth for retries.
    if (offlineSyncId) {
      const existing = await this.inspections.findByOfflineSyncId(offlineSyncId);
      if (existing) {
        if (existing.worker_id !== workerId) {
          throw Errors.Forbidden('offline_sync_id принадлежит другому пользователю');
        }
        return this.inspections.findById(existing.id);
      }
    }

    const schedule = await this.schedules.findById(scheduleId);
    if (!schedule) throw Errors.NotFound('Расписание');
    if (schedule.worker_id !== workerId) {
      throw Errors.Forbidden('Это не ваше расписание');
    }

    const routeEquipment = await this.equipment.findByRoute(schedule.route_id);
    if (routeEquipment.length === 0) {
      throw Errors.BadRequest('В маршруте нет оборудования');
    }

    const inspection = await this.inspections.create({
      scheduleId,
      workerId,
      routeId: schedule.route_id,
      totalCheckpoints: routeEquipment.length,
      offlineSyncId,
      checkpointSeeds: routeEquipment.map((e) => ({
        equipmentId: e.id,
        sequenceOrder: e.sequence_order,
      })),
    });

    await this.schedules.updateStatus(scheduleId, 'IN_PROGRESS', { actualStart: new Date() });

    eventBus.publish({
      name: 'inspection.started',
      actorId: workerId,
      payload: { inspectionId: inspection.id, scheduleId, workerId },
    });

    return this.inspections.findById(inspection.id);
  }

  async submitCheckpoint(
    workerId: string,
    inspectionId: string,
    input: CheckpointInput,
  ) {
    const inspection = await this.inspections.findById(inspectionId);
    if (!inspection) throw Errors.NotFound('Обход');
    if (inspection.worker_id !== workerId) throw Errors.Forbidden('Это не ваш обход');
    if (inspection.status === 'COMPLETED') {
      throw Errors.BadRequest('Обход уже завершён, изменения запрещены');
    }

    const checkpoint = await this.checkpoints.findByInspectionAndEquipment(
      inspectionId,
      input.equipmentId,
    );
    if (!checkpoint) {
      throw Errors.NotFound('Точка обхода для указанного оборудования');
    }

    const hasDefect =
      input.status === CheckpointStatus.CRITICAL || input.status === CheckpointStatus.WARNING;

    const updated = await this.checkpoints.update(checkpoint.id, {
      status: input.status,
      measurements: input.measurements as Prisma.InputJsonValue,
      notes: input.notes ?? null,
      photos: (input.photoIds ?? []) as Prisma.InputJsonValue,
      hasDefect,
      inspectedAt: input.inspectedAt ? new Date(input.inspectedAt) : new Date(),
      durationSeconds: input.durationSeconds,
    });

    const completedCount = await this.checkpoints.countCompleted(inspectionId);
    const hasAnyDefect = await this.checkpoints.anyWithDefect(inspectionId);
    await this.inspections.updateProgress(inspectionId, completedCount, hasAnyDefect);

    eventBus.publish({
      name: 'checkpoint.submitted',
      actorId: workerId,
      payload: {
        inspectionId,
        checkpointId: updated.id,
        status: updated.status,
        equipmentId: input.equipmentId,
      },
    });

    // Phase-2 hook: synthetic TOIR sync (no-op today, real 1C tomorrow)
    await this.toir.syncInspectionResult({
      inspectionId,
      workerId,
      equipmentCode: input.equipmentId,
      measurements: input.measurements,
      status: input.status,
      hasDefect,
      inspectedAt: new Date().toISOString(),
    });

    return updated;
  }

  async complete(workerId: string, inspectionId: string, notes?: string, completedAt?: string) {
    const inspection = await this.inspections.findById(inspectionId);
    if (!inspection) throw Errors.NotFound('Обход');
    if (inspection.worker_id !== workerId) throw Errors.Forbidden('Это не ваш обход');

    const when = completedAt ? new Date(completedAt) : new Date();
    await this.inspections.markCompleted(inspectionId, notes, when);
    await this.schedules.updateStatus(inspection.schedule_id, 'COMPLETED', { actualEnd: when });

    eventBus.publish({
      name: 'inspection.completed',
      actorId: workerId,
      payload: { inspectionId, hasDefects: inspection.has_defects },
    });

    return this.inspections.findById(inspectionId);
  }
}

