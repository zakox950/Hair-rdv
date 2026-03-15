import { NextRequest, NextResponse } from 'next/server';
import { horaireSchema } from '@/lib/schemas';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const coiffeur_id = new URL(request.url).searchParams.get('coiffeur_id');
  if (!coiffeur_id) return NextResponse.json({ error: 'coiffeur_id requis' }, { status: 400 });

  let result = await pool.query(
    `SELECT id, jour_semaine, heure_ouverture, heure_fermeture, ouvert
     FROM horaires WHERE coiffeur_id = $1 ORDER BY jour_semaine`,
    [coiffeur_id]
  );

  // Auto-seed 7 default horaires if none exist for this coiffeur
  if (result.rows.length === 0) {
    const defaults = Array.from({ length: 7 }, (_, jour) => ({
      jour_semaine: jour,
      heure_ouverture: '09:00',
      heure_fermeture: '18:00',
      ouvert: jour !== 0, // Sunday (0) closed, Mon-Sat open
    }));

    for (const d of defaults) {
      await pool.query(
        `INSERT INTO horaires (coiffeur_id, jour_semaine, heure_ouverture, heure_fermeture, ouvert)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (coiffeur_id, jour_semaine) DO NOTHING`,
        [coiffeur_id, d.jour_semaine, d.heure_ouverture, d.heure_fermeture, d.ouvert]
      );
    }

    result = await pool.query(
      `SELECT id, jour_semaine, heure_ouverture, heure_fermeture, ouvert
       FROM horaires WHERE coiffeur_id = $1 ORDER BY jour_semaine`,
      [coiffeur_id]
    );
  }

  return NextResponse.json(result.rows);
}

export async function PUT(request: NextRequest) {
  const coiffeur_id = new URL(request.url).searchParams.get('coiffeur_id');
  if (!coiffeur_id) return NextResponse.json({ error: 'coiffeur_id requis' }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  // body peut être un seul horaire ou un tableau
  const items = Array.isArray(body) ? body : [body];

  for (const item of items) {
    const parsed = horaireSchema.safeParse(item);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { jour_semaine, heure_ouverture, heure_fermeture, ouvert } = parsed.data;
    await pool.query(
      `INSERT INTO horaires (coiffeur_id, jour_semaine, heure_ouverture, heure_fermeture, ouvert)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (coiffeur_id, jour_semaine) DO UPDATE
         SET heure_ouverture = EXCLUDED.heure_ouverture,
             heure_fermeture = EXCLUDED.heure_fermeture,
             ouvert          = EXCLUDED.ouvert`,
      [coiffeur_id, jour_semaine, heure_ouverture, heure_fermeture, ouvert]
    );
  }

  return NextResponse.json({ success: true });
}
