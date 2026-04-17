import { z } from 'zod';
import { DefectSeverity, DefectStatus } from '../enums.js';

export const createDefectInputSchema = z
  .object({
    checkpointId: z.string().optional(),
    equipmentId: z.string(),
    inspectionId: z.string().optional(),
    severity: z.enum([
      DefectSeverity.LOW,
      DefectSeverity.MEDIUM,
      DefectSeverity.HIGH,
      DefectSeverity.CRITICAL,
    ]),
    description: z.string().max(4000).optional(),
    photoIds: z.array(z.string()).default([]),
  })
  .refine(
    (d) => {
      if (d.severity === DefectSeverity.HIGH || d.severity === DefectSeverity.CRITICAL) {
        return typeof d.description === 'string' && d.description.trim().length >= 10;
      }
      return true;
    },
    {
      message: 'Для высокой и критической неисправности требуется описание (минимум 10 символов)',
      path: ['description'],
    },
  );
export type CreateDefectInput = z.infer<typeof createDefectInputSchema>;

export const updateDefectStatusInputSchema = z
  .object({
    status: z.enum([
      DefectStatus.OPEN,
      DefectStatus.ASSIGNED,
      DefectStatus.IN_PROGRESS,
      DefectStatus.RESOLVED,
    ]),
    resolutionNotes: z.string().max(4000).optional(),
  })
  .refine(
    (d) =>
      d.status !== DefectStatus.RESOLVED ||
      (typeof d.resolutionNotes === 'string' && d.resolutionNotes.trim().length >= 5),
    {
      message: 'Для закрытия неисправности укажите комментарий о решении',
      path: ['resolutionNotes'],
    },
  );
export type UpdateDefectStatusInput = z.infer<typeof updateDefectStatusInputSchema>;

export const defectDtoSchema = z.object({
  id: z.string(),
  checkpointId: z.string().nullable(),
  equipmentId: z.string(),
  inspectionId: z.string().nullable(),
  reportedById: z.string(),
  severity: z.enum([
    DefectSeverity.LOW,
    DefectSeverity.MEDIUM,
    DefectSeverity.HIGH,
    DefectSeverity.CRITICAL,
  ]),
  description: z.string().nullable(),
  photos: z.array(z.object({ id: z.string(), url: z.string() })),
  status: z.enum([
    DefectStatus.OPEN,
    DefectStatus.ASSIGNED,
    DefectStatus.IN_PROGRESS,
    DefectStatus.RESOLVED,
  ]),
  resolutionNotes: z.string().nullable(),
  resolvedById: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
});
export type DefectDto = z.infer<typeof defectDtoSchema>;
