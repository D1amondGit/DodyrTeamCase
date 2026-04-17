import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заливать демо-данные...');
  const passwordHash = await bcrypt.hash('Demo1234!', 10);

  // 1. Создаем Менеджера
  const manager = await prisma.user.upsert({
    where: { email: 'manager@energoceh.ru' },
    update: {},
    create: {
      name: 'Иван Петрович (Менеджер)',
      email: 'manager@energoceh.ru',
      password_hash: passwordHash,
      role: 'MANAGER',
      employee_id: 'MGR-001',
      department: 'Энергоцех',
    },
  });

  // 2. Создаем Обходчика
  const worker = await prisma.user.upsert({
    where: { email: 'ivanov@energoceh.ru' },
    update: {},
    create: {
      name: 'Иванов Алексей (Обходчик)',
      email: 'ivanov@energoceh.ru',
      password_hash: passwordHash,
      role: 'WORKER',
      employee_id: 'WRK-001',
      department: 'Энергоцех',
    },
  });

  // 3. Создаем Маршрут
  const route = await prisma.route.create({
    data: {
      name: 'Обход Котельного зала (Полный)',
      zone: 'Энергоцех — Котельный зал',
      estimated_duration_minutes: 45,
      waypoints:[],
      map_geojson: { type: 'FeatureCollection', features:[] },
    }
  });

  // 4. Создаем Оборудование на маршруте
  await prisma.equipment.create({
    data: {
      name: 'Котел паровой КЕ-10',
      code: 'EQ-001',
      type: 'BOILER',
      zone: 'Энергоцех — Котельный зал',
      route_id: route.id,
      sequence_order: 1,
      coordinates: { x: 10, y: 20 },
      checklist_template:[
        { id: 'temp', name: 'Температура пара', min: 180, max: 220, unit: '°C' },
        { id: 'press', name: 'Давление', min: 1.0, max: 1.4, unit: 'МПа' }
      ]
    }
  });

  console.log('✅ Демо-данные успешно загружены!');
  console.log(`👨‍💼 Менеджер: manager@energoceh.ru / Demo1234!`);
  console.log(`👷 Обходчик: ivanov@energoceh.ru / Demo1234!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });