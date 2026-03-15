'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Coiffeur { id: string; nom: string; }
interface Creneau  { heure: string; places_restantes: number; disponible: boolean; }

const JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getWeekDates(offset = 0): string[] {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0]!;
  });
}

function slotColor(c: Creneau): string {
  if (!c.disponible) return 'bg-red-500/20 border-red-500/30 text-red-300';
  if (c.places_restantes === 1) return 'bg-amber-500/20 border-amber-500/30 text-amber-300';
  return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
}

export default function PlanningPage() {
  const [coiffeurs, setCoiffeurs]   = useState<Coiffeur[]>([]);
  const [selected, setSelected]     = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData]             = useState<Record<string, Creneau[]>>({});
  const [loading, setLoading]       = useState(false);
  const dates = getWeekDates(weekOffset);

  useEffect(() => {
    fetch('/api/admin/coiffeurs')
      .then(r => r.json())
      .then((d: Coiffeur[]) => { setCoiffeurs(d); if (d[0]) setSelected(d[0].id); })
      .catch(console.error);
  }, []);

  const fetchPlanning = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    const results: Record<string, Creneau[]> = {};
    await Promise.all(dates.map(async (date) => {
      const res = await fetch(`/api/creneaux?date=${date}&coiffeur_id=${selected}`);
      if (res.ok) {
        const json = await res.json() as Creneau[] | { creneaux: Creneau[] };
        results[date] = Array.isArray(json) ? json : (json.creneaux ?? []);
      } else {
        results[date] = [];
      }
    }));
    setData(results);
    setLoading(false);
  }, [selected, dates.join(',')]); // eslint-disable-line

  useEffect(() => { void fetchPlanning(); }, [selected, weekOffset]); // eslint-disable-line

  // Collect all unique time slots across all days
  const allHeures = [...new Set(Object.values(data).flatMap(d => d.map(c => c.heure)))].sort();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs text-amber-400/60 uppercase tracking-[0.3em] mb-1">Administration</p>
            <h1 className="text-3xl font-thin text-white">Planning</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setWeekOffset(w => w - 1)} className="btn-glass px-3 py-2 text-sm">←</button>
            <span className="text-sm text-white/50">
              {new Date(dates[0]!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} –{' '}
              {new Date(dates[6]!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="btn-glass px-3 py-2 text-sm">→</button>
          </div>
        </div>

        <div className="glass p-4">
          <label className="label-dark">Coiffeur</label>
          <select value={selected} onChange={e => setSelected(e.target.value)} className="input-dark max-w-xs">
            {coiffeurs.map(c => <option key={c.id} value={c.id} className="bg-[#0e0e1a]">{c.nom}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="text-white/40 text-sm">Chargement…</p>
        ) : (
          <div className="glass overflow-x-auto">
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-white/30 font-medium w-16">Heure</th>
                  {dates.map((date, i) => (
                    <th key={date} className="px-3 py-3 text-center text-white/60 font-medium">
                      <div>{JOURS_COURTS[i]}</div>
                      <div className="text-white/30 font-normal">
                        {new Date(date + 'T00:00:00Z').getDate()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {allHeures.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-white/30">Aucun créneau configuré.</td></tr>
                ) : allHeures.map(heure => (
                  <tr key={heure} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-white/50 font-mono">{heure}</td>
                    {dates.map(date => {
                      const creneau = data[date]?.find(c => c.heure === heure);
                      return (
                        <td key={date} className="px-3 py-2 text-center">
                          {creneau ? (
                            <span className={`inline-block px-2 py-1 rounded-lg border text-[10px] font-medium ${slotColor(creneau)}`}>
                              {creneau.places_restantes}
                            </span>
                          ) : (
                            <span className="text-white/10">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-4 px-4 py-3 border-t border-white/[0.06]">
              {[
                { color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300', label: 'Disponible' },
                { color: 'bg-amber-500/20 border-amber-500/30 text-amber-300',       label: 'Dernière place' },
                { color: 'bg-red-500/20 border-red-500/30 text-red-300',             label: 'Complet / Bloqué' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`inline-block w-3 h-3 rounded border ${color}`} />
                  <span className="text-[10px] text-white/40">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
