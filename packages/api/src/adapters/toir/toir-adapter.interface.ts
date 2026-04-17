/**
 * Abstract 1C:TOIR adapter. Phase 1 uses a synthetic implementation;
 * Phase 2 will swap in a real HTTP/SOAP client — no core changes.
 */

export interface ToirRouteDto {
  externalId: string;
  name: string;
  description: string;
  zone: string;
  estimatedDurationMinutes: number;
  mapGeoJSON: unknown;
}

export interface ToirEquipmentDto {
  externalId: string;
  name: string;
  code: string;
  type: string;
  zone: string;
  locationDescription: string;
  coordinates: { x: number; y: number };
  routeExternalId: string | null;
  sequenceOrder: number;
  checklistTemplate: unknown;
  technicalSpecs: Record<string, unknown>;
  maintenanceDocs: Array<{ title: string; url: string }>;
}

export interface ToirInspectionResultDto {
  inspectionId: string;
  workerId: string;
  equipmentCode: string;
  measurements: Record<string, unknown>;
  status: string;
  hasDefect: boolean;
  inspectedAt: string;
}

export interface IToirAdapter {
  getRoutes(): Promise<ToirRouteDto[]>;
  getEquipment(): Promise<ToirEquipmentDto[]>;
  syncInspectionResult(result: ToirInspectionResultDto): Promise<{ accepted: boolean; externalId?: string }>;
}
