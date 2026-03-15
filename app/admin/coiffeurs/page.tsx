'use client';

import { useEffect, useState, useCallback, KeyboardEvent } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Coiffeur {
  id: string;
  nom: string;
  actif: boolean;
  description: string | null;
  points_forts: string[] | null;
}

export default function CoiffeursPage() {
  const [coiffeurs, setCoiffeurs] = useState<Coiffeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addNom, setAddNom] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addPointsForts, setAddPointsForts] = useState<string[]>([]);
  const [addTagInput, setAddTagInput] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit modal state
  const [editCoiffeur, setEditCoiffeur] = useState<Coiffeur | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPointsForts, setEditPointsForts] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/coiffeurs');
    if (res.ok) setCoiffeurs(await res.json() as Coiffeur[]);
    setLoading(false);
  }, []);

  useEffect(() => { void fetch_(); }, [fetch_]);

  // ── Add handlers ──
  function handleAddTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && addTagInput.trim()) {
      e.preventDefault();
      const tag = addTagInput.trim().replace(/,+$/, '');
      if (tag && !addPointsForts.includes(tag)) {
        setAddPointsForts([...addPointsForts, tag]);
      }
      setAddTagInput('');
    }
  }

  function resetAddModal() {
    setAddNom('');
    setAddDescription('');
    setAddPointsForts([]);
    setAddTagInput('');
    setShowAddModal(false);
  }

  async function handleAdd() {
    if (!addNom.trim()) return;
    setAdding(true);
    await fetch('/api/admin/coiffeurs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: addNom.trim(),
        ...(addDescription.trim() && { description: addDescription.trim() }),
        ...(addPointsForts.length > 0 && { points_forts: addPointsForts }),
      }),
    });
    resetAddModal();
    setAdding(false);
    await fetch_();
  }

  // ── Edit handlers ──
  function openEdit(c: Coiffeur) {
    setEditCoiffeur(c);
    setEditNom(c.nom);
    setEditDescription(c.description ?? '');
    setEditPointsForts(c.points_forts ?? []);
    setEditTagInput('');
  }

  function handleEditTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && editTagInput.trim()) {
      e.preventDefault();
      const tag = editTagInput.trim().replace(/,+$/, '');
      if (tag && !editPointsForts.includes(tag)) {
        setEditPointsForts([...editPointsForts, tag]);
      }
      setEditTagInput('');
    }
  }

  async function handleSaveEdit() {
    if (!editCoiffeur || !editNom.trim()) return;
    setSaving(true);
    await fetch(`/api/admin/coiffeurs/${editCoiffeur.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: editNom.trim(),
        description: editDescription.trim() || null,
        points_forts: editPointsForts.length > 0 ? editPointsForts : null,
      }),
    });
    setSaving(false);
    setEditCoiffeur(null);
    await fetch_();
  }

  // ── Delete handler ──
  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce coiffeur ? Si des RDV futurs existent, il sera désactivé.')) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/coiffeurs/${id}`, { method: 'DELETE' });
    const data = await res.json() as { action: string };
    alert(data.action === 'deleted' ? 'Coiffeur supprimé.' : 'Coiffeur désactivé (RDV futurs existants).');
    setDeletingId(null);
    await fetch_();
  }

  const actifs   = coiffeurs.filter(c => c.actif);
  const inactifs = coiffeurs.filter(c => !c.actif);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-400/60 uppercase tracking-[0.3em] mb-1">Administration</p>
            <h1 className="text-3xl font-thin text-white">Coiffeurs</h1>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-amber text-sm">
            + Ajouter
          </button>
        </div>

        {loading ? (
          <p className="text-white/40 text-sm">Chargement…</p>
        ) : (
          <>
            <div className="space-y-3">
              <p className="text-xs text-white/40 uppercase tracking-widest">Actifs ({actifs.length})</p>
              {actifs.length === 0 && <p className="text-white/30 text-sm">Aucun coiffeur actif.</p>}
              {actifs.map(c => (
                <div key={c.id} className="glass p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white/90">{c.nom}</p>
                      <p className="text-xs text-white/35 mt-0.5 font-mono">{c.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="text-xs text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                  {c.description && (
                    <p className="text-xs text-white/40 leading-relaxed">{c.description}</p>
                  )}
                  {c.points_forts && c.points_forts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {c.points_forts.map(tag => (
                        <span key={tag} className="badge-glass text-[10px]">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {inactifs.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-white/40 uppercase tracking-widest">Inactifs ({inactifs.length})</p>
                {inactifs.map(c => (
                  <div key={c.id} className="glass p-5 flex items-center justify-between opacity-50">
                    <div>
                      <p className="font-medium text-white/90">{c.nom} <span className="badge-glass ml-2">Inactif</span></p>
                      <p className="text-xs text-white/35 mt-0.5 font-mono">{c.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal ajout */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-modal p-8 w-full max-w-sm space-y-5">
            <h2 className="text-xl font-thin text-white">Nouveau coiffeur</h2>
            <div>
              <label className="label-dark">Nom</label>
              <input
                value={addNom}
                onChange={e => setAddNom(e.target.value)}
                placeholder="Sophie Martin"
                className="input-dark"
                autoFocus
              />
            </div>
            <div>
              <label className="label-dark">Description <span className="text-white/25">(optionnel)</span></label>
              <textarea
                value={addDescription}
                onChange={e => setAddDescription(e.target.value)}
                placeholder="Spécialisée en colorations végétales..."
                className="input-dark min-h-[80px] resize-y"
                rows={3}
              />
            </div>
            <div>
              <label className="label-dark">Points forts <span className="text-white/25">(optionnel)</span></label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {addPointsForts.map(tag => (
                  <span
                    key={tag}
                    onClick={() => setAddPointsForts(addPointsForts.filter(t => t !== tag))}
                    className="badge-glass text-xs cursor-pointer hover:bg-red-500/20 hover:text-red-300 transition-colors"
                  >
                    {tag} &times;
                  </span>
                ))}
              </div>
              <input
                value={addTagInput}
                onChange={e => setAddTagInput(e.target.value)}
                onKeyDown={handleAddTagKey}
                placeholder="Tapez un tag puis Entrée"
                className="input-dark"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleAdd} disabled={adding || !addNom.trim()} className="btn-amber flex-1">
                {adding ? 'Ajout…' : 'Ajouter'}
              </button>
              <button onClick={resetAddModal} className="btn-glass flex-1">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal édition */}
      {editCoiffeur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-modal p-8 w-full max-w-sm space-y-5">
            <h2 className="text-xl font-thin text-white">Modifier le coiffeur</h2>
            <div>
              <label className="label-dark">Nom</label>
              <input
                value={editNom}
                onChange={e => setEditNom(e.target.value)}
                className="input-dark"
                autoFocus
              />
            </div>
            <div>
              <label className="label-dark">Description</label>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder="Spécialisée en colorations végétales..."
                className="input-dark min-h-[80px] resize-y"
                rows={3}
              />
            </div>
            <div>
              <label className="label-dark">Points forts</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {editPointsForts.map(tag => (
                  <span
                    key={tag}
                    onClick={() => setEditPointsForts(editPointsForts.filter(t => t !== tag))}
                    className="badge-glass text-xs cursor-pointer hover:bg-red-500/20 hover:text-red-300 transition-colors"
                  >
                    {tag} &times;
                  </span>
                ))}
              </div>
              <input
                value={editTagInput}
                onChange={e => setEditTagInput(e.target.value)}
                onKeyDown={handleEditTagKey}
                placeholder="Tapez un tag puis Entrée"
                className="input-dark"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveEdit} disabled={saving || !editNom.trim()} className="btn-amber flex-1">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button onClick={() => setEditCoiffeur(null)} className="btn-glass flex-1">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
