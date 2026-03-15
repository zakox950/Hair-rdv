import { NextRequest, NextResponse } from 'next/server';
import { fermetureSchema } from '@/lib/schemas';
import pool from '@/lib/db';
import { z } from 'zod';

const coiffeurIdSchema = z.string().uuid();

function getCoiffeurId(request: NextRequest) {
  return new URL(request.url).searchParams.get('coiffeur_id');
}

export async function GET(request: NextRequest) {
  const coiffeur_id = getCoiffeurId(request);
  if (!coiffeur_id || !coiffeurIdSchema.safeParse(coiffeur_id).success) {
    return NextResponse.json({ error: 'coiffeur_id invalide' }, { status: 400 });
  }
  const result = await pool.query(
    'SELECT id, date, motif FROM jour_ferme WHERE coiffeur_id = $1 ORDER BY date',
    [coiffeur_id]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const coiffeur_id = getCoiffeurId(request);
  if (!coiffeur_id || !coiffeurIdSchema.safeParse(coiffeur_id).success) {
    return NextResponse.json({ error: 'coiffeur_id invalide' }, { status: 400 });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = fermetureSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  await pool.query(
    `INSERT INTO jour_ferme (coiffeur_id, date, motif) VALUES ($1, $2, $3)
     ON CONFLICT (coiffeur_id, date) DO NOTHING`,
    [coiffeur_id, parsed.data.date, parsed.data.motif ?? null]
  );
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const coiffeur_id = getCoiffeurId(request);
  const date = new URL(request.url).searchParams.get('date');
  if (!coiffeur_id || !date) return NextResponse.json({ error: 'Params manquants' }, { status: 400 });

  await pool.query(
    'DELETE FROM jour_ferme WHERE coiffeur_id = $1 AND date = $2',
    [coiffeur_id, date]
  );
  return NextResponse.json({ success: true });
}
