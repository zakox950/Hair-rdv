import { NextRequest, NextResponse } from 'next/server';
import { coiffeurSchema } from '@/lib/schemas';
import pool from '@/lib/db';

export async function GET() {
  const result = await pool.query(
    'SELECT id, nom, actif, description, points_forts, created_at FROM coiffeur ORDER BY nom'
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = coiffeurSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { nom } = parsed.data;

  // Insert coiffeur
  const coiffeurRes = await pool.query<{ id: string }>(
    'INSERT INTO coiffeur (nom) VALUES ($1) RETURNING id',
    [nom]
  );
  const id = coiffeurRes.rows[0]!.id;

  // Créer horaires par défaut : lun-sam 09:00-18:00, dim fermé
  const horaireValues = [0, 1, 2, 3, 4, 5, 6].map((jour) => ({
    jour,
    ouvert: jour !== 0, // 0 = dimanche
  }));

  for (const { jour, ouvert } of horaireValues) {
    await pool.query(
      `INSERT INTO horaires (coiffeur_id, jour_semaine, heure_ouverture, heure_fermeture, ouvert)
       VALUES ($1, $2, '09:00', '18:00', $3)
       ON CONFLICT (coiffeur_id, jour_semaine) DO NOTHING`,
      [id, jour, ouvert]
    );
  }

  return NextResponse.json({ success: true, id }, { status: 201 });
}
