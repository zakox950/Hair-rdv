import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateReservationSchema } from '@/lib/schemas';
import pool from '@/lib/db';

const idSchema = z.coerce.number().int().positive();

export async function GET() {
  const result = await pool.query(
    `SELECT r.id, r.name, r.email, r.phone, r.service,
            r.booking_date, r.booking_time, r.status, r.notes, r.created_at,
            c.nom  AS coiffeur_nom,
            l.tier AS loyalty_tier
     FROM reservations r
     LEFT JOIN coiffeur c ON c.id = r.coiffeur_id
     LEFT JOIN loyalty  l ON l.email = r.email
     ORDER BY r.booking_date DESC, r.booking_time DESC`
  );
  return NextResponse.json(result.rows);
}

export async function PUT(request: NextRequest) {
  const idParam = new URL(request.url).searchParams.get('id');
  const idParsed = idSchema.safeParse(idParam);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const bodyParsed = updateReservationSchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: bodyParsed.error.issues },
      { status: 400 }
    );
  }

  const { status, notes } = bodyParsed.data;

  const result = await pool.query(
    `UPDATE reservations
     SET status = $1, notes = $2
     WHERE id = $3
     RETURNING id`,
    [status, notes ?? null, idParsed.data]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
