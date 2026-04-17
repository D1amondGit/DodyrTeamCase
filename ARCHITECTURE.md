# Architecture & Phase 2/3 Roadmap

## Phase 1 Foundation (Current)

### Core Principles

1. **Adapter Pattern Everywhere**
   - `IToirAdapter`: 1C TOIR data (synthetic now, real HTTP REST Phase 2)
   - `IStorageAdapter`: file storage (local FS now, S3 Phase 2)
   - Benefit: **zero code changes to plug in real integrations**

2. **Event-Driven Internals**
   - `EventBus`: publish domain events
   - Phase 1: logs only
   - Phase 2: handlers for notifications, 1C sync, ML pipeline
   - **No coupling between modules** — all via events

3. **Repository Pattern**
   - All data access → `UserRepository`, `InspectionRepository`, etc.
   - Prisma calls ONLY in repos
   - Services call repos, routes call services
   - **DB swap (TimescaleDB, ClickHouse) requires 0 route/service changes**

4. **RBAC Middleware**
   - `app.requireRole()` guards every sensitive route
   - Enforced at fastify middleware level
   - Worker role: own data only
   - **Permissions stored as enums, not DB**

5. **Offline-First Mobile**
   - WatermelonDB local storage + sync queue
   - Idempotency via `offline_sync_id` UUIDs
   - Mobile generates IDs, server confirms
   - **Partial sync resilience:** lost connection → retry on reconnect

## Phase 2: Real Integrations (Q2 2025)

### 1C:TOIR Integration
```typescript
// TODAY:
class SyntheticToirAdapter implements IToirAdapter { ... }

// PHASE 2:
class HttpToirAdapter implements IToirAdapter {
  async getEquipment() {
    return this.httpClient.get(
      `${this.toirUrl}/api/equipment?token=${this.token}`
    );
  }
  async syncInspectionResult(result) {
    // POST to 1C TOIR, get confirmation ID
  }
}

// app.ts — ONE LINE CHANGE:
- const toir = new SyntheticToirAdapter();
+ const toir = new HttpToirAdapter(config.TOIR_URL, config.TOIR_TOKEN);
```

### Push Notifications
```typescript
// EventBus handler (new file, new class):
eventBus.on('defect.reported', async (event) => {
  await pushNotificationService.notifyManagers({
    title: `Критическая неисправность на ${event.equipment.name}`,
    severity: event.severity,
    equipmentId: event.equipmentId,
  });
});
```

### GPS Tracking
```typescript
// Inspection model adds:
gpsRoute: GeoJSON[],  // worker location breadcrumbs
actualWaypoints: Point[],  // deviated from planned route?

// Mobile app listens to geolocation while inspecting:
Location.startLocationUpdatesAsync(
  inspectionId,
  { accuracy: Accuracy.High }
);
```

### Real-Time Updates
```typescript
// Option 1: WebSocket (Socket.io)
// Option 2: Server-Sent Events (simpler)
// app.ts registers handler:
app.get('/api/v1/inspections/:id/events', (request, reply) => {
  reply.type('text/event-stream');
  eventBus.on('checkpoint.submitted', (event) => {
    if (event.inspectionId === request.params.id) {
      reply.send(`data: ${JSON.stringify(event)}\n\n`);
    }
  });
});
```

## Phase 3: ML & Digital Twin (Q3 2025)

### Predictive Maintenance
```typescript
class PredictiveMLService {
  async predictComponentLifetime(equipmentId: string, days = 30) {
    // Collect measurement trends from checkpoints
    const history = await checkpoints.findByEquipment(equipmentId, { limit: 100 });
    
    // Call ML microservice (Python FastAPI)
    const prediction = await mlClient.post('/predict', {
      equipment_code: equipment.code,
      measurements_history: history,
    });
    
    return prediction.ttl_days; // "replace pump in 45 days"
  }
}

// Trigger via EventBus:
eventBus.on('checkpoint.submitted', async (event) => {
  if (event.status === 'CRITICAL') {
    const ttl = await mlService.predictComponentLifetime(event.equipmentId);
    if (ttl < 7) {
      await pushService.notify(`Заказать запчасти немедленно`);
    }
  }
});
```

