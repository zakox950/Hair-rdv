import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const result = await pool.query<{ id: string; nom: string; description: string | null; points_forts: string[] | null }>(
    'SELECT id, nom, description, points_forts FROM coiffeur WHERE actif = TRUE ORDER BY nom'
  );
  return NextResponse.json(result.rows);
}
