export const UserRole = {
  WORKER: 'WORKER',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Shift = {
  MORNING: 'MORNING',
  AFTERNOON: 'AFTERNOON',
  NIGHT: 'NIGHT',
} as const;
export type Shift = (typeof Shift)[keyof typeof Shift];

export const ScheduleStatus = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  MISSED: 'MISSED',
} as const;
export type ScheduleStatus = (typeof ScheduleStatus)[keyof typeof ScheduleStatus];

export const InspectionStatus = {
  STARTED: 'STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  INTERRUPTED: 'INTERRUPTED',
} as const;
export type InspectionStatus = (typeof InspectionStatus)[keyof typeof InspectionStatus];

export const CheckpointStatus = {
  PENDING: 'PENDING',
  OK: 'OK',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  SKIPPED: 'SKIPPED',
} as const;
export type CheckpointStatus = (typeof CheckpointStatus)[keyof typeof CheckpointStatus];

export const DefectSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type DefectSeverity = (typeof DefectSeverity)[keyof typeof DefectSeverity];

export const DefectStatus = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
} as const;
export type DefectStatus = (typeof DefectStatus)[keyof typeof DefectStatus];

export const EquipmentType = {
  BOILER: 'BOILER',
  PUMP: 'PUMP',
  COMPRESSOR: 'COMPRESSOR',
  MOTOR: 'MOTOR',
  TRANSFORMER: 'TRANSFORMER',
  SWITCHGEAR: 'SWITCHGEAR',
  DEAERATOR: 'DEAERATOR',
} as const;
export type EquipmentType = (typeof EquipmentType)[keyof typeof EquipmentType];
