import { z } from 'zod';

/* ── Public booking ──────────────────────────────────────────── */
export const bookingSchema = z.object({
  nom:         z.string().min(2).max(100),
  email:       z.string().email(),
  telephone:   z.string().min(8).max(20),
  service:     z.string().min(1).max(100),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  heure:       z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:MM'),
  coiffeur_id: z.string().uuid(),
  _trap:       z.string().max(200).optional(),
});

/* ── Admin login ─────────────────────────────────────────────── */
export const adminLoginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(100),
});

/* ── Reservation status (legacy PUT) ────────────────────────── */
export const updateReservationSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']),
  notes:  z.string().max(500).optional(),
});

/* ── Reservation status PATCH (présence + fidélité) ─────────── */
export const patchStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'present', 'no_show']),
  notes:  z.string().max(500).optional(),
});

/* ── Settings ────────────────────────────────────────────────── */
export const updateSettingsSchema = z.object({
  enhanced_security_mode: z.boolean(),
});

export const updateSettingsKeySchema = z.object({
  key:   z.string().min(1).max(100),
  value: z.string().max(500),
});

/* ── Coiffeur ────────────────────────────────────────────────── */
export const coiffeurSchema = z.object({
  nom: z.string().min(2).max(100),
});

/* ── Horaire ─────────────────────────────────────────────────── */
export const horaireSchema = z.object({
  jour_semaine:    z.number().int().min(0).max(6),
  heure_ouverture: z.string().regex(/^\d{2}:\d{2}$/),
  heure_fermeture: z.string().regex(/^\d{2}:\d{2}$/),
  ouvert:          z.boolean(),
});

/* ── Fermeture ───────────────────────────────────────────────── */
export const fermetureSchema = z.object({
  date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  motif: z.string().max(255).optional(),
});

/* ── Trafic ──────────────────────────────────────────────────── */
export const traficSchema = z.object({
  page: z.string().min(1).max(100),
});

/* ── Types ───────────────────────────────────────────────────── */
export type BookingInput           = z.infer<typeof bookingSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
export type PatchStatusInput       = z.infer<typeof patchStatusSchema>;
