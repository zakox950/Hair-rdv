'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Coiffeur  { id: string; nom: string; }
interface Fermeture { id: string; date: string; motif: string | null; }

export default function FermeturesPage() {
  const [coiffeurs, setCoiffeurs]   = useState<Coiffeur[]>([]);
  const [selected, setSelected]     = useState('');
  const [fermetures, setFermetures] = useState<Fermeture[]>([]);
  const [date, setDate]   = useState('');
  const [motif, setMotif] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch('/api/admin/coiffeurs')
      .then(r => r.json())
      .then((d: Coiffeur[]) => { setCoiffeurs(d); if (d[0]) setSelected(d[0].id); })
      .catch(console.error);
  }, []);

  const fetchFermetures = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/fermetures?coiffeur_id=${id}`);
    if (res.ok) setFermetures(await res.json() as Fermeture[]);
  }, []);

  useEffect(() => { if (selected) void fetchFermetures(selected); }, [selected, fetchFermetures]);

  async function handleAdd() {
    if (!date) return;
    setAdding(true);
    await fetch(`/api/admin/fermetures?coiffeur_id=${selected}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, motif: motif || undefined }),
    });
    setDate(''); setMotif('');
    setAdding(false);
    await fetchFermetures(selected);
  }

  async function handleDelete(d: string) {
    await fetch(`/api/admin/fermetures?coiffeur_id=${selected}&date=${d}`, { method: 'DELETE' });
    await fetchFermetures(selected);
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <p className="text-xs text-amber-400/60 uppercase tracking-[0.3em] mb-1">Administration</p>
          <h1 className="text-3xl font-thin text-white">Fermetures exceptionnelles</h1>
        </div>

        <div className="glass p-5">
          <label className="label-dark">Coiffeur</label>
          <select value={selected} onChange={e => setSelected(e.target.value)} className="input-dark">
            {coiffeurs.map(c => <option key={c.id} value={c.id} className="bg-[#0e0e1a]">{c.nom}</option>)}
          </select>
        </div>

        {/* Ajout date */}
        <div className="glass p-6 space-y-4">
          <h2 className="text-base font-light text-white/70">Ajouter un jour fermé</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-dark">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-dark" />
            </div>
            <div>
              <label className="label-dark">Motif (optionnel)</label>
              <input value={motif} onChange={e => setMotif(e.target.value)} placeholder="Congés, férié…" className="input-dark" />
            </div>
          </div>
          <button onClick={handleAdd} disabled={adding || !date} className="btn-amber">
            {adding ? 'Ajout…' : 'Ajouter'}
          </button>
        </div>

        {/* Liste */}
        <div className="space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-widest">{fermetures.length} jour(s) fermé(s)</p>
          {fermetures.length === 0 && <p className="text-white/30 text-sm">Aucune fermeture enregistrée.</p>}
          {fermetures.map(f => {
            const isPast = f.date < new Date().toISOString().split('T')[0]!;
            return (
              <div key={f.id} className={`glass p-5 flex items-center justify-between ${isPast ? 'opacity-40' : ''}`}>
                <div>
                  <p className="font-medium text-white/90">
                    {new Date(f.date + 'T00:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    {isPast && <span className="badge-glass ml-2 text-[10px]">Passé</span>}
                  </p>
                  {f.motif && <p className="text-xs text-white/40 mt-0.5">{f.motif}</p>}
                </div>
                {!isPast && (
                  <button onClick={() => handleDelete(f.date)} className="text-xs text-red-400/70 hover:text-red-400 transition-colors">
                    Supprimer
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
