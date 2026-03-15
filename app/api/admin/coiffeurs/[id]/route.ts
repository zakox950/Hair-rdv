import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { nom, description, points_forts } = body as { nom?: string; description?: string; points_forts?: string[] };

  // Build dynamic SET clause
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (nom !== undefined) { sets.push(`nom = $${idx++}`); values.push(nom); }
  if (description !== undefined) { sets.push(`description = $${idx++}`); values.push(description); }
  if (points_forts !== undefined) { sets.push(`points_forts = $${idx++}`); values.push(points_forts); }

  if (sets.length === 0) return NextResponse.json({ error: 'Rien à modifier' }, { status: 400 });

  values.push(id);
  await pool.query(`UPDATE coiffeur SET ${sets.join(', ')} WHERE id = $${idx}`, values);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Vérifier RDV futurs non annulés
  const rdvFuturs = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM reservations
     WHERE coiffeur_id = $1
       AND booking_date >= NOW()::date
       AND status NOT IN ('cancelled','no_show')`,
    [id]
  );

  if (Number(rdvFuturs.rows[0]?.count ?? 0) > 0) {
    // Désactivation douce
    await pool.query('UPDATE coiffeur SET actif = FALSE WHERE id = $1', [id]);
    return NextResponse.json({ action: 'deactivated' });
  }

  // Suppression physique
  await pool.query('DELETE FROM coiffeur WHERE id = $1', [id]);
  return NextResponse.json({ action: 'deleted' });
}
