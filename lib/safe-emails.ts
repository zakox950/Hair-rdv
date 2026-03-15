import pool from '@/lib/db';

export async function isSafeEmail(email: string): Promise<boolean> {
  const result = await pool.query<{ email: string }>(
    'SELECT email FROM safe_emails WHERE email = $1',
    [email.toLowerCase()]
  );
  return result.rows.length > 0;
}

export async function addSafeEmail(
  email: string,
  reason: 'verified' | 'marked_present'
): Promise<void> {
  await pool.query(
    `INSERT INTO safe_emails (email, reason)
     VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING`,
    [email.toLowerCase(), reason]
  );
}
