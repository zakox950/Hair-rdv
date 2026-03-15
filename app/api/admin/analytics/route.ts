import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const [rdvParJour, statuts, traficParJour, coiffeurs] = await Promise.all([
    // Réservations par jour (30 derniers jours)
    pool.query<{ jour: string; count: string }>(
      `SELECT booking_date::text AS jour, COUNT(*) AS count
       FROM reservations
       WHERE booking_date >= NOW()::date - INTERVAL '30 days'
       GROUP BY booking_date ORDER BY booking_date`
    ),
    // Répartition statuts
    pool.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) AS count FROM reservations GROUP BY status`
    ),
    // Trafic par jour (30 jours)
    pool.query<{ jour: string; count: string }>(
      `SELECT visited_at::date::text AS jour, COUNT(*) AS count
       FROM trafic_log
       WHERE visited_at >= NOW() - INTERVAL '30 days'
       GROUP BY visited_at::date ORDER BY visited_at::date`
    ),
    // Taux remplissage par coiffeur (semaine courante)
    pool.query<{ coiffeur: string; total: string; reserves: string }>(
      `SELECT c.nom AS coiffeur,
              COUNT(cr.id) AS total,
              COUNT(r.id)  AS reserves
       FROM coiffeur c
       LEFT JOIN creneau cr ON cr.coiffeur_id = c.id
         AND cr.jour BETWEEN NOW()::date AND NOW()::date + INTERVAL '7 days'
       LEFT JOIN reservations r ON r.coiffeur_id = c.id
         AND r.booking_date = cr.jour
         AND r.booking_time = cr.heure_debut
         AND r.status NOT IN ('cancelled','no_show')
       WHERE c.actif = TRUE
       GROUP BY c.nom ORDER BY c.nom`
    ),
  ]);

  // Taux de conversion
  const total      = statuts.rows.reduce((s, r) => s + Number(r.count), 0);
  const confirmed  = Number(statuts.rows.find(r => r.status === 'confirmed')?.count  ?? 0);
  const cancelled  = Number(statuts.rows.find(r => r.status === 'cancelled')?.count  ?? 0);
  const noShow     = Number(statuts.rows.find(r => r.status === 'no_show')?.count     ?? 0);
  const present    = Number(statuts.rows.find(r => r.status === 'present')?.count     ?? 0);

  return NextResponse.json({
    reservations_par_jour: rdvParJour.rows,
    repartition_statuts:   statuts.rows,
    trafic_par_jour:       traficParJour.rows,
    taux_remplissage:      coiffeurs.rows,
    kpi: {
      total,
      taux_confirmation: total ? Math.round((confirmed / total) * 100) : 0,
      taux_annulation:   total ? Math.round((cancelled  / total) * 100) : 0,
      taux_no_show:      total ? Math.round((noShow     / total) * 100) : 0,
      taux_presence:     total ? Math.round((present    / total) * 100) : 0,
    },
  });
}
