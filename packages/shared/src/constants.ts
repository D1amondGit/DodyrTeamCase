export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const WORKSHOP_NAME = 'Энергоцех — Котельный зал';

export const MAX_UPLOAD_MB_DEFAULT = 10;
export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];

export const DEMO_MANAGER = {
  email: 'manager@energoceh.ru',
  password: 'Demo1234!',
} as const;

export const DEMO_WORKER = {
  email: 'ivanov@energoceh.ru',
  password: 'Demo1234!',
} as const;

export const SHIFT_HOURS: Record<'MORNING' | 'AFTERNOON' | 'NIGHT', { start: string; end: string }> = {
  MORNING: { start: '06:00', end: '14:00' },
  AFTERNOON: { start: '14:00', end: '22:00' },
  NIGHT: { start: '22:00', end: '06:00' },
};

export const SHIFT_LABELS_RU: Record<'MORNING' | 'AFTERNOON' | 'NIGHT', string> = {
  MORNING: 'Утренняя смена',
  AFTERNOON: 'Дневная смена',
  NIGHT: 'Ночная смена',
};

export const ROLE_LABELS_RU: Record<'WORKER' | 'MANAGER' | 'ADMIN', string> = {
  WORKER: 'Обходчик',
  MANAGER: 'Мастер',
  ADMIN: 'Администратор',
};

export const SEVERITY_LABELS_RU: Record<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', string> = {
  LOW: 'Низкая',
  MEDIUM: 'Средняя',
  HIGH: 'Высокая',
  CRITICAL: 'Критическая',
};

export const DEFECT_STATUS_LABELS_RU: Record<'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED', string> = {
  OPEN: 'Открыто',
  ASSIGNED: 'Назначено',
  IN_PROGRESS: 'В работе',
  RESOLVED: 'Устранено',
};

export const CHECKPOINT_STATUS_LABELS_RU: Record<'PENDING' | 'OK' | 'WARNING' | 'CRITICAL' | 'SKIPPED', string> = {
  PENDING: 'Ожидание',
  OK: 'Исправно',
  WARNING: 'Замечание',
  CRITICAL: 'Неисправно',
  SKIPPED: 'Пропущено',
};

export const INSPECTION_STATUS_LABELS_RU: Record<'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'INTERRUPTED', string> = {
  STARTED: 'Начат',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершен',
  INTERRUPTED: 'Прерван',
};
