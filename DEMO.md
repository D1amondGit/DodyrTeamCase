# Hackathon Demo Script (5 min)

## Setup (Done before jury)
```bash
docker compose up
# Wait for "✅ Database seeded!" message
```

## Demo Flow (Slide transitions):

### 1. **Mobile App Login** (20 sec)
**Device:** Show MIG phone or Android emulator  
**Story:** "Иванов, обходчик, готовится к смене"

1. Open Expo app → LoginScreen
2. Enter: ivanov@energoceh.ru / Demo1234!
3. "Ваш маршрут сегодня: Основной маршрут, смена 06:00–14:00, 8 точек"

### 2. **Today's Assignment** (20 sec)
**Screen:** HomeScreen card  
**Story:** "Система получила расписание с бэка"

- ✅ Show: "1 обход на сегодня в 06:00, Основной маршрут"
- Show: "Начать обход" button
- Tap → navigate to route map

### 3. **Route Map & Checklist** (60 sec)
**Screen:** SVG floor plan (8 equipment points)  
**Story:** "Иванов видит план цеха — где каждая точка, в каком порядке"

1. Show map: 8 colored pins (PENDING = gray, OK = green)
2. Tap first pin: "Котёл паровой КЕ-10"
3. ChecklistScreen opens:
   - Equipment name, photo
   - Safety note: "Не приближаться без СИЗ"
   - Measurement form: Temp (°C), Pressure (bar), Water level (%)
   - Form shows traffic lights: green (normal), yellow (warning), red (critical)

4. **Fill data:**
   - Temperature: 180°C → green ✅
   - Pressure: 12 bar → green ✅
   - Water: 65% → green ✅
   - Status: "Исправно" (OK)
   - Tap "Сохранить" → queued locally

5. **Simulate offline:**
   - Developer menu: "Disable network"
   - Tap next equipment → form still works (WatermelonDB local DB)
   - Show sync queue: "2 pending checkpoints, will sync on reconnect"

6. **Re-enable network →** checkpoints auto-sync

### 4. **Defect Report** (40 sec)
**Story:** "Обходчик нашел проблему — система даёт ему инструменты"

1. Next equipment: "Насос питательной воды ПЭН-1"
2. Fill measurements, but:
   - Vibration: 6.5 mm/s → **RED** (above critical threshold)
3. Tap status: "Неисправно" (CRITICAL) → DefectReportScreen
4. Form requires: Severity (Высокая/Критическая), Description (required)
5. Tap photos: camera captures equipment image
6. Submit → **event published: `defect.reported`**

### 5. **Manager Dashboard (Web)** (60 sec)
**Browser:** Open http://localhost:3000 (or web from Docker)  
**Story:** "Мастер видит в реальном времени, что произошло"

1. **Login:** manager@energoceh.ru / Demo1234!
2. **Dashboard Page:**
   - KPI cards (top):
     - "Обходов сегодня: 1"
     - "Активные неисправности: 1"
     - "Рабочих на смене: 1"
     - "Здоровье оборудования: 85%"
3. **Defect Kanban board:**
   - Column "Открыто": card appears (from mobile app)
   - Severity badge: **CRITICAL**
   - Equipment: "ПЭН-1", Description (from photo + notes)
4. **Drag card to "В работе"** → `defect.status_changed` event
5. Show resolve modal, enter notes, submit → moved to "Устранено"

### 6. **Analytics Dashboard** (30 sec)
**Story:** "За 2 недели видны тренды — 95% обходов выполнены, почему неисправности в ПЭН"

1. Click "Analytics" page
2. Show charts (with seed data from 14 days back):
   - Line chart: "Выполнение плана" (30d trend, ~95% completion)
   - Donut chart: "Дефекты по типу" (most in ПЭН, трансформатор)
   - Equipment health heatmap: red cells for ПЭН row
3. Note: "Система покажет, где повторяющиеся проблемы → закупки, план ТО"

### 7. **API Docs** (20 sec)
**Browser:** Open http://localhost:3001/api/docs  
**Story:** "Все API задокументированы автоматически"

- Show Swagger UI
- Demonstrate request/response schema for:
  - POST /api/v1/inspections/start (shows start_inspection_input schema)
  - POST /api/v1/inspections/:id/checkpoint (checkpoint_input schema)
- Highlight: **Zod schemas source of truth**, shared between mobile/web/api

### 8. **Q&A / Future** (closing)

**Q: What makes this production-ready?**
- ✅ Zero-knowledge offline mode (MIG phones in tunnels)
- ✅ RBAC: workers see only their data
- ✅ Idempotent sync: duplicate submissions ignored
- ✅ Type-safe: Zod schemas catch errors at boundaries
- ✅ Docker: one-command deploy

**Q: What's next (Phase 2)?**
- Real 1C:TOIR integration (plug IToirAdapter → HttpToirAdapter)
- GPS tracking (polyline on map)
- Push notifications (defect alerts to managers)
- WebSocket live updates

**Q: Why this architecture?**
- **Adapter pattern:** Phase 2 = swap mock → real services (zero route/service code changes)
- **EventBus:** Phase 2 handlers (notifications, sync, ML) plug in without breaking v1
- **Repository pattern:** DB swap (TimescaleDB for metrics, Phase 3) transparent to business logic

---

## Talking Points

- **"This is NOT a prototype."** Every line follows SOLID, TypeScript strict, Prisma migrations, test fixtures. Day 1 production-ready.
- **"Offline works."** Submit 100 checkpoints in a tunnel, reconnect, all sync atomically.
- **"Scales to Phase 2 with adapters."** 1C REST client swaps in 1 import change.
- **"Team shipping this week."** API docs auto-generated, mobile Expo buildable to Android APK today, Docker deploys to any server.

---

## Timing Notes

- **Total: ~5 minutes**
- Critical path: Mobile login → checklist → defect → manager dashboard
- Have a backup: direct curl to API /api/v1/analytics/overview (prove data flows end-to-end)
- Keep slides minimal — focus on **working software**
