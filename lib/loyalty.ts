import pool from '@/lib/db';

type Tier = 'none' | 'silver' | 'gold' | 'platinum';

function computeTier(visits: number): Tier {
  if (visits >= 10) return 'platinum';
  if (visits >= 6)  return 'gold';
  if (visits >= 3)  return 'silver';
  return 'none';
}

export async function updateLoyalty(email: string): Promise<{ visit_count: number; tier: Tier }> {
  const result = await pool.query<{ visit_count: number; tier: Tier }>(
    `INSERT INTO loyalty (email, visit_count, tier, updated_at)
     VALUES ($1, 1, $2, NOW())
     ON CONFLICT (email) DO UPDATE
       SET visit_count = loyalty.visit_count + 1,
           tier        = $3,
           updated_at  = NOW()
     RETURNING visit_count, tier`,
    [
      email.toLowerCase(),
      computeTier(1),
      computeTier(
        ((await pool.query<{ visit_count: number }>(
          'SELECT visit_count FROM loyalty WHERE email = $1',
          [email.toLowerCase()]
        )).rows[0]?.visit_count ?? 0) + 1
      ),
    ]
  );
  return result.rows[0] ?? { visit_count: 1, tier: 'none' };
}

export async function getLoyalty(
  email: string
): Promise<{ visit_count: number; tier: Tier } | null> {
  const result = await pool.query<{ visit_count: number; tier: Tier }>(
    'SELECT visit_count, tier FROM loyalty WHERE email = $1',
    [email.toLowerCase()]
  );
  return result.rows[0] ?? null;
}
