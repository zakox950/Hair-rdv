'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Coiffeur { id: string; nom: string; }
interface Horaire { id: string; jour_semaine: number; heure_ouverture: string; heure_fermeture: string; ouvert: boolean; }

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function HorairesPage() {
  const [coiffeurs, setCoiffeurs] = useState<Coiffeur[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [horaires, setHoraires] = useState<Horaire[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/coiffeurs')
      .then(r => r.json())
      .then((data: Coiffeur[]) => { setCoiffeurs(data); if (data[0]) setSelected(data[0].id); })
      .catch(console.error);
  }, []);

  const fetchHoraires = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/horaires?coiffeur_id=${id}`);
    if (res.ok) {
      const data = await res.json() as Horaire[];
      // Normalize HH:MM:SS → HH:MM (PostgreSQL TIME includes seconds)
      setHoraires(data.map(h => ({
        ...h,
        heure_ouverture: h.heure_ouverture.slice(0, 5),
        heure_fermeture: h.heure_fermeture.slice(0, 5),
      })));
    }
  }, []);

  useEffect(() => { if (selected) void fetchHoraires(selected); }, [selected, fetchHoraires]);

  function updateHoraire(jour: number, field: keyof Horaire, value: string | boolean) {
    setHoraires(prev => prev.map(h => h.jour_semaine === jour ? { ...h, [field]: value } : h));
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/horaires?coiffeur_id=${selected}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(horaires.map(h => ({
        jour_semaine:    h.jour_semaine,
        heure_ouverture: h.heure_ouverture,
        heure_fermeture: h.heure_fermeture,
        ouvert:          h.ouvert,
      }))),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <p className="text-xs text-amber-400/60 uppercase tracking-[0.3em] mb-1">Administration</p>
          <h1 className="text-3xl font-thin text-white">Horaires</h1>
        </div>

        {/* Sélecteur coiffeur */}
        <div className="glass p-5">
          <label className="label-dark">Coiffeur</label>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="input-dark"
          >
            {coiffeurs.map(c => <option key={c.id} value={c.id} className="bg-[#0e0e1a]">{c.nom}</option>)}
          </select>
        </div>

        {/* Toast confirmation */}
        {saved && (
          <div className="bg-green-500/20 border border-green-500/40 text-green-300 text-sm px-4 py-2 rounded-lg text-center transition-opacity">
            Horaires enregistrés ✓
          </div>
        )}

        {/* Grille des jours */}
        {horaires.length > 0 && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 0].map(jour => {
              const h = horaires.find(x => x.jour_semaine === jour);
              if (!h) return null;
              return (
                <div key={jour} className="glass p-5 flex flex-wrap items-center gap-4">
                  <p className="w-28 text-sm font-medium text-white/80">{JOURS[jour]}</p>

                  {/* Toggle ouvert */}
                  <button
                    onClick={() => updateHoraire(jour, 'ouvert', !h.ouvert)}
                    className={`toggle-track ${h.ouvert ? 'active' : ''}`}
                    aria-pressed={h.ouvert}
                  >
                    <span className="toggle-thumb" />
                  </button>
                  <span className="text-xs text-white/40 w-12">{h.ouvert ? 'Ouvert' : 'Fermé'}</span>

                  {h.ouvert && (
                    <>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-white/40">De</label>
                        <input
                          type="time"
                          value={h.heure_ouverture}
                          onChange={e => updateHoraire(jour, 'heure_ouverture', e.target.value)}
                          className="input-dark w-32"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-white/40">À</label>
                        <input
                          type="time"
                          value={h.heure_fermeture}
                          onChange={e => updateHoraire(jour, 'heure_fermeture', e.target.value)}
                          className="input-dark w-32"
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            <button onClick={handleSave} disabled={saving} className="btn-amber w-full">
              {saving ? 'Sauvegarde…' : 'Enregistrer les horaires'}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
