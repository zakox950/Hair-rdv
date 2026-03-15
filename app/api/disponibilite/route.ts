import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

type Statut = 'disponible' | 'indisponible' | 'complet';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coiffeur_id = searchParams.get('coiffeur_id');
  const mois = searchParams.get('mois'); // YYYY-MM

  if (!coiffeur_id || !mois || !/^\d{4}-\d{2}$/.test(mois)) {
    return NextResponse.json(
      { error: 'Parametres coiffeur_id et mois (YYYY-MM) requis.' },
      { status: 400 }
    );
  }

  // Coiffeur exists?
  const coiffeurRes = await pool.query(
    'SELECT id FROM coiffeur WHERE id = $1 AND actif = TRUE',
    [coiffeur_id]
  );
  if (coiffeurRes.rows.length === 0) {
    return NextResponse.json({ error: 'Coiffeur introuvable.' }, { status: 404 });
  }

  const [yearStr, monthStr] = mois.split('-') as [string, string];
  const year = Number(yearStr);
  const month = Number(monthStr); // 1-based
  const daysInMonth = new Date(year, month, 0).getDate();

  const todayStr = new Date().toISOString().split('T')[0]!;

  // Fetch all data in parallel
  const [joursFermesRes, horairesRes, settingsDureeRes, settingsCapRes, creneauxRes] =
    await Promise.all([
      // Closed days for this coiffeur in this month
      pool.query<{ date: string }>(
        `SELECT date::text FROM jour_ferme
         WHERE coiffeur_id = $1
           AND date >= $2 AND date <= $3`,
        [coiffeur_id, `${mois}-01`, `${mois}-${String(daysInMonth).padStart(2, '0')}`]
      ),
      // Weekly schedule
      pool.query<{ jour_semaine: number; ouvert: boolean; heure_ouverture: string; heure_fermeture: string }>(
        'SELECT jour_semaine, ouvert, heure_ouverture, heure_fermeture FROM horaires WHERE coiffeur_id = $1',
        [coiffeur_id]
      ),
      // Slot duration
      pool.query<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'duree_creneau_minutes'"
      ),
      // Default capacity
      pool.query<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'capacite_defaut'"
      ),
      // All creneaux for this month
      pool.query<{ jour: string; heure_debut: string; places_restantes: number; bloque: boolean }>(
        `SELECT jour::text, heure_debut, places_restantes, bloque FROM creneau
         WHERE coiffeur_id = $1
           AND jour >= $2 AND jour <= $3`,
        [coiffeur_id, `${mois}-01`, `${mois}-${String(daysInMonth).padStart(2, '0')}`]
      ),
    ]);

  const joursFermesSet = new Set(joursFermesRes.rows.map(r => r.date));

  const horairesMap = new Map(
    horairesRes.rows.map(r => [r.jour_semaine, r])
  );

  const duree = Number(settingsDureeRes.rows[0]?.value ?? 30);
  const capaciteDefaut = Number(settingsCapRes.rows[0]?.value ?? 1);

  // Group creneaux by day
  const creneauxByDay = new Map<string, typeof creneauxRes.rows>();
  for (const row of creneauxRes.rows) {
    const dayKey = row.jour;
    if (!creneauxByDay.has(dayKey)) creneauxByDay.set(dayKey, []);
    creneauxByDay.get(dayKey)!.push(row);
  }

  const jours: { date: string; statut: Statut }[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${mois}-${String(day).padStart(2, '0')}`;

    // Past day
    if (dateStr < todayStr) {
      jours.push({ date: dateStr, statut: 'indisponible' });
      continue;
    }

    // Closed day
    if (joursFermesSet.has(dateStr)) {
      jours.push({ date: dateStr, statut: 'indisponible' });
      continue;
    }

    // Check weekly schedule
    const jsDate = new Date(dateStr + 'T00:00:00Z');
    const jourSemaine = jsDate.getUTCDay(); // 0=dim ... 6=sam
    const horaire = horairesMap.get(jourSemaine);

    if (!horaire || !horaire.ouvert) {
      jours.push({ date: dateStr, statut: 'indisponible' });
      continue;
    }

    // Generate theoretical slots
    const [sh, sm] = horaire.heure_ouverture.split(':').map(Number) as [number, number];
    const [eh, em] = horaire.heure_fermeture.split(':').map(Number) as [number, number];
    let minutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const totalSlots: string[] = [];
    while (minutes < endMinutes) {
      const h = String(Math.floor(minutes / 60)).padStart(2, '0');
      const m = String(minutes % 60).padStart(2, '0');
      totalSlots.push(`${h}:${m}`);
      minutes += duree;
    }

    if (totalSlots.length === 0) {
      jours.push({ date: dateStr, statut: 'indisponible' });
      continue;
    }

    // Check availability of each slot
    const dayCreneaux = creneauxByDay.get(dateStr) ?? [];
    const creneauxMap = new Map(
      dayCreneaux.map(r => [r.heure_debut.slice(0, 5), r])
    );

    let hasAvailable = false;
    for (const heure of totalSlots) {
      const creneau = creneauxMap.get(heure);
      if (creneau?.bloque) continue;
      const places = creneau?.places_restantes ?? capaciteDefaut;
      if (places > 0) {
        hasAvailable = true;
        break;
      }
    }

    jours.push({ date: dateStr, statut: hasAvailable ? 'disponible' : 'complet' });
  }

  return NextResponse.json({ jours });
}
