/**
 * Creates or updates an admin user.
 * Usage:
 *   npm run admin:create                       # username=admin, prompts for password
 *   npm run admin:create -- <username> <pass>  # non-interactive
 */

import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env.local (tsx ne le charge pas automatiquement)
try {
  const lines = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
} catch { /* .env.local absent, on continue avec les valeurs par défaut */ }

const pool = new Pool({
  host:     process.env.PGHOST     ?? 'localhost',
  port:     Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? 'hairrdv',
  user:     process.env.PGUSER     ?? 'postgres',
  password: process.env.PGPASSWORD ?? 'postgres',
});

async function main() {
  let username = process.argv[2];
  let password = process.argv[3];

  if (!username) {
    const rl = readline.createInterface({ input, output });
    username = (await rl.question('Nom d\'utilisateur [admin]: ')).trim() || 'admin';
    password = await rl.question('Mot de passe: ');
    rl.close();
  }

  if (!password || password.length < 6) {
    console.error('Le mot de passe doit comporter au moins 6 caractères.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO admin_users (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [username, hash]
  );

  console.log(`Utilisateur "${username}" créé / mis à jour avec succès.`);
  await pool.end();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
