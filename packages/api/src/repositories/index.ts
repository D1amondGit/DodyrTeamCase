import { prisma } from '../prisma.js';
import { UserRepository } from './user.repository.js';
import { ScheduleRepository } from './schedule.repository.js';
import { EquipmentRepository } from './equipment.repository.js';
import { RouteRepository } from './route.repository.js';
import { InspectionRepository } from './inspection.repository.js';
import { CheckpointRepository } from './checkpoint.repository.js';
import { DefectRepository } from './defect.repository.js';

export const repositories = {
  users: new UserRepository(prisma),
  schedules: new ScheduleRepository(prisma),
  equipment: new EquipmentRepository(prisma),
  routes: new RouteRepository(prisma),
  inspections: new InspectionRepository(prisma),
  checkpoints: new CheckpointRepository(prisma),
  defects: new DefectRepository(prisma),
};

export type Repositories = typeof repositories;
