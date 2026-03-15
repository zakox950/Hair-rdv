/**
 * RGPD cleanup script
 * - Deletes reservations older than 90 days
 * - Deletes trafic_log entries older than 30 days
 *
 * Usage: npm run cleanup
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env.local manually (tsx doesn't auto-load it)
try {
  const envPath = resolve(process.cwd(), '.env.local');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
} catch {
  // .env.local absent — rely on real env vars
}

import pg from 'pg';

const pool = new pg.Pool({
  host:     process.env.PGHOST     ?? 'localhost',
  port:     Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? 'hairrdv',
  user:     process.env.PGUSER     ?? 'postgres',
  password: process.env.PGPASSWORD ?? 'postgres',
});

async function cleanup(): Promise<void> {
  const client = await pool.connect();
  try {
    // Delete reservations older than 90 days
    const resResult = await client.query(
      `DELETE FROM reservations
       WHERE booking_date < NOW()::date - INTERVAL '90 days'`
    );
    console.log(`[cleanup] Reservations supprimées : ${resResult.rowCount ?? 0}`);

    // Delete trafic_log older than 30 days
    const traficResult = await client.query(
      `DELETE FROM trafic_log
       WHERE visited_at < NOW() - INTERVAL '30 days'`
    );
    console.log(`[cleanup] Trafic logs supprimés : ${traficResult.rowCount ?? 0}`);

    console.log('[cleanup] Terminé avec succès.');
  } finally {
    client.release();
    await pool.end();
  }
}

cleanup().catch(err => {
  console.error('[cleanup] Erreur :', err);
  process.exit(1);
});
