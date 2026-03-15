'use client';

import { useEffect, useState, useCallback } from 'react';

interface Coiffeur { id: string; nom: string; }
interface Creneau  { heure: string; places_restantes: number; disponible: boolean; }
interface CreneauxResponse { creneaux: Creneau[]; raison?: string; }
type Statut    = 'disponible' | 'indisponible' | 'complet';
type Step      = 1 | 2 | 3 | 4;
type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface Props { services: string[]; }

// -- Calendar ----------------------------------------------------------------

const MONTHS_FR = [
  'Janvier','Fevrier','Mars','Avril','Mai','Juin',
  'Juillet','Aout','Septembre','Octobre','Novembre','Decembre',
];
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

function todayStr() { return new Date().toISOString().split('T')[0]!; }

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function toMoisStr(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function Calendar({
  selected,
  onSelect,
  disponibilite,
  onMonthChange,
}: {
  selected: string;
  onSelect: (d: string) => void;
  disponibilite: Map<string, Statut>;
  onMonthChange: (year: number, month: number) => void;
}) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const today_str = todayStr();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const rawFirst    = new Date(viewYear, viewMonth, 1).getDay();
  const firstOffset = (rawFirst + 6) % 7;

  const cells: (number | null)[] = [
    ...Array<null>(firstOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  function prevMonth() {
    let newYear = viewYear;
    let newMonth = viewMonth;
    if (viewMonth === 0) { newYear -= 1; newMonth = 11; }
    else { newMonth -= 1; }
    setViewYear(newYear);
    setViewMonth(newMonth);
    onMonthChange(newYear, newMonth);
  }
  function nextMonth() {
    let newYear = viewYear;
    let newMonth = viewMonth;
    if (viewMonth === 11) { newYear += 1; newMonth = 0; }
    else { newMonth += 1; }
    setViewYear(newYear);
    setViewMonth(newMonth);
    onMonthChange(newYear, newMonth);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="p-2 text-white/40 hover:text-white disabled:opacity-20 transition-colors"
        >
          &larr;
        </button>
        <span className="text-sm font-light text-white/70">
          {MONTHS_FR[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-2 text-white/40 hover:text-white transition-colors"
        >
          &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DAYS_FR.map(d => (
          <div key={d} className="text-[10px] text-white/25 py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const ds       = toDateStr(viewYear, viewMonth, day);
          const isPast   = ds < today_str;
          const isToday  = ds === today_str;
          const isSel    = ds === selected;
          const statut   = disponibilite.get(ds);
          const blocked  = isPast || statut === 'indisponible' || statut === 'complet';

          return (
            <button
              key={ds}
              onClick={() => !blocked && onSelect(ds)}
              disabled={blocked}
              className={[
                'w-full aspect-square rounded-xl text-xs transition-all relative',
                blocked ? 'text-white/15 cursor-not-allowed' : 'cursor-pointer hover:bg-white/[0.08]',
                isSel   ? 'bg-amber-400 !text-black hover:bg-amber-400' : '',
                isToday && !isSel && !blocked ? 'text-amber-400 ring-1 ring-amber-400/40' : '',
                !isSel && !blocked && !isToday ? 'text-white/55' : '',
                statut === 'complet' && !isPast ? 'line-through' : '',
              ].filter(Boolean).join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 pt-1">
        <span className="flex items-center gap-1.5 text-[10px] text-white/40">
          <span className="w-2 h-2 rounded-full bg-white/55 inline-block" /> disponible
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-white/40">
          <span className="w-2 h-2 rounded-full bg-white/15 inline-block" /> indisponible
        </span>
      </div>
    </div>
  );
}

// -- Step label helper --------------------------------------------------------

function formatDate(ds: string) {
  return new Date(ds + 'T00:00:00Z').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

// -- Main component -----------------------------------------------------------

export default function BookingForm({ services }: Props) {
  const [step,      setStep]      = useState<Step>(1);
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg,  setErrorMsg]  = useState('');

  const [coiffeur, setCoiffeur] = useState<Coiffeur | null>(null);
  const [date,     setDate]     = useState('');
  const [heure,    setHeure]    = useState('');

  const [nom,       setNom]       = useState('');
  const [email,     setEmail]     = useState('');
  const [telephone, setTelephone] = useState('');
  const [service,   setService]   = useState('');
  const [rgpd,      setRgpd]      = useState(false);
  const [trap,      setTrap]      = useState('');

  const [coiffeurs,        setCoiffeurs]        = useState<Coiffeur[]>([]);
  const [creneaux,         setCreneaux]         = useState<Creneau[]>([]);
  const [creneauxRaison,   setCreneauxRaison]   = useState<string | null>(null);
  const [loadingCreneaux,  setLoadingCreneaux]  = useState(false);
  const [disponibilite,    setDisponibilite]    = useState<Map<string, Statut>>(new Map());

  // Fetch disponibilite for a given month
  const fetchDisponibilite = useCallback(async (coiffeurId: string, year: number, month: number) => {
    const mois = toMoisStr(year, month);
    try {
      const res = await fetch(`/api/disponibilite?coiffeur_id=${coiffeurId}&mois=${mois}`);
      if (!res.ok) return;
      const data = await res.json() as { jours: { date: string; statut: Statut }[] };
      setDisponibilite(prev => {
        const next = new Map(prev);
        for (const j of data.jours) {
          next.set(j.date, j.statut);
        }
        return next;
      });
    } catch {
      // silently ignore
    }
  }, []);

  // Load coiffeurs on mount
  useEffect(() => {
    fetch('/api/coiffeurs')
      .then(r => r.json() as Promise<Coiffeur[]>)
      .then(d => setCoiffeurs(d))
      .catch(console.error);
  }, []);

  // Fetch disponibilite when entering step 2 or coiffeur changes
  useEffect(() => {
    if (step !== 2 || !coiffeur) return;
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    // Fetch current month and next month in parallel
    let nextYear = curYear;
    let nextMonth = curMonth + 1;
    if (nextMonth > 11) { nextYear += 1; nextMonth = 0; }
    setDisponibilite(new Map());
    Promise.all([
      fetchDisponibilite(coiffeur.id, curYear, curMonth),
      fetchDisponibilite(coiffeur.id, nextYear, nextMonth),
    ]);
  }, [step, coiffeur, fetchDisponibilite]);

  // Fetch time slots when entering step 3
  useEffect(() => {
    if (step !== 3 || !coiffeur || !date) return;
    setLoadingCreneaux(true);
    setCreneaux([]);
    setCreneauxRaison(null);
    setHeure('');
    fetch(`/api/creneaux?date=${date}&coiffeur_id=${coiffeur.id}`)
      .then(r => r.json() as Promise<Creneau[] | CreneauxResponse>)
      .then(d => {
        if (Array.isArray(d)) {
          // Legacy format: array of creneaux
          setCreneaux(d);
          setCreneauxRaison(null);
        } else {
          // New format: { creneaux: [], raison?: string }
          setCreneaux(d.creneaux ?? []);
          setCreneauxRaison(d.raison ?? null);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingCreneaux(false));
  }, [step, coiffeur, date]);

  function handleMonthChange(year: number, month: number) {
    if (!coiffeur) return;
    fetchDisponibilite(coiffeur.id, year, month);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!coiffeur || !date || !heure) return;
    setFormState('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/reservations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom, email, telephone, service,
          date, heure,
          coiffeur_id: coiffeur.id,
          _trap: trap,
        }),
      });
      if (res.ok) {
        setFormState('success');
      } else {
        const data = await res.json() as { error?: string };
        setErrorMsg(data.error ?? 'Une erreur est survenue.');
        setFormState('error');
      }
    } catch {
      setErrorMsg('Impossible de joindre le serveur. Reessayez.');
      setFormState('error');
    }
  }

  function reset() {
    setStep(1); setCoiffeur(null); setDate(''); setHeure('');
    setNom(''); setEmail(''); setTelephone(''); setService(''); setRgpd(false);
    setFormState('idle'); setErrorMsg('');
    setDisponibilite(new Map());
  }

  // -- Success screen --
  if (formState === 'success') {
    return (
      <div className="glass p-10 text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center mx-auto">
          <span className="text-amber-400 text-xl">&#10003;</span>
        </div>
        <div>
          <h3 className="text-xl font-light text-white">Demande envoyee&nbsp;!</h3>
          <p className="text-white/45 text-sm mt-2">
            Vous recevrez un email de confirmation sous peu.
          </p>
        </div>
        <button
          onClick={reset}
          className="text-sm text-white/40 hover:text-white/70 transition-colors underline underline-offset-4"
        >
          Faire une autre reservation
        </button>
      </div>
    );
  }

  const STEP_LABELS = ['Coiffeur', 'Date', 'Creneau', 'Vos infos'];

  // -- Main form shell --
  return (
    <div className="glass p-6 sm:p-8 space-y-6">

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          {STEP_LABELS.map((label, i) => (
            <span
              key={label}
              className={`text-[10px] uppercase tracking-widest transition-colors ${
                step === i + 1 ? 'text-amber-400' : 'text-white/25'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* -- Step 1: Coiffeur -- */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-base font-light text-white/70">Choisissez votre coiffeur</h2>
          {coiffeurs.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">Chargement...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {coiffeurs.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setCoiffeur(c); setStep(2); }}
                  className="glass-sm p-5 text-left hover:bg-white/[0.07] transition-all group"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-400/15 border border-amber-400/20 flex items-center justify-center mb-3">
                    <span className="text-amber-400 text-sm font-medium">{c.nom.charAt(0)}</span>
                  </div>
                  <p className="text-white/80 font-medium text-sm">{c.nom}</p>
                  <p className="text-xs text-white/30 mt-0.5 group-hover:text-amber-400/60 transition-colors">
                    Selectionner &rarr;
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -- Step 2: Date -- */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-base font-light text-white/70">Choisissez une date</h2>
          <p className="text-xs text-white/35">
            Coiffeur&nbsp;: <span className="text-white/60">{coiffeur?.nom}</span>
          </p>
          <Calendar
            selected={date}
            onSelect={d => { setDate(d); setStep(3); }}
            disponibilite={disponibilite}
            onMonthChange={handleMonthChange}
          />
          <BackBtn onClick={() => setStep(1)} />
        </div>
      )}

      {/* -- Step 3: Time slot -- */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-base font-light text-white/70">Choisissez un creneau</h2>
          <p className="text-xs text-white/35">
            {coiffeur?.nom}&nbsp;&middot;&nbsp;{formatDate(date)}
          </p>

          {loadingCreneaux ? (
            <p className="text-white/30 text-sm text-center py-8">Chargement...</p>
          ) : creneauxRaison === 'jour_ferme' || creneauxRaison === 'horaire_ferme' ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-white/40 text-sm">Ce jour n&apos;est pas travaille.</p>
              <button
                onClick={() => setStep(2)}
                className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
              >
                &larr; Choisir une autre date
              </button>
            </div>
          ) : creneaux.length === 0 || creneaux.every(c => !c.disponible) ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-white/40 text-sm">Aucun creneau disponible ce jour-la.</p>
              <button
                onClick={() => setStep(2)}
                className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
              >
                &larr; Choisir une autre date
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {creneaux.map(c => (
                  <button
                    key={c.heure}
                    onClick={() => { if (c.disponible) { setHeure(c.heure); setStep(4); } }}
                    disabled={!c.disponible}
                    className={[
                      'py-2.5 rounded-xl border text-sm font-mono transition-all',
                      !c.disponible
                        ? 'border-white/5 text-white/20 cursor-not-allowed bg-white/[0.02]'
                        : heure === c.heure
                          ? 'bg-amber-400 border-amber-400 text-black'
                          : 'border-white/10 text-white/60 hover:border-amber-400/40 hover:text-white hover:bg-white/[0.05]',
                    ].filter(Boolean).join(' ')}
                  >
                    <span>{c.heure}</span>
                    {!c.disponible && (
                      <span className="block text-[11px] leading-tight mt-0.5 opacity-50">Complet</span>
                    )}
                  </button>
                ))}
              </div>
              <BackBtn onClick={() => setStep(2)} />
            </>
          )}
        </div>
      )}

      {/* -- Step 4: Client info -- */}
      {step === 4 && (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <h2 className="text-base font-light text-white/70">Vos informations</h2>
          <p className="text-xs text-white/35">
            {coiffeur?.nom}&nbsp;&middot;&nbsp;{formatDate(date)}&nbsp;&middot;&nbsp;{heure}
          </p>

          {/* Honeypot -- invisible to real users */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <input
              name="_trap" type="text" tabIndex={-1} autoComplete="off"
              value={trap} onChange={e => setTrap(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Nom complet">
              <input
                type="text" required minLength={2} maxLength={100}
                placeholder="Marie Dupont"
                value={nom} onChange={e => setNom(e.target.value)}
                className="input-dark"
              />
            </Field>
            <Field label="Telephone">
              <input
                type="tel" required minLength={8} maxLength={20}
                placeholder="+33 6 12 34 56 78"
                value={telephone} onChange={e => setTelephone(e.target.value)}
                className="input-dark"
              />
            </Field>
          </div>

          <Field label="Adresse e-mail">
            <input
              type="email" required
              placeholder="marie@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              className="input-dark"
            />
          </Field>

          <Field label="Prestation">
            <select
              required
              value={service} onChange={e => setService(e.target.value)}
              className="input-dark cursor-pointer"
            >
              <option value="" className="bg-[#0e0e1a]">Choisir une prestation...</option>
              {services.map(s => (
                <option key={s} value={s} className="bg-[#0e0e1a]">{s}</option>
              ))}
            </select>
          </Field>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox" required
              checked={rgpd} onChange={e => setRgpd(e.target.checked)}
              className="mt-0.5 accent-amber-400 shrink-0"
            />
            <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">
              J&apos;accepte que mes donnees soient utilisees pour la gestion de mon rendez-vous,
              conformement a la{' '}
              <a href="/confidentialite" className="text-amber-400/70 hover:text-amber-400 underline underline-offset-2">
                politique de confidentialite
              </a>.
            </span>
          </label>

          {formState === 'error' && (
            <p className="text-sm text-red-300 bg-red-900/25 border border-red-500/20 rounded-xl px-4 py-3">
              {errorMsg}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="btn-glass px-5 py-3 text-sm"
            >
              &larr; Retour
            </button>
            <button
              type="submit"
              disabled={formState === 'submitting' || !rgpd}
              className="flex-1 btn-amber disabled:opacity-50 disabled:cursor-not-allowed py-3"
            >
              {formState === 'submitting' ? 'Envoi en cours...' : 'Confirmer le rendez-vous'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-white/30 hover:text-white/60 transition-colors"
    >
      &larr; Retour
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs text-white/45 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}
