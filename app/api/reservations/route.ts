import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { bookingSchema } from '@/lib/schemas';
import pool from '@/lib/db';
import { hashIP } from '@/lib/hash';
import { checkRateLimit, detectHoneypot, checkBlacklist, detectSaturation } from '@/lib/security';
import { isSafeEmail } from '@/lib/safe-emails';
import { sendConfirmationEmail, sendRecapEmail } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  // 1. Zod validation
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }
  const { nom, email, telephone, service, date, heure, coiffeur_id, _trap } = parsed.data;

  // 2. Honeypot
  if (detectHoneypot(_trap)) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip') ?? '0.0.0.0';
  const ipHash = await hashIP(ip);

  // 3. Blacklist
  if (await checkBlacklist(email)) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // 4. Coiffeur actif
  const coiffeurRes = await pool.query<{ nom: string }>(
    'SELECT nom FROM coiffeur WHERE id = $1 AND actif = TRUE',
    [coiffeur_id]
  );
  if (coiffeurRes.rows.length === 0) {
    return NextResponse.json({ error: 'Coiffeur indisponible.' }, { status: 422 });
  }
  const coiffeurNom = coiffeurRes.rows[0]!.nom;

  // 5. Créneau disponible (does NOT trigger rate limit if full)
  const settingsCapRes = await pool.query<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'capacite_defaut'"
  );
  const capaciteDefaut = Number(settingsCapRes.rows[0]?.value ?? 1);

  const creneauRes = await pool.query<{ places_restantes: number; bloque: boolean }>(
    `SELECT places_restantes, bloque FROM creneau
     WHERE coiffeur_id = $1 AND jour = $2 AND heure_debut = $3`,
    [coiffeur_id, date, heure]
  );
  // No row = slot never booked = available with default capacity
  const creneauRow = creneauRes.rows[0];
  if (creneauRow?.bloque || (creneauRow && creneauRow.places_restantes <= 0)) {
    return NextResponse.json({ error: 'Ce créneau n\'est plus disponible.' }, { status: 409 });
  }

  // 6. Rate limit (only after confirming créneau is valid)
  if (checkRateLimit(ipHash)) {
    return NextResponse.json({ error: 'Trop de réservations. Réessayez dans 24 h.' }, { status: 429 });
  }

  // 7. Doublon email / coiffeur / 7 jours
  const doublon = await pool.query<{ id: number }>(
    `SELECT id FROM reservations
     WHERE email = $1 AND coiffeur_id = $2
       AND booking_date BETWEEN NOW()::date AND (NOW() + INTERVAL '7 days')::date
       AND status NOT IN ('cancelled','no_show')`,
    [email.toLowerCase(), coiffeur_id]
  );
  if (doublon.rows.length > 0) {
    return NextResponse.json(
      { error: 'Vous avez déjà un rendez-vous cette semaine avec ce coiffeur.' },
      { status: 409 }
    );
  }

  // 8. Saturation (alerte seulement, non bloquant)
  const saturated = await detectSaturation(coiffeur_id, date);
  if (saturated) console.warn(`[saturation] coiffeur=${coiffeur_id} date=${date}`);

  // 9. Mode renforcé
  const settingsRow = await pool.query<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'enhanced_security_mode'"
  );
  const enhancedMode = settingsRow.rows[0]?.value === 'true';

  // 10. Décision statut
  const safe = await isSafeEmail(email);
  let status: string;
  let token: string | null = null;
  let tokenExpireAt: Date | null = null;

  if (safe || !enhancedMode) {
    status = 'confirmed';
  } else {
    token = randomBytes(32).toString('hex');
    tokenExpireAt = new Date(Date.now() + 15 * 60 * 1000);
    status = 'pending_verification';
  }

  // 11. Insert
  const result = await pool.query<{ id: number }>(
    `INSERT INTO reservations
       (name, email, phone, service, booking_date, booking_time,
        ip_hash, status, coiffeur_id, confirmation_token, token_expire_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [nom, email.toLowerCase(), telephone, service, date, heure, ipHash,
     status, coiffeur_id, token, tokenExpireAt]
  );

  if (status === 'confirmed') {
    await pool.query(
      `INSERT INTO creneau (coiffeur_id, jour, heure_debut, capacite_max, places_restantes)
       VALUES ($1, $2, $3, $4, $4 - 1)
       ON CONFLICT (coiffeur_id, jour, heure_debut)
       DO UPDATE SET places_restantes = creneau.places_restantes - 1`,
      [coiffeur_id, date, heure, capaciteDefaut]
    );
    sendRecapEmail(email, { nom, coiffeur: coiffeurNom, date, heure }).catch(console.error);
  } else if (token) {
    sendConfirmationEmail(email, { nom, coiffeur: coiffeurNom, date, heure, token }).catch(console.error);
  }

  // 12. Log trafic
  pool.query('INSERT INTO trafic_log (page, ip_hash) VALUES ($1, $2)', ['/rdv', ipHash]).catch(() => {});

  return NextResponse.json({ success: true, id: result.rows[0]!.id, status }, { status: 201 });
}
