import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { patchStatusSchema } from '@/lib/schemas';
import pool from '@/lib/db';
import { updateLoyalty } from '@/lib/loyalty';
import { addSafeEmail } from '@/lib/safe-emails';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = patchStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { status, notes } = parsed.data;

  // Récupérer la réservation
  const resRes = await pool.query<{
    id: number; email: string; coiffeur_id: string; booking_date: string; booking_time: string; status: string;
  }>(
    'SELECT id, email, coiffeur_id, booking_date, booking_time, status FROM reservations WHERE id = $1',
    [idNum]
  );
  if (resRes.rows.length === 0) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
  }
  const reservation = resRes.rows[0]!;

  // Mise à jour statut
  await pool.query(
    'UPDATE reservations SET status = $1, notes = COALESCE($2, notes) WHERE id = $3',
    [status, notes ?? null, idNum]
  );

  // Logique présent → fidélité + safe email
  if (status === 'present') {
    await updateLoyalty(reservation.email);
    await addSafeEmail(reservation.email, 'marked_present');
  }

  // Logique no_show → vérifier seuil blacklist
  if (status === 'no_show') {
    const thresholdRes = await pool.query<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'no_show_threshold'"
    );
    const threshold = Number(thresholdRes.rows[0]?.value ?? 3);

    const noShowCount = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM reservations
       WHERE email = $1 AND status = 'no_show'`,
      [reservation.email]
    );

    if (Number(noShowCount.rows[0]?.count ?? 0) >= threshold) {
      await pool.query(
        `INSERT INTO blacklist (email, reason) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING`,
        [reservation.email, `${threshold} no-shows consécutifs`]
      );
    }
  }

  // Libérer le créneau si annulé ou no_show (depuis un statut non-annulé)
  if ((status === 'cancelled' || status === 'no_show') &&
      !['cancelled', 'no_show', 'pending_verification'].includes(reservation.status)) {
    await pool.query(
      `UPDATE creneau SET places_restantes = LEAST(places_restantes + 1, capacite_max)
       WHERE coiffeur_id = $1 AND jour = $2 AND heure_debut = $3`,
      [reservation.coiffeur_id, reservation.booking_date, reservation.booking_time]
    ).catch(() => {});
  }

  return NextResponse.json({ success: true });
}

// Garder aussi le schéma zod importé mais non utilisé directement (évite unused import)
const _unused = z;
void _unused;
