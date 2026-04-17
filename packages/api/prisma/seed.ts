import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SyntheticToirAdapter } from '../src/adapters/toir/toir-synthetic.adapter.js';
import { DEMO_MANAGER, DEMO_WORKER } from '@mobilny-obhodchik/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear tables
  await prisma.inspection.deleteMany();
  await prisma.checkpoint.deleteMany();
  await prisma.defect.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.route.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users
  const managerPass = await bcrypt.hash(DEMO_MANAGER.password, 10);
  const manager = await prisma.user.create({
    data: {
      name: 'Мастер Петров',
      email: DEMO_MANAGER.email,
      password_hash: managerPass,
      role: 'MANAGER',
      employee_id: 'MGR-001',
      department: 'Управление',
    },
  });

  const workerPass = await bcrypt.hash(DEMO_WORKER.password, 10);
  const worker = await prisma.user.create({
    data: {
      name: 'Иванов Сергей',
      email: DEMO_WORKER.email,
      password_hash: workerPass,
      role: 'WORKER',
      employee_id: 'WRK-001',
      department: 'Обслуживание',
    },
  });

  // Seed routes and equipment via TOIR adapter
  const toir = new SyntheticToirAdapter();
  const toirRoutes = await toir.getRoutes();
  const toirEquipment = await toir.getEquipment();

  const routes = await Promise.all(
    toirRoutes.map((r) =>
      prisma.route.create({
        data: {
          name: r.name,
          description: r.description,
          zone: r.zone,
          estimated_duration_minutes: r.estimatedDurationMinutes,
          map_geojson: r.mapGeoJSON,
        },
      }),
    ),
  );

  const createdEquip = await Promise.all(
    toirEquipment.map((e) =>
      prisma.equipment.create({
        data: {
          name: e.name,
          code: e.code,
          type: e.type,
          zone: e.zone,
          location_description: e.locationDescription,
          coordinates: e.coordinates,
          route_id: routes[0].id,
          sequence_order: e.sequenceOrder,
          checklist_template: e.checklistTemplate,
          technical_specs: e.technicalSpecs,
          maintenance_docs: e.maintenanceDocs,
        },
      }),
    ),
  );

  // Create schedule for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.schedule.create({
    data: {
      worker_id: worker.id,
      route_id: routes[0].id,
      scheduled_date: today,
      shift: 'MORNING',
      created_by: manager.id,
    },
  });

  console.log('✅ Database seeded!');
  console.log(`📝 Demo Manager: ${DEMO_MANAGER.email} / ${DEMO_MANAGER.password}`);
  console.log(`📝 Demo Worker: ${DEMO_WORKER.email} / ${DEMO_WORKER.password}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
