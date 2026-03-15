import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

interface CreneauResult {
  heure: string;
  places_restantes: number;
  disponible: boolean;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date        = searchParams.get('date');
  const coiffeur_id = searchParams.get('coiffeur_id');

  if (!date || !coiffeur_id) {
    return NextResponse.json({ error: 'Paramètres date et coiffeur_id requis.' }, { status: 400 });
  }

  // 1. Coiffeur existe
  const coiffeurRes = await pool.query(
    'SELECT id FROM coiffeur WHERE id = $1 AND actif = TRUE',
    [coiffeur_id]
  );
  if (coiffeurRes.rows.length === 0) {
    return NextResponse.json({ error: 'Coiffeur introuvable.' }, { status: 404 });
  }

  // 2. Jour fermé ?
  const fermeRes = await pool.query(
    'SELECT id FROM jour_ferme WHERE coiffeur_id = $1 AND date = $2',
    [coiffeur_id, date]
  );
  if (fermeRes.rows.length > 0) {
    return NextResponse.json({ creneaux: [], raison: 'jour_ferme' });
  }

  // 3. Horaires du coiffeur pour ce jour de la semaine
  const jsDate = new Date(date + 'T00:00:00Z');
  const jourSemaine = jsDate.getUTCDay(); // 0=dim … 6=sam

  const horaireRes = await pool.query<{
    heure_ouverture: string;
    heure_fermeture: string;
    ouvert: boolean;
  }>(
    'SELECT heure_ouverture, heure_fermeture, ouvert FROM horaires WHERE coiffeur_id = $1 AND jour_semaine = $2',
    [coiffeur_id, jourSemaine]
  );

  if (horaireRes.rows.length === 0 || !horaireRes.rows[0]!.ouvert) {
    return NextResponse.json({ creneaux: [], raison: 'horaire_ferme' });
  }

  const { heure_ouverture, heure_fermeture } = horaireRes.rows[0]!;

  // 4. Durée créneau depuis settings
  const settingsRes = await pool.query<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'duree_creneau_minutes'"
  );
  const duree = Number(settingsRes.rows[0]?.value ?? 30);

  // 5. Générer créneaux
  const [sh, sm] = heure_ouverture.split(':').map(Number) as [number, number];
  const [eh, em] = heure_fermeture.split(':').map(Number) as [number, number];
  let minutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const heures: string[] = [];
  while (minutes < endMinutes) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    heures.push(`${h}:${m}`);
    minutes += duree;
  }

  // 6. Places restantes depuis la DB (ou capacite_defaut si pas encore créé)
  const settingsCapRes = await pool.query<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'capacite_defaut'"
  );
  const capaciteDefaut = Number(settingsCapRes.rows[0]?.value ?? 1);

  const creneauxRes = await pool.query<{
    heure_debut: string;
    places_restantes: number;
    bloque: boolean;
  }>(
    `SELECT heure_debut, places_restantes, bloque FROM creneau
     WHERE coiffeur_id = $1 AND jour = $2`,
    [coiffeur_id, date]
  );

  const creneauxMap = new Map(
    creneauxRes.rows.map((r) => [r.heure_debut.slice(0, 5), r])
  );

  const results: CreneauResult[] = heures.map((heure) => {
    const creneau = creneauxMap.get(heure);
    if (creneau?.bloque) {
      return { heure, places_restantes: 0, disponible: false };
    }
    const places = creneau?.places_restantes ?? capaciteDefaut;
    return { heure, places_restantes: places, disponible: places > 0 };
  });

  return NextResponse.json(results);
}
