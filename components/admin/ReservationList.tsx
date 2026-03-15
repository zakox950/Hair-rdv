'use client';

import { useEffect, useState, useCallback } from 'react';

type Status = 'pending' | 'pending_verification' | 'confirmed' | 'cancelled' | 'present' | 'no_show';

interface Reservation {
  id: number;
  name: string;
  email: string;
  phone: string;
  service: string;
  booking_date: string;
  booking_time: string;
  status: Status;
  notes: string | null;
  created_at: string;
  coiffeur_nom: string | null;
  loyalty_tier: 'silver' | 'gold' | 'platinum' | null;
}

const STATUS_LABEL: Record<Status, string> = {
  pending:              'En attente',
  pending_verification: 'Vérification',
  confirmed:            'Confirmé',
  cancelled:            'Annulé',
  present:              'Présent',
  no_show:              'No-show',
};

const STATUS_CLASS: Record<Status, string> = {
  pending:              'badge-amber',
  pending_verification: 'bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] px-2 py-0.5 rounded-full font-medium',
  confirmed:            'badge-green',
  cancelled:            'badge-red',
  present:              'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] px-2 py-0.5 rounded-full font-medium',
  no_show:              'bg-white/10 text-white/40 border border-white/10 text-[10px] px-2 py-0.5 rounded-full font-medium',
};

const TIER_CLASS: Record<string, string> = {
  silver:   'text-slate-300',
  gold:     'text-amber-400',
  platinum: 'text-cyan-300',
};

type FilterStatus = 'all' | Status;

export default function ReservationList() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<FilterStatus>('all');
  const [coiffeurFilter, setCoiffeurFilter] = useState('all');
  const [updating, setUpdating]         = useState<number | null>(null);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/reservations');
    if (res.ok) setReservations(await res.json() as Reservation[]);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchReservations(); }, [fetchReservations]);

  async function patchStatus(id: number, status: Status) {
    setUpdating(id);
    await fetch(`/api/admin/reservations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    setUpdating(null);
  }

  // Unique coiffeur names for filter
  const coiffeurs = [...new Set(reservations.map(r => r.coiffeur_nom).filter(Boolean))] as string[];

  const filtered = reservations.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (coiffeurFilter !== 'all' && r.coiffeur_nom !== coiffeurFilter) return false;
    return true;
  });

  const counts = {
    all:       reservations.length,
    pending:   reservations.filter(r => r.status === 'pending').length,
    pending_verification: reservations.filter(r => r.status === 'pending_verification').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    present:   reservations.filter(r => r.status === 'present').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    no_show:   reservations.filter(r => r.status === 'no_show').length,
  };

  return (
    <div className="space-y-5">
      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: 'all',                  label: `Tous (${counts.all})` },
            { key: 'pending',              label: `En attente (${counts.pending})` },
            { key: 'pending_verification', label: `Vérification (${counts.pending_verification})` },
            { key: 'confirmed',            label: `Confirmés (${counts.confirmed})` },
            { key: 'present',              label: `Présents (${counts.present})` },
            { key: 'cancelled',            label: `Annulés (${counts.cancelled})` },
            { key: 'no_show',              label: `No-shows (${counts.no_show})` },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              filter === key
                ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Coiffeur filter */}
      {coiffeurs.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/35 uppercase tracking-widest">Coiffeur</span>
          <select
            value={coiffeurFilter}
            onChange={e => setCoiffeurFilter(e.target.value)}
            className="input-dark py-1.5 text-xs max-w-[200px]"
          >
            <option value="all" className="bg-[#0e0e1a]">Tous</option>
            {coiffeurs.map(c => (
              <option key={c} value={c} className="bg-[#0e0e1a]">{c}</option>
            ))}
          </select>
        </div>
      )}

      {/* Table */}
      <div className="glass overflow-hidden">
        {loading ? (
          <p className="p-8 text-white/30 text-sm text-center">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-white/30 text-sm text-center">Aucune réservation.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[800px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Date', 'Coiffeur', 'Client', 'Contact', 'Prestation', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] text-white/30 uppercase tracking-widest font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-white/70 font-mono">
                      <div>{new Date(r.booking_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</div>
                      <div className="text-white/35">{r.booking_time.slice(0, 5)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-white/60">
                      {r.coiffeur_nom ?? <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-white/80 font-medium">{r.name}</span>
                        {r.loyalty_tier && (
                          <span className={`text-[9px] uppercase tracking-widest font-semibold ${TIER_CLASS[r.loyalty_tier]}`}>
                            {r.loyalty_tier}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white/60">{r.email}</div>
                      <div className="text-white/30">{r.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-white/50">{r.service}</td>
                    <td className="px-4 py-3">
                      <span className={STATUS_CLASS[r.status]}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {(r.status === 'pending' || r.status === 'pending_verification') && (
                          <>
                            <ActionBtn
                              label="Confirmer"
                              color="text-emerald-400"
                              disabled={updating === r.id}
                              onClick={() => patchStatus(r.id, 'confirmed')}
                            />
                            <ActionBtn
                              label="Annuler"
                              color="text-red-400"
                              disabled={updating === r.id}
                              onClick={() => patchStatus(r.id, 'cancelled')}
                            />
                          </>
                        )}
                        {r.status === 'confirmed' && (
                          <>
                            <ActionBtn
                              label="Présent"
                              color="text-cyan-400"
                              disabled={updating === r.id}
                              onClick={() => patchStatus(r.id, 'present')}
                            />
                            <ActionBtn
                              label="No-show"
                              color="text-white/40"
                              disabled={updating === r.id}
                              onClick={() => patchStatus(r.id, 'no_show')}
                            />
                            <ActionBtn
                              label="Annuler"
                              color="text-red-400"
                              disabled={updating === r.id}
                              onClick={() => patchStatus(r.id, 'cancelled')}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  label, color, disabled, onClick,
}: {
  label: string; color: string; disabled: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${color} hover:brightness-125 disabled:opacity-40 transition-all text-[11px] font-medium`}
    >
      {label}
    </button>
  );
}
