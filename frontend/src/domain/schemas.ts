import { z } from 'zod';
import { DRAFT_LOG_STATUSES } from '../types/draft-log';
import { MILESTONE_STATUSES } from '../types/milestone';

/** Validation rules mirroring backend controllers; shared by forms and the mock repositories. */

const requiredText = (label: string) =>
  z.string({ required_error: `El campo "${label}" es obligatorio` }).trim().min(1, `El campo "${label}" es obligatorio`);

export const createDraftLogSchema = z.object({
  client_id: requiredText('cliente'),
  description: requiredText('descripción'),
  duration_minutes: z.number().int().positive('La duración debe ser mayor a 0'),
  tags: z.array(z.string().trim().min(1)).default([]),
  logged_at: z.string().datetime({ offset: true }).optional(),
  status: z.enum(DRAFT_LOG_STATUSES).default('pending'),
  is_client_visible: z.boolean().default(false),
  milestone_id: z.string().nullable().default(null),
});

export const updateDraftLogSchema = createDraftLogSchema.partial();

export const clientSchema = z.object({
  name: requiredText('nombre'),
  hourly_rate: z.number({ invalid_type_error: 'La tarifa debe ser un número' }).min(0, 'La tarifa no puede ser negativa'),
  code: z.string().trim().max(20).nullable().optional(),
  default_channel: z.string().trim().max(80).nullable().optional(),
  billing_cycle: z.string().trim().max(50).nullable().optional(),
});

export const milestoneSchema = z.object({
  client_id: requiredText('cliente'),
  title: requiredText('título').pipe(z.string().max(180)),
  category: z.string().trim().max(80).nullable().optional(),
  estimated_hours: z.number().positive('Las horas estimadas deben ser mayores a 0').nullable().optional(),
  status: z.enum(MILESTONE_STATUSES).optional(),
});

/** First error message of a failed zod parse, for inline form feedback. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Datos inválidos';
}
