import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { addSafeEmail } from '@/lib/safe-emails';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const res = await pool.query<{
    id: number;
    name: string;
    email: string;
    status: string;
    token_expire_at: Date;
    coiffeur_id: string;
    booking_date: string;
    booking_time: string;
  }>(
    `SELECT r.id, r.name, r.email, r.status, r.token_expire_at,
            r.coiffeur_id, r.booking_date, r.booking_time
     FROM reservations r
     WHERE r.confirmation_token = $1`,
    [token]
  );

  if (res.rows.length === 0) {
    return NextResponse.json({ code: 'error', error: 'Token invalide.' }, { status: 404 });
  }

  const r = res.rows[0]!;

  if (r.status !== 'pending_verification') {
    return NextResponse.json({ code: 'used', error: 'Ce lien a déjà été utilisé.' }, { status: 409 });
  }

  if (new Date() > new Date(r.token_expire_at)) {
    return NextResponse.json({ code: 'expired', error: 'Ce lien a expiré.' }, { status: 410 });
  }

  // Fetch coiffeur name
  const coiffeurRes = await pool.query<{ nom: string }>(
    'SELECT nom FROM coiffeur WHERE id = $1',
    [r.coiffeur_id]
  );
  const coiffeurNom = coiffeurRes.rows[0]?.nom ?? 'Coiffeur';

  // Confirm: pending + decrement slot
  await pool.query(
    `UPDATE reservations
     SET status = 'pending', confirmation_token = NULL, token_expire_at = NULL
     WHERE id = $1`,
    [r.id]
  );

  await pool.query(
    `UPDATE creneau SET places_restantes = places_restantes - 1
     WHERE coiffeur_id = $1 AND jour = $2 AND heure_debut = $3 AND places_restantes > 0`,
    [r.coiffeur_id, r.booking_date, r.booking_time]
  );

  await addSafeEmail(r.email, 'verified');

  return NextResponse.json({
    status: 'confirmed',
    nom:      r.name,
    coiffeur: coiffeurNom,
    date:     r.booking_date,
    heure:    r.booking_time.slice(0, 5),
  });
}
