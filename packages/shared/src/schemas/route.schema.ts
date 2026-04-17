import { z } from 'zod';

export const waypointSchema = z.object({
  equipmentId: z.string(),
  sequenceOrder: z.number().int(),
  coordinates: z.object({ x: z.number(), y: z.number() }),
});
export type Waypoint = z.infer<typeof waypointSchema>;

export const mapGeoJSONSchema = z.object({
  type: z.literal('FeatureCollection'),
  viewBox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  walls: z.array(
    z.object({
      id: z.string(),
      points: z.array(z.tuple([z.number(), z.number()])),
    }),
  ),
  zones: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      rect: z.tuple([z.number(), z.number(), z.number(), z.number()]),
      color: z.string(),
    }),
  ),
});
export type MapGeoJSON = z.infer<typeof mapGeoJSONSchema>;

export const routeDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  zone: z.string(),
  estimatedDurationMinutes: z.number().int(),
  waypoints: z.array(waypointSchema),
  mapGeoJSON: mapGeoJSONSchema,
  isActive: z.boolean(),
});
export type RouteDto = z.infer<typeof routeDtoSchema>;
