import { NextRequest, NextResponse } from 'next/server';
import { updateSettingsSchema } from '@/lib/schemas';
import pool from '@/lib/db';

export async function GET() {
  const result = await pool.query('SELECT key, value FROM settings');
  const settings: Record<string, string> = {};
  for (const row of result.rows as { key: string; value: string }[]) {
    settings[row.key] = row.value;
  }
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  await pool.query(
    `UPDATE settings
     SET value = $1, updated_at = NOW()
     WHERE key = 'enhanced_security_mode'`,
    [String(parsed.data.enhanced_security_mode)]
  );

  return NextResponse.json({ success: true });
}
