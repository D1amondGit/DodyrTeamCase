import { z } from 'zod';
import { CheckpointStatus, InspectionStatus } from '../enums.js';

export const measurementValueSchema = z.union([z.number(), z.boolean(), z.string()]);
export type MeasurementValue = z.infer<typeof measurementValueSchema>;

export const measurementsMapSchema = z.record(measurementValueSchema);

export const startInspectionInputSchema = z.object({
  scheduleId: z.string(),
  offlineSyncId: z.string().uuid().optional(),
});
export type StartInspectionInput = z.infer<typeof startInspectionInputSchema>;

export const checkpointInputSchema = z.object({
  equipmentId: z.string(),
  status: z.enum([
    CheckpointStatus.OK,
    CheckpointStatus.WARNING,
    CheckpointStatus.CRITICAL,
    CheckpointStatus.SKIPPED,
  ]),
  measurements: measurementsMapSchema,
  notes: z.string().max(2000).optional(),
  photoIds: z.array(z.string()).default([]),
  durationSeconds: z.number().int().min(0).optional(),
  offlineSyncId: z.string().uuid().optional(),
  inspectedAt: z.string().datetime().optional(),
});
export type CheckpointInput = z.infer<typeof checkpointInputSchema>;

export const completeInspectionInputSchema = z.object({
  notes: z.string().max(2000).optional(),
  completedAt: z.string().datetime().optional(),
});
export type CompleteInspectionInput = z.infer<typeof completeInspectionInputSchema>;

export const checkpointDtoSchema = z.object({
  id: z.string(),
  inspectionId: z.string(),
  equipmentId: z.string(),
  sequenceOrder: z.number().int(),
  status: z.enum([
    CheckpointStatus.PENDING,
    CheckpointStatus.OK,
    CheckpointStatus.WARNING,
    CheckpointStatus.CRITICAL,
    CheckpointStatus.SKIPPED,
  ]),
  measurements: measurementsMapSchema,
  notes: z.string().nullable(),
  photos: z.array(z.object({ id: z.string(), url: z.string() })),
  hasDefect: z.boolean(),
  inspectedAt: z.string().datetime().nullable(),
  durationSeconds: z.number().int().nullable(),
});
export type CheckpointDto = z.infer<typeof checkpointDtoSchema>;

export const inspectionDtoSchema = z.object({
  id: z.string(),
  scheduleId: z.string(),
  workerId: z.string(),
  routeId: z.string(),
  status: z.enum([
    InspectionStatus.STARTED,
    InspectionStatus.IN_PROGRESS,
    InspectionStatus.COMPLETED,
    InspectionStatus.INTERRUPTED,
  ]),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  totalCheckpoints: z.number().int(),
  completedCheckpoints: z.number().int(),
  hasDefects: z.boolean(),
  notes: z.string().nullable(),
  offlineSyncId: z.string().nullable(),
});
export type InspectionDto = z.infer<typeof inspectionDtoSchema>;
