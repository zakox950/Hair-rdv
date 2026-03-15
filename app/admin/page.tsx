import Link from 'next/link';
import pool from '@/lib/db';
import AdminLayout from '@/components/admin/AdminLayout';

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const dateFr = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

interface Coiffeur {
  id: string;
  nom: string;
}

interface Horaire {
  coiffeur_id: string;
  jour_semaine: number;
  heure_ouverture: string;
  heure_fermeture: string;
  ouvert: boolean;
}

interface JourFerme {
  date: string;
  coiffeur_nom: string;
  motif: string | null;
}

export default async function AdminPage() {
  // ── Bloc 1 — Horaires en vigueur ──────────────────────────────────────────
  let horairesBlock: React.ReactNode;
  try {
    const { rows: coiffeurs } = await pool.query<Coiffeur>(
      `SELECT id, nom FROM coiffeur WHERE actif = TRUE ORDER BY nom`
    );

    const { rows: horaires } = await pool.query<Horaire>(
      `SELECT coiffeur_id, jour_semaine, heure_ouverture::text, heure_fermeture::text, ouvert
       FROM horaires
       WHERE coiffeur_id = ANY($1)
       ORDER BY jour_semaine`,
      [coiffeurs.map((c) => c.id)]
    );

    const horairesByCoiffeur = new Map<string, Horaire[]>();
    for (const h of horaires) {
      const list = horairesByCoiffeur.get(h.coiffeur_id) ?? [];
      list.push(h);
      horairesByCoiffeur.set(h.coiffeur_id, list);
    }

    horairesBlock = coiffeurs.length === 0 ? (
      <p className="text-white/40 text-center py-4">Aucun coiffeur actif</p>
    ) : (
      <div className="space-y-6">
        {coiffeurs.map((c) => {
          const hs = horairesByCoiffeur.get(c.id) ?? [];
          const byDay = new Map(hs.map((h) => [h.jour_semaine, h]));
          return (
            <div key={c.id}>
              <h3 className="text-sm font-semibold text-white/80 mb-2">{c.nom}</h3>
              <div className="grid grid-cols-7 gap-2">
                {JOURS.map((jour, i) => {
                  const h = byDay.get(i);
                  const ouvert = h?.ouvert ?? false;
                  return (
                    <div
                      key={i}
                      className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2 text-center"
                    >
                      <span className="block text-[11px] text-white/40 mb-1">{jour.slice(0, 3)}</span>
                      {ouvert && h ? (
                        <span className="text-xs text-white/70">
                          {h.heure_ouverture.slice(0, 5)} – {h.heure_fermeture.slice(0, 5)}
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] bg-white/[0.06] text-white/30 rounded px-1.5 py-0.5">
                          Fermé
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  } catch {
    horairesBlock = (
      <p className="text-white/40 text-center py-4">Données indisponibles</p>
    );
  }

  // ── Bloc 2 — Congés à venir ───────────────────────────────────────────────
  let congesBlock: React.ReactNode;
  try {
    const { rows: conges } = await pool.query<JourFerme>(
      `SELECT jf.date::text, c.nom AS coiffeur_nom, jf.motif
       FROM jour_ferme jf
       JOIN coiffeur c ON c.id = jf.coiffeur_id
       WHERE c.actif = TRUE AND jf.date >= CURRENT_DATE
       ORDER BY jf.date ASC
       LIMIT 10`
    );

    congesBlock = conges.length === 0 ? (
      <p className="text-white/40 text-center py-4">Aucune fermeture planifiée</p>
    ) : (
      <ul className="divide-y divide-white/[0.06]">
        {conges.map((entry, i) => (
          <li key={`${entry.date}-${entry.coiffeur_nom}`} className="flex items-center gap-3 py-2.5">
            <span
              className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded ${
                i === 0
                  ? 'bg-amber-400/20 text-amber-300'
                  : 'bg-white/[0.06] text-white/50'
              }`}
            >
              {dateFr.format(new Date(entry.date))}
            </span>
            <span className="text-sm text-white/70">{entry.coiffeur_nom}</span>
            <span className="text-xs text-white/40 ml-auto">
              {entry.motif || 'Fermeture exceptionnelle'}
            </span>
          </li>
        ))}
      </ul>
    );
  } catch {
    congesBlock = (
      <p className="text-white/40 text-center py-4">Données indisponibles</p>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-8">Tableau de bord</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Horaires en vigueur */}
        <section className="glass-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Horaires en vigueur</h2>
            <Link href="/admin/horaires" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
              Modifier les horaires &rarr;
            </Link>
          </div>
          {horairesBlock}
        </section>

        {/* Congés à venir */}
        <section className="glass-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Congés à venir</h2>
            <Link href="/admin/fermetures" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
              Gérer les fermetures &rarr;
            </Link>
          </div>
          {congesBlock}
        </section>
      </div>
    </AdminLayout>
  );
}
