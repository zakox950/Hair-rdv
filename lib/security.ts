import pool from '@/lib/db';
import { hashIP } from '@/lib/hash';

/* ── In-memory rate limiter (production → remplacer par Redis) ── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, maxPerDay = 3): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return false; // not limited
  }
  if (entry.count >= maxPerDay) return true; // limited
  entry.count++;
  return false;
}

/* ── Honeypot ────────────────────────────────────────────────── */
export function detectHoneypot(trap?: string): boolean {
  return typeof trap === 'string' && trap.length > 0;
}

/* ── Blacklist ───────────────────────────────────────────────── */
export async function checkBlacklist(email: string): Promise<boolean> {
  const result = await pool.query<{ email: string }>(
    'SELECT email FROM blacklist WHERE email = $1',
    [email.toLowerCase()]
  );
  return result.rows.length > 0;
}

/* ── Saturation rapide (anti-rush / anti-bot) ────────────────── */
export async function detectSaturation(
  coiffeur_id: string,
  date: string
): Promise<boolean> {
  const [creneauxRes, rushRes] = await Promise.all([
    pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM creneau
       WHERE coiffeur_id = $1 AND jour = $2 AND NOT bloque`,
      [coiffeur_id, date]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM reservations
       WHERE coiffeur_id = $1 AND booking_date = $2
         AND created_at > NOW() - INTERVAL '5 minutes'`,
      [coiffeur_id, date]
    ),
  ]);
  const total = Number(creneauxRes.rows[0]?.count ?? 0);
  const recent = Number(rushRes.rows[0]?.count ?? 0);
  if (total === 0) return false;
  return recent / total >= 0.8;
}

/* ── Hash IP helper (ré-export pratique) ─────────────────────── */
export { hashIP };
