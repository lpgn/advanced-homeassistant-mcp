import { z } from "zod";


export const DomainSchema = z.enum(["light", "climate", "alarm_control_panel", "cover", "switch"]);

// Generic list request schema

export const ListRequestSchema = z.object({
    domain: DomainSchema,
    area: z.string().optional(),
    floor: z.string().optional(),
});

// Areas

export const AreaSchema = z.object({
    id: z.string(),
    name: z.string(),
    floor: z.string(),
});

export const FloorSchema = z.object({
    id: z.string(),
    name: z.string(),
});

export const ListFloorsResponseSchema = z.object({
    floors: z.array(FloorSchema),
});

// Alarm

export const AlarmAttributesSchema = z.object({
    code_format: z.string().optional(),
    changed_by: z.string().optional(),
    code_arm_required: z.boolean().optional(),
    friendly_name: z.string().optional(),
    supported_features: z.number().optional(),
});

export const AlarmSchema = z.object({
    entity_id: z.string(),
    state: z.string(),
    state_attributes: AlarmAttributesSchema,
});


export const ListAlarmsResponseSchema = z.object({
    alarms: z.array(AlarmSchema),
});


// Devices

export const DeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_by_user: z.string().optional(),
  model: z.string(),
  model_id: z.string().nullable(),
  manufacturer: z.string(),
  area_id: z.string().nullable(),
  config_entries: z.array(z.string()),
  primary_config_entry: z.string(),
  connections: z.array(z.tuple([z.string(), z.string()])),
  configuration_url: z.string().nullable(),
  disabled_by: z.string().nullable(),
  entry_type: z.string().nullable(),
  hw_version: z.string().nullable(),
  sw_version: z.string().nullable(),
  via_device_id: z.string().nullable(),
  created_at: z.number(),
  modified_at: z.number(),
  identifiers: z.array(z.any()),
  labels: z.array(z.string()),
  serial_number: z.string().optional()
});

export const ListDevicesResponseSchema = z.object({
  _meta: z.object({}).optional(),
  devices: z.array(DeviceSchema)
});