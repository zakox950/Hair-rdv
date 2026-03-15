import Link from 'next/link';
import pool from '@/lib/db';

interface Coiffeur {
  id: string;
  nom: string;
  description: string | null;
  points_forts: string[] | null;
}

export default async function CoiffeursSection() {
  const result = await pool.query<Coiffeur>(
    'SELECT id, nom, description, points_forts FROM coiffeur WHERE actif = TRUE ORDER BY nom'
  );
  const coiffeurs = result.rows;

  if (coiffeurs.length === 0) return null;

  // Build initials from name
  function initials(nom: string) {
    return nom
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  const single = coiffeurs.length === 1;

  return (
    <section id="about" className="px-6 py-28">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <p className="text-xs text-amber-400/60 uppercase tracking-[0.35em]">Notre équipe</p>
          <h2 className="text-4xl font-thin text-white">
            {single ? 'Votre styliste' : 'Nos coiffeurs'}
          </h2>
        </div>

        <div
          className={
            single
              ? 'flex justify-center'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
          }
        >
          {coiffeurs.map((c) => (
            <div
              key={c.id}
              className={`glass p-8 sm:p-10 space-y-6 ${single ? 'max-w-lg w-full' : ''}`}
            >
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-32 h-32 rounded-full overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/25 via-transparent to-amber-500/20 rounded-full" />
                  <div className="absolute inset-0 border border-white/10 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-extralight text-white/35 tracking-widest select-none">
                      {initials(c.nom)}
                    </span>
                  </div>
                </div>
                <h3 className="text-2xl font-thin text-white">{c.nom}</h3>
              </div>

              {/* Description */}
              {c.description && (
                <p className="text-white/50 text-sm leading-relaxed text-center">
                  {c.description}
                </p>
              )}

              {/* Points forts */}
              {c.points_forts && c.points_forts.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {c.points_forts.map((tag) => (
                    <span key={tag} className="badge-glass">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-center">
                <Link href="/rdv" className="inline-block btn-glass text-sm">
                  Réserver avec {c.nom.split(' ')[0]} &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
