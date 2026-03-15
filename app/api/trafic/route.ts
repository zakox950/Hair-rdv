import { NextRequest, NextResponse } from 'next/server';
import { traficSchema } from '@/lib/schemas';
import { hashIP } from '@/lib/hash';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({}, { status: 400 }); }

  const parsed = traficSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({}, { status: 400 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip') ?? '0.0.0.0';
  const ipHash = await hashIP(ip);

  await pool.query(
    'INSERT INTO trafic_log (page, ip_hash) VALUES ($1, $2)',
    [parsed.data.page, ipHash]
  ).catch(() => {});

  return NextResponse.json({ success: true });
}
