import type { Prisma } from '@prisma/client';
import type { DefectRepository } from '../repositories/defect.repository.js';
import { Errors } from '../errors.js';
import { eventBus } from '../events/event-bus.js';
import { DefectSeverity, DefectStatus } from '@mobilny-obhodchik/shared';
import type { CreateDefectInput, UpdateDefectStatusInput } from '@mobilny-obhodchik/shared';

export class DefectService {
  constructor(private readonly defects: DefectRepository) {}

  async report(reporterId: string, input: CreateDefectInput) {
    if (
      (input.severity === DefectSeverity.HIGH || input.severity === DefectSeverity.CRITICAL) &&
      (!input.description || input.description.trim().length < 10)
    ) {
      throw Errors.Validation('Для высокой и критической неисправности требуется описание');
    }

    const defect = await this.defects.create({
      checkpointId: input.checkpointId ?? null,
      equipmentId: input.equipmentId,
      inspectionId: input.inspectionId ?? null,
      reportedById: reporterId,
      severity: input.severity,
      description: input.description ?? null,
      photos: (input.photoIds ?? []) as unknown as Prisma.InputJsonValue,
    });

    eventBus.publish({
      name: 'defect.reported',
      actorId: reporterId,
      payload: { defectId: defect.id, severity: defect.severity, equipmentId: defect.equipmentId },
    });

    return defect;
  }

  async updateStatus(resolverId: string, defectId: string, input: UpdateDefectStatusInput) {
    const defect = await this.defects.findById(defectId);
    if (!defect) throw Errors.NotFound('Неисправность');

    if (defect.status === DefectStatus.RESOLVED && input.status !== DefectStatus.RESOLVED) {
      throw Errors.BadRequest('Нельзя переоткрыть устранённую неисправность');
    }
    if (input.status === DefectStatus.RESOLVED) {
      if (!input.resolutionNotes || input.resolutionNotes.trim().length < 5) {
        throw Errors.Validation('Для закрытия укажите комментарий о решении');
      }
    }

    const updated = await this.defects.updateStatus(
      defectId,
      input.status,
      resolverId,
      input.resolutionNotes,
    );

    eventBus.publish({
      name: 'defect.status_changed',
      actorId: resolverId,
      payload: { defectId, from: defect.status, to: input.status },
    });

    return updated;
  }
}
