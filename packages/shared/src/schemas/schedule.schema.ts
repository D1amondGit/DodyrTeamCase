import { z } from 'zod';
import { Shift, ScheduleStatus } from '../enums.js';

export const createScheduleInputSchema = z.object({
  workerId: z.string(),
  routeId: z.string(),
  scheduledDate: z.string().datetime(),
  shift: z.enum([Shift.MORNING, Shift.AFTERNOON, Shift.NIGHT]),
});
export type CreateScheduleInput = z.infer<typeof createScheduleInputSchema>;

export const scheduleDtoSchema = z.object({
  id: z.string(),
  workerId: z.string(),
  routeId: z.string(),
  scheduledDate: z.string().datetime(),
  shift: z.enum([Shift.MORNING, Shift.AFTERNOON, Shift.NIGHT]),
  status: z.enum([
    ScheduleStatus.PLANNED,
    ScheduleStatus.IN_PROGRESS,
    ScheduleStatus.COMPLETED,
    ScheduleStatus.MISSED,
  ]),
  actualStart: z.string().datetime().nullable(),
  actualEnd: z.string().datetime().nullable(),
  createdById: z.string(),
});
export type ScheduleDto = z.infer<typeof scheduleDtoSchema>;