### ERP Integration
```typescript
// Phase 2: read-only 1C sync
// Phase 3: bidirectional

class ERP1CAdapter {
  async createMaintenanceTask(defect: Defect) {
    // POST to 1C ТОиР work order:
    return this.soapClient.call('CreateWorkOrder', {
      equipment_code: defect.equipment.code,
      description: defect.description,
      urgency: defect.severity,
      assigned_to: findResponsibleTechnician(defect.equipment.zone),
    });
  }
}

// Hooked to event:
eventBus.on('defect.reported', async (event) => {
  if (event.severity >= 'HIGH') {
    await erp1C.createMaintenanceTask(event.defect);
  }
});
```

## Database Evolution

### Phase 1: PostgreSQL + Prisma
```prisma
model Checkpoint {
  id, inspectionId, equipmentId, status, measurements, notes, photos
}
```

### Phase 2: Add TimescaleDB for metrics
```sql
-- Keep transactional data in PostgreSQL
-- Mirror measurements to TimescaleDB:
CREATE TABLE measurements_timeseries (
  time TIMESTAMPTZ,
  equipment_id UUID,
  measurement_key TEXT,
  value FLOAT
);
CREATE INDEX ON measurements_timeseries (equipment_id, time DESC);

-- Phase 2 EventHandler:
eventBus.on('checkpoint.submitted', async (event) => {
  Object.entries(event.measurements).forEach(([key, value]) => {
    timescaledb.insert('measurements_timeseries', {
      time: new Date(),
      equipment_id: event.equipmentId,
      measurement_key: key,
      value: parseFloat(value),
    });
  });
});
```

### Phase 3: Add ClickHouse for analytics
```sql
-- Fast aggregations:
SELECT equipment_id, toDate(time) as day, COUNT(*) as inspections
FROM measurements_timeseries
WHERE time > now() - INTERVAL 30 DAY
GROUP BY equipment_id, day;
```

## API Versioning Strategy

```
Phase 1: /api/v1/*
├── /auth/login
├── /inspections/:id/checkpoint
└── /analytics/*

Phase 2: /api/v2/*
├── All v1 routes (backward compat)
├── /inspections/:id/location (new GPS)
├── /inspections/:id/events (WebSocket fallback)
├── /equipment/:id/predictions (ML)
└── /workers/:id/assignments (auto-scheduled tasks)

Phase 1 Mobile still works against v1 (old Expo app).
Phase 2 Mobile hits both /v1 and /v2 endpoints.
```

## Storage Backend Swap (Day-1 Ready)

```typescript
// Phase 1: Local
const storage = new LocalStorageAdapter('./uploads');

// Phase 2: S3 (ONE LINE):
const storage = new S3StorageAdapter(
  config.AWS_BUCKET,
  config.AWS_REGION,
  config.AWS_CREDENTIALS
);

// All route handlers use same interface:
const { url, storagePath } = await storage.save({
  data: photoBuffer,
  mimeType: 'image/jpeg',
});
```

## Summary: Zero Rework Philosophy

- **Day 1:** SyntheticToirAdapter, LocalStorageAdapter, EventBus (logging only)
- **Phase 2 starts:** Swap adapters, add event handlers, auth stays same, RBAC unchanged
- **Phase 3 starts:** ClickHouse metrics, ML calls, 1C bidirectional — core API untouched

**All plugin points documented inline** in code. See:
- `src/adapters/*.interface.ts` — next phase stubs
- `src/events/event-bus.ts` — Phase 2 subscribers go here
- `src/app.ts` — swap imports only

---

**This is the strength of Phase 1:** not a prototype, but a **prod-ready foundation** ready for scaling.
