import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { adminLoginSchema } from '@/lib/schemas';
import pool from '@/lib/db';
import { signJWT } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { username, password } = parsed.data;

  const result = await pool.query<{ id: number; password_hash: string }>(
    'SELECT id, password_hash FROM admin_users WHERE username = $1',
    [username]
  );

  const user = result.rows[0];

  // Always compare to prevent timing attacks even when user not found
  const validPassword =
    user != null && (await bcrypt.compare(password, user.password_hash));

  if (!user || !validPassword) {
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
  }

  const token = await signJWT({ sub: String(user.id), username });

  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  return response;
}
