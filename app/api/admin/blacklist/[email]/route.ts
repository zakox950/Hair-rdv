import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const { email } = await params;
  await pool.query('DELETE FROM blacklist WHERE email = $1', [decodeURIComponent(email)]);
  return NextResponse.json({ success: true });
}
