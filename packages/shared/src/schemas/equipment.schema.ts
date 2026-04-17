import { z } from 'zod';

export const measurementParameterSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  unit: z.string(),
  type: z.enum(['number', 'boolean', 'enum']).default('number'),
  min: z.number().optional(),
  max: z.number().optional(),
  warningMin: z.number().optional(),
  warningMax: z.number().optional(),
  criticalMin: z.number().optional(),
  criticalMax: z.number().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(true),
  hint: z.string().optional(),
});
export type MeasurementParameter = z.infer<typeof measurementParameterSchema>;

export const checklistTemplateSchema = z.object({
  version: z.number().int().default(1),
  parameters: z.array(measurementParameterSchema).min(1),
  photoRequired: z.boolean().default(false),
  safetyNotes: z.array(z.string()).default([]),
  maintenanceHints: z.array(z.string()).default([]),
});
export type ChecklistTemplate = z.infer<typeof checklistTemplateSchema>;

export const coordinatesSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Coordinates = z.infer<typeof coordinatesSchema>;

export const equipmentDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  type: z.string(),
  zone: z.string(),
  locationDescription: z.string(),
  coordinates: coordinatesSchema,
  routeId: z.string().nullable(),
  sequenceOrder: z.number().int(),
  checklistTemplate: checklistTemplateSchema,
  technicalSpecs: z.record(z.unknown()),
  maintenanceDocs: z.array(z.object({ title: z.string(), url: z.string() })).default([]),
  isActive: z.boolean(),
});
export type EquipmentDto = z.infer<typeof equipmentDtoSchema>;
